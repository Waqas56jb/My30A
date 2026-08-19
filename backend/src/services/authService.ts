import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import { AppError, errors } from '../utils/errors.js';
import type { AdminRole, AppRole, AuthAccount, PermissionArea, PermissionLevel } from '../types/index.js';

const ROLE_TABLE: Record<AppRole, string> = {
  GUEST: 'guests',
  HOST: 'hosts',
  PARTNER: 'partners',
  ADMIN: 'admin_users',
};

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export function signToken(account: AuthAccount) {
  return jwt.sign(
    {
      sub: account.id,
      role: account.role,
      email: account.email,
      name: account.name,
      adminRole: account.adminRole,
      propertyId: account.propertyId ?? null,
      stayId: account.stayId ?? null,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );
}

export function verifyToken(token: string): AuthAccount {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    return {
      id: String(payload.sub),
      role: payload.role as AppRole,
      email: String(payload.email),
      name: String(payload.name ?? payload.email),
      adminRole: payload.adminRole as AdminRole | undefined,
      propertyId: (payload.propertyId as string | null) ?? null,
      stayId: (payload.stayId as string | null) ?? null,
    };
  } catch {
    throw errors.authRequired();
  }
}

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

const LEVEL_RANK: Record<PermissionLevel, number> = { none: 0, view: 1, edit: 2, full: 3 };

export const ADMIN_MATRIX: Record<AdminRole, Record<PermissionArea, PermissionLevel>> = {
  super_admin: {
    users: 'full', hosts: 'full', partners: 'full', properties: 'full',
    orders: 'full', payments: 'full', content: 'full', analytics: 'full', settings: 'full',
  },
  operations: {
    users: 'edit', hosts: 'edit', partners: 'full', properties: 'edit',
    orders: 'full', payments: 'view', content: 'view', analytics: 'view', settings: 'none',
  },
  finance: {
    users: 'view', hosts: 'view', partners: 'view', properties: 'view',
    orders: 'view', payments: 'full', content: 'none', analytics: 'full', settings: 'view',
  },
  content_manager: {
    users: 'none', hosts: 'none', partners: 'edit', properties: 'view',
    orders: 'none', payments: 'none', content: 'full', analytics: 'view', settings: 'none',
  },
  support: {
    users: 'edit', hosts: 'view', partners: 'view', properties: 'view',
    orders: 'edit', payments: 'view', content: 'none', analytics: 'view', settings: 'none',
  },
};

export function can(role: AdminRole | undefined, area: PermissionArea, minimum: PermissionLevel) {
  if (!role) return false;
  return LEVEL_RANK[ADMIN_MATRIX[role][area]] >= LEVEL_RANK[minimum];
}

type LoginInput = { email: string; password: string; role: AppRole };

function assertAccountAllowed(role: AppRole, row: Record<string, unknown>) {
  const status = String(row.status ?? '');
  const blocked =
    (role === 'GUEST' && status === 'blocked') ||
    (role === 'HOST' && (status === 'suspended' || status === 'rejected')) ||
    (role === 'PARTNER' && (status === 'suspended' || status === 'rejected')) ||
    (role === 'ADMIN' && status === 'suspended');
  if (blocked) {
    throw new AppError(
      403,
      'ACCOUNT_BLOCKED',
      'This account has been blocked. Contact My30A if you think that is a mistake.',
    );
  }
}

export async function loadAccount(role: AppRole, id: string): Promise<AuthAccount> {
  const table = ROLE_TABLE[role];
  const { rows } = await query<Record<string, unknown>>(
    `select * from ${table} where id = $1 and deleted_at is null limit 1`,
    [id],
  );
  if (!rows[0]) throw errors.authRequired();
  assertAccountAllowed(role, rows[0]);
  return hydrateAccount(role, rows[0]);
}

export async function login({ email, password, role }: LoginInput): Promise<{ token: string; account: AuthAccount; profile: Record<string, unknown> }> {
  const table = ROLE_TABLE[role];
  const { rows } = await query<Record<string, unknown>>(
    `select * from ${table} where lower(email) = lower($1) and deleted_at is null limit 1`,
    [email.trim()],
  );
  const row = rows[0];
  if (!row) throw new AppError(401, 'AUTH_INVALID', 'No account matches that email.', { field: 'email' });
  const ok = await verifyPassword(String(row.password_hash), password);
  if (!ok) throw new AppError(401, 'AUTH_INVALID', 'That password is not right.', { field: 'password' });
  assertAccountAllowed(role, row);

  const account = await hydrateAccount(role, row);
  const token = signToken(account);
  const { password_hash: _h, ...safe } = row;
  return { token, account, profile: { ...safe, role: account.role, permissions: account.permissions } };
}

export async function hydrateAccount(role: AppRole, row: Record<string, unknown>): Promise<AuthAccount> {
  const id = String(row.id);
  let propertyId: string | null = null;
  let stayId: string | null = null;
  if (role === 'GUEST') {
    const stay = await query<{ id: string; property_id: string }>(
      `select id, property_id from guest_stays
       where guest_id = $1
       order by check_in_date desc limit 1`,
      [id],
    );
    propertyId = stay.rows[0]?.property_id ?? null;
    stayId = stay.rows[0]?.id ?? null;
  }
  const adminRole = role === 'ADMIN' ? (row.role as AdminRole) : undefined;
  const name =
    role === 'PARTNER'
      ? String(row.name)
      : role === 'ADMIN'
        ? String(row.name)
        : `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();

  return {
    id,
    role,
    email: String(row.email),
    name,
    adminRole,
    permissions: adminRole ? ADMIN_MATRIX[adminRole] : undefined,
    propertyId,
    stayId,
    hostId: role === 'HOST' ? id : null,
    partnerId: role === 'PARTNER' ? id : null,
  };
}

export async function requestPasswordReset(email: string, role: AppRole) {
  const table = ROLE_TABLE[role];
  const { rows } = await query<{ id: string }>(
    `select id from ${table} where lower(email) = lower($1) and deleted_at is null`,
    [email.trim()],
  );
  const token = randomToken();
  if (rows[0]) {
    await query(
      `insert into password_reset_tokens (account_role, account_id, token_hash, expires_at)
       values ($1,$2,$3, now() + interval '2 hours')`,
      [role, rows[0].id, sha256(token)],
    );
  }
  return { ok: true, email: email.trim().toLowerCase(), token: rows[0] ? token : null };
}

export async function resetPassword(role: AppRole, token: string, password: string) {
  const { rows } = await query<{ account_id: string }>(
    `select account_id from password_reset_tokens
     where token_hash = $1 and account_role = $2 and used_at is null and expires_at > now()`,
    [sha256(token), role],
  );
  if (!rows[0]) throw errors.validation('This reset link has already been used, or it expired.', { field: 'token' });
  const hash = await hashPassword(password);
  const table = ROLE_TABLE[role];
  await query(`update ${table} set password_hash = $1 where id = $2`, [hash, rows[0].account_id]);
  await query(`update password_reset_tokens set used_at = now() where token_hash = $1`, [sha256(token)]);
  return { ok: true };
}
