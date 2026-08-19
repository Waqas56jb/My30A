import { query, withTransaction } from '../config/db.js';
import { errors } from '../utils/errors.js';
import { airportFare, cancellationPreview } from './pricingService.js';
import { recordAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import { sendOfficial } from '../integrations/email/emailService.js';
import { emitStatus } from '../sockets/io.js';
import type { AuthAccount, TransferStatus } from '../types/index.js';

const ALLOWED: Record<string, TransferStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['payment_authorized', 'driver_assigned', 'cancelled'],
  payment_authorized: ['driver_assigned', 'cancelled', 'no_show'],
  driver_assigned: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export async function nextTransferId() {
  const { rows } = await query<{ n: string }>(
    `select coalesce(max(substring(id from 4)::int), 2000)::text as n
     from airport_transfers where id ~ '^TR-[0-9]+$'`,
  );
  return `TR-${Number(rows[0]?.n ?? 2000) + 1}`;
}

export async function createTransferRequest(
  account: AuthAccount,
  input: {
    airport: string;
    date: string;
    time: string;
    flightNumber?: string;
    passengers: number;
    bags?: number;
    vehicleClass?: string;
    direction?: string;
    specialRequests?: string;
    createdBy?: string;
  },
) {
  if (!account.propertyId) throw errors.propertyDenied();
  const vehicle = input.vehicleClass ?? 'suv';
  const fare = await airportFare(input.airport, vehicle, input.bags ?? 0);
  const id = await nextTransferId();
  const now = new Date().toISOString();

  await withTransaction(async (client) => {
    await client.query(
      `insert into airport_transfers (
        id, guest_id, property_id, stay_id, status, direction, airport, flight_number,
        pickup_date, pickup_time, passengers, bags, vehicle_id, quoted_fare_cents,
        payment_status, timeline, special_requests, created_by
      ) values ($1,$2,$3,$4,'pending',$5,$6,$7,$8,$9,$10,$11,$12,$13,'not_required',$14,$15,$16)`,
      [
        id, account.id, account.propertyId, account.stayId ?? null, input.direction ?? 'arrival',
        input.airport, input.flightNumber ?? null, input.date, input.time, input.passengers,
        input.bags ?? 0, vehicle, fare,
        JSON.stringify([{ status: 'pending', at: now, note: 'Transfer requested' }]),
        input.specialRequests ?? '', input.createdBy ?? 'guest',
      ],
    );
    await recordAudit(
      { actorId: account.id, actorRole: account.role, action: 'Created transfer request', entity: 'Transfer', entityId: id },
      client,
    );
  });

  const { rows: admins } = await query<{ id: string }>(`select id from admin_users where status = 'active'`);
  for (const admin of admins) {
    await createNotification({
      recipientId: admin.id,
      recipientRole: 'ADMIN',
      type: 'TRANSFER_REQUEST',
      title: 'New airport transfer',
      message: `${id} · ${input.airport} on ${input.date}`,
      link: `/admin/transfers/${id}`,
      entityType: 'transfer',
      entityId: id,
    });
  }
  await createNotification({
    recipientId: account.id,
    recipientRole: 'GUEST',
    type: 'TRANSFER_REQUEST',
    title: 'Transfer request received',
    message: `${id} is being reviewed.`,
    link: `/transfers/${id}`,
    entityType: 'transfer',
    entityId: id,
  });

  emitStatus('admin:ops', 'order:created', { kind: 'transfer', id });
  return getTransfer(id, account);
}

const TRANSFER_SELECT = `
  select
    t.*,
    trim(coalesce(g.first_name, '') || ' ' || coalesce(g.last_name, '')) as guest_name,
    p.name as property_name,
    trim(coalesce(h.first_name, '') || ' ' || coalesce(h.last_name, '')) as host_name,
    v.name as vehicle_name
  from airport_transfers t
  left join guests g on g.id = t.guest_id
  left join properties p on p.id = t.property_id
  left join hosts h on h.id = p.host_id
  left join vehicle_classes v on v.id = t.vehicle_id
`;

export async function getTransfer(id: string, account: AuthAccount) {
  const { rows } = await query(`${TRANSFER_SELECT} where t.id = $1 and t.deleted_at is null`, [id]);
  const transfer = rows[0];
  if (!transfer) throw errors.notFound('that transfer');
  if (account.role === 'GUEST' && transfer.guest_id !== account.id) throw errors.notFound('that transfer');
  if (account.role === 'HOST' || account.role === 'PARTNER') throw errors.forbidden();
  return shapeTransfer(transfer);
}

export async function listTransfers(account: AuthAccount, filters: { status?: string; airport?: string } = {}) {
  const params: unknown[] = [];
  let where = 't.deleted_at is null';
  if (account.role === 'HOST' || account.role === 'PARTNER') throw errors.forbidden();
  if (account.role === 'GUEST') {
    params.push(account.id);
    where += ` and t.guest_id = $${params.length}`;
  }
  if (filters.status && filters.status !== 'all') {
    params.push(filters.status);
    where += ` and t.status = $${params.length}`;
  }
  if (filters.airport && filters.airport !== 'all') {
    params.push(filters.airport);
    where += ` and t.airport = $${params.length}`;
  }
  const { rows } = await query(`${TRANSFER_SELECT} where ${where} order by t.created_at desc`, params);
  return rows.map(shapeTransfer);
}

export async function previewCancellation(id: string, account: AuthAccount) {
  const transfer = await getTransfer(id, account);
  const pickup = new Date(`${String(transfer.date)}T${normalizeTime(String(transfer.time))}`);
  return cancellationPreview(pickup, Math.round(Number(transfer.quotedPrice ?? 0) * 100));
}

export async function setTransferStatus(
  id: string,
  status: TransferStatus,
  account: AuthAccount,
  extra: Record<string, unknown> = {},
) {
  const { rows } = await query(`select * from airport_transfers where id = $1`, [id]);
  const current = rows[0];
  if (!current) throw errors.notFound('that transfer');
  if (status === 'payment_authorized') throw errors.paymentNotConfigured();
  if (status !== current.status && !ALLOWED[current.status]?.includes(status)) {
    throw errors.invalidTransition(current.status, status);
  }

  let cancellationResult = current.cancellation_result;
  if (status === 'cancelled' || status === 'no_show') {
    const pickup = new Date(`${current.pickup_date}T${normalizeTime(String(current.pickup_time))}`);
    cancellationResult = await cancellationPreview(pickup, Number(current.quoted_fare_cents ?? 0));
  }

  const timeline = [
    ...(current.timeline as Array<Record<string, unknown>>),
    { status, at: new Date().toISOString(), note: extra.note ?? status },
  ];

  await withTransaction(async (client) => {
    await client.query(
      `update airport_transfers set status = $2, timeline = $3, driver = coalesce($4, driver),
        cancel_reason = coalesce($5, cancel_reason), cancellation_result = coalesce($6, cancellation_result)
       where id = $1`,
      [
        id, status, JSON.stringify(timeline),
        extra.driver ? JSON.stringify(extra.driver) : null,
        extra.cancelReason ?? null,
        cancellationResult ? JSON.stringify(cancellationResult) : null,
      ],
    );
    await client.query(
      `insert into transfer_status_history (transfer_id, from_status, to_status, actor_id, actor_role, note)
       values ($1,$2,$3,$4,$5,$6)`,
      [id, current.status, status, account.id, account.role, extra.note ?? null],
    );
    await recordAudit(
      { actorId: account.id, actorRole: account.role, actorName: account.name, action: `Set transfer to ${status}`, entity: 'Transfer', entityId: id },
      client,
    );
  });

  await createNotification({
    recipientId: current.guest_id,
    recipientRole: 'GUEST',
    type: 'TRANSFER_STATUS',
    title: `Transfer ${status.replace(/_/g, ' ')}`,
    message: `${id} is now ${status.replace(/_/g, ' ')}.`,
    link: `/transfers/${id}`,
    entityType: 'transfer',
    entityId: id,
  });
  emitStatus(`guest:${current.guest_id}`, 'transfer:updated', { id, status });
  emitStatus('admin:ops', 'order:updated', { kind: 'transfer', id, status });
  return getTransfer(id, account);
}

function normalizeTime(time: string) {
  return time.length === 5 ? `${time}:00` : time;
}

function shapeTransfer(row: Record<string, unknown>) {
  return {
    id: row.id,
    type: 'transfer',
    guestId: row.guest_id,
    guestName: row.guest_name ?? null,
    propertyId: row.property_id,
    propertyName: row.property_name ?? null,
    hostName: row.host_name ?? null,
    direction: row.direction,
    airport: row.airport,
    date: row.pickup_date,
    pickupDate: row.pickup_date,
    time: row.pickup_time,
    pickupTime: row.pickup_time,
    flightNumber: row.flight_number,
    passengers: row.passengers,
    bags: row.bags,
    vehicleClass: row.vehicle_id,
    vehicleName: row.vehicle_name ?? row.vehicle_id,
    status: row.status,
    quotedPrice: row.quoted_fare_cents != null ? Number(row.quoted_fare_cents) / 100 : null,
    amount: row.quoted_fare_cents != null ? Number(row.quoted_fare_cents) / 100 : 0,
    payment: row.payment,
    driver: row.driver,
    timeline: row.timeline,
    rating: row.rating,
    specialRequests: row.special_requests,
    cancellationResult: row.cancellation_result,
    createdAt: row.created_at,
    createdBy: row.created_by ?? 'guest',
  };
}
