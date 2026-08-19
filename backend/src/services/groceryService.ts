import { query, withTransaction } from '../config/db.js';
import { errors } from '../utils/errors.js';
import { groceryPackageForCount } from './pricingService.js';
import { recordAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import { sendOfficial } from '../integrations/email/emailService.js';
import { emitStatus } from '../sockets/io.js';
import type { AuthAccount, GroceryStatus } from '../types/index.js';

const ALLOWED: Record<string, GroceryStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['payment_required', 'shopping', 'cancelled'],
  payment_required: ['shopping', 'cancelled'],
  paid: ['shopping', 'cancelled'],
  shopping: ['on_the_way', 'cancelled'],
  on_the_way: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export async function nextGroceryId() {
  const { rows } = await query<{ n: string }>(
    `select coalesce(max(substring(id from 4)::int), 1000)::text as n
     from grocery_orders where id ~ '^GR-[0-9]+$'`,
  );
  return `GR-${Number(rows[0]?.n ?? 1000) + 1}`;
}

export async function createGroceryRequest(
  account: AuthAccount,
  input: {
    items: string;
    store?: string;
    deliveryDate: string;
    deliveryWindow: string;
    notes?: string;
    estimatedTotal?: number;
    cancellationAccepted?: boolean;
    createdBy?: string;
  },
) {
  if (!account.propertyId) throw errors.propertyDenied();
  const lines = String(input.items ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const itemCount = lines.length;
  const pack = await groceryPackageForCount(itemCount);
  const id = await nextGroceryId();
  const now = new Date().toISOString();
  const estimated = input.estimatedTotal != null ? Math.round(Number(input.estimatedTotal) * 100) : null;
  const timeline = [{ status: 'pending', at: now, note: 'Request submitted' }];

  await withTransaction(async (client) => {
    await client.query(
      `insert into grocery_orders (
        id, guest_id, property_id, stay_id, status, store, delivery_date, delivery_window,
        items_text, item_count, package_code, notes, estimated_grocery_cents, service_fee_cents,
        payment_status, timeline, cancellation_accepted, created_by
      ) values ($1,$2,$3,$4,'pending',$5,$6,$7,$8,$9,$10,$11,$12,$13,'not_required',$14,$15,$16)`,
      [
        id, account.id, account.propertyId, account.stayId ?? null, input.store ?? 'Publix',
        input.deliveryDate, input.deliveryWindow, input.items, itemCount, pack.code,
        input.notes ?? '', estimated, pack.amount_cents, JSON.stringify(timeline),
        Boolean(input.cancellationAccepted), input.createdBy ?? 'guest',
      ],
    );
    for (const line of lines) {
      await client.query(`insert into grocery_order_items (order_id, name) values ($1,$2)`, [id, line]);
    }
    await recordAudit(
      { actorId: account.id, actorRole: account.role, action: 'Created grocery request', entity: 'Grocery order', entityId: id },
      client,
    );
  });

  const { rows: admins } = await query<{ id: string }>(`select id from admin_users where status = 'active'`);
  for (const admin of admins) {
    await createNotification({
      recipientId: admin.id,
      recipientRole: 'ADMIN',
      type: 'NEW_ORDER',
      title: 'New grocery request',
      message: `${id} is waiting for confirmation.`,
      link: `/admin/grocery/${id}`,
      entityType: 'grocery',
      entityId: id,
    });
  }
  await createNotification({
    recipientId: account.id,
    recipientRole: 'GUEST',
    type: 'GROCERY_REQUEST',
    title: 'Grocery request received',
    message: `${id} is with our concierge team.`,
    link: `/groceries/${id}`,
    entityType: 'grocery',
    entityId: id,
  });

  const { rows: guest } = await query<{ email: string; first_name: string }>(
    `select email, first_name from guests where id = $1`,
    [account.id],
  );
  if (guest[0]) {
    void sendOfficial(
      guest[0].email,
      'Your grocery request was received',
      'grocery_submitted',
      'Grocery request received',
      `<p>Hi ${guest[0].first_name}, we have ${id}. The team will confirm it shortly. Nothing has been charged.</p>`,
    );
  }

  emitStatus('admin:ops', 'order:created', { kind: 'grocery', id });
  return getGrocery(id, account);
}

const GROCERY_SELECT = `
  select
    o.*,
    trim(coalesce(g.first_name, '') || ' ' || coalesce(g.last_name, '')) as guest_name,
    p.name as property_name,
    trim(coalesce(h.first_name, '') || ' ' || coalesce(h.last_name, '')) as host_name
  from grocery_orders o
  left join guests g on g.id = o.guest_id
  left join properties p on p.id = o.property_id
  left join hosts h on h.id = p.host_id
`;

function parseItemsText(text: unknown) {
  return String(text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name, i) => ({ id: `it_${i}`, name, qty: 1, note: '' }));
}

export async function getGrocery(id: string, account: AuthAccount) {
  const { rows } = await query(`${GROCERY_SELECT} where o.id = $1 and o.deleted_at is null`, [id]);
  const order = rows[0];
  if (!order) throw errors.notFound('that request');
  if (account.role === 'GUEST' && order.guest_id !== account.id) throw errors.notFound('that request');
  if (account.role === 'HOST' || account.role === 'PARTNER') throw errors.forbidden();
  const { rows: lineItems } = await query(
    `select id, name, qty, note from grocery_order_items where order_id = $1 order by id`,
    [id],
  );
  return {
    ...shapeGrocery(order),
    items: lineItems.length ? lineItems : parseItemsText(order.items_text),
  };
}

export async function listGroceries(account: AuthAccount, filters: { status?: string; search?: string } = {}) {
  if (account.role === 'HOST' || account.role === 'PARTNER') throw errors.forbidden();
  const params: unknown[] = [];
  let where = 'o.deleted_at is null';
  if (account.role === 'GUEST') {
    params.push(account.id);
    where += ` and o.guest_id = $${params.length}`;
  }
  if (filters.status && filters.status !== 'all') {
    params.push(filters.status);
    where += ` and o.status = $${params.length}`;
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where += ` and (o.id ilike $${params.length} or o.notes ilike $${params.length})`;
  }
  const { rows } = await query(`${GROCERY_SELECT} where ${where} order by o.created_at desc`, params);
  return rows.map((row) => ({
    ...shapeGrocery(row),
    items: parseItemsText(row.items_text),
  }));
}

export async function setGroceryStatus(
  id: string,
  status: GroceryStatus,
  account: AuthAccount,
  extra: Record<string, unknown> = {},
) {
  const { rows } = await query(`select * from grocery_orders where id = $1`, [id]);
  const current = rows[0];
  if (!current) throw errors.notFound('that order');
  if (status === 'paid') throw errors.paymentNotConfigured();
  if (status !== current.status && !ALLOWED[current.status]?.includes(status)) {
    throw errors.invalidTransition(current.status, status);
  }

  const timeline = [
    ...(current.timeline as Array<Record<string, unknown>>),
    { status, at: new Date().toISOString(), note: extra.note ?? status },
  ];

  await withTransaction(async (client) => {
    await client.query(
      `update grocery_orders set status = $2, timeline = $3, internal_notes = coalesce($4, internal_notes),
        estimated_grocery_cents = coalesce($5, estimated_grocery_cents),
        service_fee_cents = coalesce($6, service_fee_cents),
        actual_amount_cents = coalesce($7, actual_amount_cents),
        delivery_photo_path = coalesce($8, delivery_photo_path)
       where id = $1`,
      [
        id, status, JSON.stringify(timeline), extra.internalNotes ?? null,
        extra.estimatedGroceryCents ?? null, extra.serviceFeeCents ?? null,
        extra.actualAmountCents ?? null, extra.deliveryPhotoPath ?? null,
      ],
    );
    await client.query(
      `insert into grocery_status_history (order_id, from_status, to_status, actor_id, actor_role, note)
       values ($1,$2,$3,$4,$5,$6)`,
      [id, current.status, status, account.id, account.role, extra.note ?? null],
    );
    await recordAudit(
      { actorId: account.id, actorRole: account.role, actorName: account.name, action: `Set grocery to ${status}`, entity: 'Grocery order', entityId: id },
      client,
    );
  });

  await createNotification({
    recipientId: current.guest_id,
    recipientRole: 'GUEST',
    type: 'ORDER_STATUS_CHANGED',
    title: `Grocery request ${status.replace(/_/g, ' ')}`,
    message: `Your request ${id} is now ${status.replace(/_/g, ' ')}.`,
    link: `/groceries/${id}`,
    entityType: 'grocery',
    entityId: id,
  });
  emitStatus(`guest:${current.guest_id}`, 'grocery:updated', { id, status });
  emitStatus('admin:ops', 'order:updated', { kind: 'grocery', id, status });

  const { rows: guest } = await query<{ email: string; first_name: string }>(
    `select email, first_name from guests where id = $1`,
    [current.guest_id],
  );
  if (guest[0] && ['confirmed', 'shopping', 'on_the_way', 'delivered', 'cancelled'].includes(status)) {
    void sendOfficial(
      guest[0].email,
      `Grocery request ${id} is ${status.replace(/_/g, ' ')}`,
      `grocery_${status}`,
      `Grocery update`,
      `<p>Hi ${guest[0].first_name}, ${id} is now <strong>${status.replace(/_/g, ' ')}</strong>.</p>`,
    );
  }

  return getGrocery(id, account);
}

function shapeGrocery(row: Record<string, unknown>) {
  return {
    id: row.id,
    type: 'grocery',
    guestId: row.guest_id,
    propertyId: row.property_id,
    createdAt: row.created_at,
    deliveryDate: row.delivery_date,
    deliveryWindow: row.delivery_window,
    store: row.store,
    status: row.status,
    items: row.items_text,
    itemCount: row.item_count,
    notes: row.notes,
    estimatedTotal: row.estimated_grocery_cents != null ? Number(row.estimated_grocery_cents) / 100 : null,
    estimatedAmount: row.estimated_grocery_cents != null ? Number(row.estimated_grocery_cents) / 100 : 0,
    actualAmount: row.actual_amount_cents != null ? Number(row.actual_amount_cents) / 100 : null,
    serviceFee: row.service_fee_cents != null ? Number(row.service_fee_cents) / 100 : 0,
    guestName: row.guest_name ?? null,
    propertyName: row.property_name ?? null,
    hostName: row.host_name ?? null,
    createdBy: row.created_by ?? 'guest',
    packageCode: row.package_code,
    payment: row.payment,
    timeline: row.timeline,
    shopper: row.shopper,
    deliveryPhoto: row.delivery_photo_path,
    rating: row.rating,
    tip: row.tip_amount_cents != null ? Number(row.tip_amount_cents) / 100 : null,
    cancellationAccepted: row.cancellation_accepted,
  };
}
