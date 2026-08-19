import { query, withTransaction } from '../config/db.js';
import { errors } from '../utils/errors.js';
import { sha256 } from './authService.js';
import { recordAudit } from './auditService.js';
import type { AuthAccount } from '../types/index.js';

const PUBLIC_PROPERTY_FIELDS = `
  id, slug, name, type, status, description, address, city, community,
  latitude, longitude, amenities, photos, branding
`;

export async function getPublicProperty(idOrSlug: string) {
  const { rows } = await query(
    `select ${PUBLIC_PROPERTY_FIELDS} from properties
     where (id::text = $1 or slug = $1) and deleted_at is null`,
    [idOrSlug],
  );
  if (!rows[0]) throw errors.notFound('that property');
  return rows[0];
}

export async function getAuthorizedProperty(account: AuthAccount, idOrSlug?: string) {
  const target = idOrSlug ?? account.propertyId;
  if (!target) throw errors.propertyDenied();

  if (account.role === 'HOST') {
    const { rows } = await query(
      `select * from properties where (id::text = $1 or slug = $1) and host_id = $2 and deleted_at is null`,
      [target, account.id],
    );
    if (!rows[0]) throw errors.notFound('that property');
    return rows[0];
  }

  if (account.role === 'ADMIN') {
    const { rows } = await query(
      `select * from properties where (id::text = $1 or slug = $1) and deleted_at is null`,
      [target],
    );
    if (!rows[0]) throw errors.notFound('that property');
    return rows[0];
  }

  if (account.role !== 'GUEST') throw errors.forbidden();

  const { rows } = await query(
    `select p.* from properties p
     join property_guests pg on pg.property_id = p.id
     where pg.guest_id = $1 and (p.id::text = $2 or p.slug = $2) and p.deleted_at is null
       and (pg.expires_at is null or pg.expires_at > now())`,
    [account.id, target],
  );
  if (!rows[0]) throw errors.propertyDenied();
  return shapeProperty(rows[0]);
}

function shapeProperty(row: Record<string, unknown>) {
  const wifi = (row.wifi ?? {}) as Record<string, unknown>;
  const access = (row.access ?? {}) as Record<string, unknown>;
  const checkIn = (row.check_in ?? {}) as Record<string, unknown>;
  const checkOut = (row.check_out ?? {}) as Record<string, unknown>;
  return {
    ...row,
    checkIn: checkIn.time ?? row.checkIn,
    checkOut: checkOut.time ?? row.checkOut,
    wifi,
    access,
    parking: row.parking,
    emergency: row.emergency,
    rules: row.rules,
    coordinates: row.latitude != null ? { lat: Number(row.latitude), lng: Number(row.longitude) } : null,
  };
}

export async function redeemAccess(account: AuthAccount, raw: string) {
  const hash = sha256(raw.trim());
  const { rows } = await query(
    `select * from guest_access_tokens
     where (token_hash = $1 or lower(code) = lower($2) or lower(slug) = lower($2))
       and revoked_at is null
       and (expires_at is null or expires_at > now())`,
    [hash, raw.trim()],
  );
  const token = rows[0];
  if (!token) throw errors.validation('That access code is not valid.');
  if (token.max_uses != null && token.used_count >= token.max_uses) {
    throw errors.validation('That access code has already been used.');
  }

  await withTransaction(async (client) => {
    const stay = await client.query(
      `insert into guest_stays (guest_id, property_id, check_in_date, check_out_date, access_slug, status)
       values ($1,$2, current_date, current_date + 7, $3, 'active')
       returning id`,
      [account.id, token.property_id, token.slug ?? raw.trim()],
    );
    await client.query(
      `insert into property_guests (guest_id, property_id, stay_id, access_code_id, expires_at)
       values ($1,$2,$3,$4, now() + interval '14 days')
       on conflict do nothing`,
      [account.id, token.property_id, stay.rows[0].id, token.id],
    );
    await client.query(
      `update guest_access_tokens set used_count = used_count + 1,
        first_used_at = coalesce(first_used_at, now()), last_used_at = now()
       where id = $1`,
      [token.id],
    );
    await recordAudit(
      { actorId: account.id, actorRole: 'GUEST', action: 'Redeemed access token', entity: 'Guest access', entityId: String(token.id) },
      client,
    );
  });

  return getAuthorizedProperty({ ...account, propertyId: String(token.property_id) }, String(token.property_id));
}

export async function currentStay(guestId: string) {
  const { rows } = await query(
    `select s.*, p.name as property_name, p.slug as property_slug
     from guest_stays s
     join properties p on p.id = s.property_id
     where s.guest_id = $1
     order by s.check_in_date desc limit 1`,
    [guestId],
  );
  return rows[0] ?? null;
}
