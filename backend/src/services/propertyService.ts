import { query, withTransaction } from '../config/db.js';
import { errors } from '../utils/errors.js';
import { randomToken, sha256 } from './authService.js';
import { recordAudit } from './auditService.js';
import type { AuthAccount } from '../types/index.js';

export async function listHostProperties(hostId: string) {
  const { rows } = await query(`select * from properties where host_id = $1 and deleted_at is null order by created_at`, [hostId]);
  return rows;
}

export async function createProperty(account: AuthAccount, input: { name: string; address?: string; type?: string; city?: string }) {
  const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
  const { rows } = await query(
    `insert into properties (host_id, slug, name, type, address, city, status)
     values ($1,$2,$3,$4,$5,$6,'draft') returning *`,
    [account.id, slug, input.name, input.type ?? 'Beach House', input.address ?? '', input.city ?? ''],
  );
  await recordAudit({ actorId: account.id, actorRole: 'HOST', action: 'Created property', entity: 'Property', entityId: rows[0].id });
  return rows[0];
}

export async function updateProperty(account: AuthAccount, id: string, patch: Record<string, unknown>) {
  const allowed = ['name','description','address','city','type','wifi','check_in','check_out','access','parking','emergency','rules','photos','branding','vitoria','guest_access','status','amenities'];
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(patch)) {
    const col = key === 'checkIn' ? 'check_in' : key === 'checkOut' ? 'check_out' : key === 'guestAccess' ? 'guest_access' : key;
    if (!allowed.includes(col)) continue;
    values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    sets.push(`${col} = $${values.length}`);
  }
  if (!sets.length) return getHostProperty(account, id);
  values.push(id, account.role === 'ADMIN' ? undefined : account.id);
  const ownerClause = account.role === 'ADMIN' ? '' : ` and host_id = $${values.length}`;
  const { rows } = await query(
    `update properties set ${sets.join(', ')} where id = $${sets.length + 1}${ownerClause} returning *`,
    account.role === 'ADMIN' ? [...values.slice(0, -1), id] : values,
  );
  if (!rows[0]) throw errors.notFound('that property');
  await recordAudit({ actorId: account.id, actorRole: account.role, action: 'Updated property', entity: 'Property', entityId: id });
  return rows[0];
}

export async function getHostProperty(account: AuthAccount, id: string) {
  const { rows } = await query(
    account.role === 'ADMIN'
      ? `select * from properties where id = $1 and deleted_at is null`
      : `select * from properties where id = $1 and host_id = $2 and deleted_at is null`,
    account.role === 'ADMIN' ? [id] : [id, account.id],
  );
  if (!rows[0]) throw errors.notFound('that property');
  return rows[0];
}

export async function setPropertyStatus(account: AuthAccount, id: string, status: 'draft' | 'published' | 'paused') {
  const { rows } = await query(
    `update properties set status = $3, published_at = case when $3 = 'published' then now() else published_at end
     where id = $1 and host_id = $2 returning *`,
    [id, account.id, status],
  );
  if (!rows[0]) throw errors.notFound('that property');
  await recordAudit({ actorId: account.id, actorRole: 'HOST', action: `Set property ${status}`, entity: 'Property', entityId: id });
  return rows[0];
}

export async function regenerateGuestAccess(account: AuthAccount, propertyId: string) {
  await getHostProperty(account, propertyId);
  await query(`update guest_access_tokens set revoked_at = now() where property_id = $1 and revoked_at is null`, [propertyId]);
  const raw = randomToken();
  const code = `MY30A-${Math.floor(1000 + Math.random() * 9000)}`;
  const slug = `stay-${raw.slice(0, 8)}`;
  await withTransaction(async (client) => {
    await client.query(
      `insert into guest_access_tokens (property_id, issued_by_host_id, token_hash, code, slug, max_uses)
       values ($1,$2,$3,$4,$5, 20)`,
      [propertyId, account.id, sha256(raw), code, slug],
    );
    await client.query(
      `update properties set guest_access = jsonb_build_object('enabled', true, 'code', $2, 'slug', $3, 'token', $4)
       where id = $1`,
      [propertyId, code, slug, raw],
    );
    await recordAudit({ actorId: account.id, actorRole: 'HOST', action: 'Regenerated guest access', entity: 'Property', entityId: propertyId }, client);
  });
  return { token: raw, code, slug, url: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/guest/${slug}` };
}

export async function listHostGuests(hostId: string) {
  const { rows } = await query(
    `select g.id, g.first_name, g.last_name, g.email, g.phone, s.check_in_date, s.check_out_date, s.status, p.name as property_name, p.id as property_id
     from guest_stays s
     join guests g on g.id = s.guest_id
     join properties p on p.id = s.property_id
     where p.host_id = $1
     order by s.check_in_date desc`,
    [hostId],
  );
  return rows;
}

export async function listHostRecommendations(hostId: string, propertyId?: string) {
  const { rows } = await query(
    propertyId
      ? `select * from local_recommendations where host_id = $1 and property_id = $2 and deleted_at is null order by featured desc, created_at desc`
      : `select * from local_recommendations where host_id = $1 and deleted_at is null order by featured desc, created_at desc`,
    propertyId ? [hostId, propertyId] : [hostId],
  );
  return rows;
}

export async function getHostRecommendation(hostId: string, id: string) {
  const { rows } = await query(
    `select * from local_recommendations where id = $1 and host_id = $2 and deleted_at is null`,
    [id, hostId],
  );
  if (!rows[0]) throw errors.notFound('that recommendation');
  return rows[0];
}

export async function createHostRecommendation(account: AuthAccount, input: Record<string, unknown>) {
  await getHostProperty(account, String(input.propertyId ?? input.property_id));
  const { rows } = await query(
    `insert into local_recommendations (property_id, host_id, name, category, note, featured, place_ref)
     values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [
      input.propertyId ?? input.property_id,
      account.id,
      input.name,
      input.category ?? null,
      input.hostNote ?? input.note ?? input.description ?? null,
      Boolean(input.featured),
      input.placeRef ?? input.place_ref ?? null,
    ],
  );
  return rows[0];
}

export async function updateHostRecommendation(account: AuthAccount, id: string, patch: Record<string, unknown>) {
  await getHostRecommendation(account.id, id);
  const { rows } = await query(
    `update local_recommendations
     set name = coalesce($3, name), category = coalesce($4, category), note = coalesce($5, note),
         featured = coalesce($6, featured), place_ref = coalesce($7, place_ref), updated_at = now()
     where id = $1 and host_id = $2 returning *`,
    [
      id,
      account.id,
      patch.name ?? null,
      patch.category ?? null,
      patch.hostNote ?? patch.note ?? patch.description ?? null,
      patch.featured == null ? null : Boolean(patch.featured),
      patch.placeRef ?? patch.place_ref ?? null,
    ],
  );
  return rows[0];
}

export async function deleteHostRecommendation(account: AuthAccount, id: string) {
  await getHostRecommendation(account.id, id);
  await query(`update local_recommendations set deleted_at = now() where id = $1 and host_id = $2`, [id, account.id]);
  return { ok: true };
}
