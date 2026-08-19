import { query } from '../config/db.js';
import { errors } from '../utils/errors.js';
import { recordAudit } from './auditService.js';
import type { AuthAccount } from '../types/index.js';

type Kind = 'guest' | 'host' | 'partner';

const KIND: Record<Kind, { table: string; label: string; block: string; unblock: string }> = {
  guest: { table: 'guests', label: 'Guest', block: 'blocked', unblock: 'active' },
  host: { table: 'hosts', label: 'Host', block: 'suspended', unblock: 'active' },
  partner: { table: 'partners', label: 'Partner', block: 'suspended', unblock: 'approved' },
};

const PATCH: Record<Kind, Record<string, string>> = {
  guest: {
    firstName: 'first_name',
    lastName: 'last_name',
    first_name: 'first_name',
    last_name: 'last_name',
    email: 'email',
    phone: 'phone',
    language: 'language',
    notes: 'notes',
  },
  host: {
    firstName: 'first_name',
    lastName: 'last_name',
    first_name: 'first_name',
    last_name: 'last_name',
    email: 'email',
    phone: 'phone',
    company: 'company',
    notes: 'notes',
  },
  partner: {
    name: 'name',
    ownerName: 'owner_name',
    owner_name: 'owner_name',
    email: 'email',
    phone: 'phone',
    website: 'website',
    address: 'address',
    town: 'town',
    description: 'description',
    featured: 'featured',
    published: 'published',
  },
};

async function load(kind: Kind, id: string) {
  const { table, label } = KIND[kind];
  const slugLookup = kind === 'partner' ? ' or slug = $1' : '';
  const { rows } = await query(
    `select * from ${table} where deleted_at is null and (id::text = $1${slugLookup})`,
    [id],
  );
  if (!rows[0]) throw errors.notFound(`that ${label.toLowerCase()}`);
  return rows[0] as Record<string, unknown>;
}

export async function resolveAccountId(kind: Kind, id: string) {
  return String((await load(kind, id)).id);
}

export async function updateAccount(kind: Kind, id: string, patch: Record<string, unknown>, actor: AuthAccount) {
  const map = PATCH[kind];
  const accountId = await resolveAccountId(kind, id);
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(patch ?? {})) {
    const col = map[key];
    if (!col || value === undefined) continue;
    if (col === 'email') {
      const email = String(value).trim().toLowerCase();
      if (!email.includes('@')) throw errors.validation('Enter a valid email address.', { field: 'email' });
      values.push(email);
    } else if (col === 'featured' || col === 'published') {
      values.push(Boolean(value));
    } else {
      values.push(typeof value === 'string' ? value.trim() : value);
    }
    sets.push(`${col} = $${values.length}`);
  }
  if (!sets.length) throw errors.validation('Nothing to update.');
  values.push(accountId);
  try {
    const { rows } = await query(
      `update ${KIND[kind].table} set ${sets.join(', ')}, updated_at = now() where id = $${values.length} and deleted_at is null returning *`,
      values,
    );
    if (!rows[0]) throw errors.notFound(`that ${KIND[kind].label.toLowerCase()}`);
  } catch (err: unknown) {
    const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code) : '';
    if (code === '23505') throw errors.conflict('That email is already in use.');
    throw err;
  }
  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: `Updated ${KIND[kind].label.toLowerCase()}`,
    entity: KIND[kind].label,
    entityId: accountId,
  });
  return load(kind, accountId);
}

export async function setAccountStatus(kind: Kind, id: string, status: string, reason: string, actor: AuthAccount) {
  const spec = KIND[kind];
  const accountId = await resolveAccountId(kind, id);
  const allowed =
    kind === 'guest'
      ? ['active', 'blocked']
      : kind === 'host'
        ? ['pending', 'active', 'suspended', 'rejected']
        : ['pending', 'approved', 'suspended', 'rejected'];
  if (!allowed.includes(status)) throw errors.validation('That status is not valid.');
  if ((status === spec.block || status === 'rejected') && kind !== 'guest' && !String(reason ?? '').trim()) {
    throw errors.validation('A reason is required.');
  }
  if (kind === 'guest' && status === 'blocked' && !String(reason ?? '').trim()) {
    throw errors.validation('A reason is required.');
  }

  const extra =
    kind === 'partner'
      ? `, published = ($2 = 'approved'), reviewed_at = now(), reason = $3`
      : kind === 'host'
        ? `, notes = coalesce(nullif($3, ''), notes)`
        : `, notes = coalesce(nullif($3, ''), notes)`;

  const { rowCount } = await query(
    `update ${spec.table} set status = $2${extra}, updated_at = now() where id = $1 and deleted_at is null`,
    [accountId, status, reason || null],
  );
  if (!rowCount) throw errors.notFound(`that ${spec.label.toLowerCase()}`);
  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: `${spec.label} ${status}`,
    entity: spec.label,
    entityId: accountId,
    metadata: { reason },
  });
  return load(kind, accountId);
}

export async function deleteAccount(kind: Kind, id: string, actor: AuthAccount) {
  const spec = KIND[kind];
  const accountId = await resolveAccountId(kind, id);
  const { rowCount } = await query(
    `update ${spec.table} set deleted_at = now(), updated_at = now() where id = $1 and deleted_at is null`,
    [accountId],
  );
  if (!rowCount) throw errors.notFound(`that ${spec.label.toLowerCase()}`);
  if (kind === 'partner') {
    await query(`update partners set published = false, status = 'suspended' where id = $1`, [accountId]);
  }
  if (kind === 'host') {
    await query(`update properties set status = 'paused' where host_id = $1 and deleted_at is null`, [accountId]);
  }
  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: `Deleted ${spec.label.toLowerCase()}`,
    entity: spec.label,
    entityId: accountId,
  });
  return { ok: true, deleted: true };
}
