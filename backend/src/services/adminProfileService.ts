import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { errors } from '../utils/errors.js';
import { hashPassword, verifyPassword } from './authService.js';
import { recordAudit } from './auditService.js';
import type { AuthAccount } from '../types/index.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

function shape(row: Record<string, unknown>) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    title: row.title ?? '',
    phone: row.phone ?? '',
    avatarUrl: row.avatar_url ?? null,
    role: row.role,
    status: row.status,
    twoFactor: row.two_factor === true,
    lastActiveAt: row.last_active_at ?? null,
  };
}

export async function getAdminProfile(account: AuthAccount) {
  const { rows } = await query(
    `select id, email, name, title, phone, avatar_url, role, status, two_factor, last_active_at
     from admin_users where id = $1 and deleted_at is null`,
    [account.id],
  );
  if (!rows[0]) throw errors.authRequired();
  return shape(rows[0]);
}

export async function updateAdminProfile(
  account: AuthAccount,
  input: { name?: string; title?: string; phone?: string; email?: string },
) {
  const name = String(input.name ?? '').trim();
  if (!name) throw errors.validation('A name is required.', { field: 'name' });

  const email = String(input.email ?? '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw errors.validation('That does not look like an email address.', { field: 'email' });
  }

  const taken = await query(
    `select id from admin_users where lower(email) = $1 and id <> $2 and deleted_at is null`,
    [email, account.id],
  );
  if (taken.rowCount) throw errors.validation('Another admin already uses that email.', { field: 'email' });

  const { rows } = await query(
    `update admin_users
     set name = $2, title = $3, phone = $4, email = $5, updated_at = now()
     where id = $1
     returning id, email, name, title, phone, avatar_url, role, status, two_factor, last_active_at`,
    [account.id, name, String(input.title ?? '').trim(), String(input.phone ?? '').trim(), email],
  );
  await recordAudit({
    actorId: account.id,
    actorRole: 'ADMIN',
    actorName: name,
    action: 'Updated own profile',
    entity: 'Admin user',
    entityId: account.id,
  });
  return shape(rows[0]);
}

export async function changeAdminPassword(
  account: AuthAccount,
  input: { currentPassword?: string; newPassword?: string },
) {
  const currentPassword = String(input.currentPassword ?? '');
  const newPassword = String(input.newPassword ?? '');
  if (newPassword.length < 8) {
    throw errors.validation('Use at least 8 characters for the new password.', { field: 'newPassword' });
  }
  const { rows } = await query<{ password_hash: string }>(
    `select password_hash from admin_users where id = $1 and deleted_at is null`,
    [account.id],
  );
  if (!rows[0]) throw errors.authRequired();
  const matches = await verifyPassword(rows[0].password_hash, currentPassword);
  if (!matches) throw errors.validation('Current password is not right.', { field: 'currentPassword' });
  await query(`update admin_users set password_hash = $2, updated_at = now() where id = $1`, [
    account.id,
    await hashPassword(newPassword),
  ]);
  await recordAudit({
    actorId: account.id,
    actorRole: 'ADMIN',
    action: 'Changed own password',
    entity: 'Admin user',
    entityId: account.id,
  });
  return { ok: true };
}

export async function uploadAdminAvatar(
  account: AuthAccount,
  input: { mimeType?: string; base64?: string },
) {
  if (!input.base64) throw errors.validation('Choose a photo first.');
  const mime = input.mimeType ?? 'image/jpeg';
  if (!ALLOWED.has(mime)) throw errors.validation('Use a JPEG, PNG, or WebP image.');
  const buffer = Buffer.from(input.base64, 'base64');
  if (!buffer.length) throw errors.validation('That file could not be read.');
  if (buffer.length > MAX_BYTES) throw errors.validation('That file is too large. The limit is 5 MB.');

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const dir = resolve(process.cwd(), 'uploads', 'avatars');
  mkdirSync(dir, { recursive: true });
  const fileName = `${account.id}.${ext}`;
  writeFileSync(resolve(dir, fileName), buffer);
  const avatarUrl = `${env.APP_URL.replace(/\/$/, '')}/uploads/avatars/${fileName}?v=${Date.now()}`;

  const { rows } = await query(
    `update admin_users set avatar_url = $2, updated_at = now()
     where id = $1
     returning id, email, name, title, phone, avatar_url, role, status, two_factor, last_active_at`,
    [account.id, avatarUrl],
  );
  await recordAudit({
    actorId: account.id,
    actorRole: 'ADMIN',
    action: 'Updated profile photo',
    entity: 'Admin user',
    entityId: account.id,
  });
  return shape(rows[0]);
}

export async function removeAdminAvatar(account: AuthAccount) {
  const { rows } = await query(
    `update admin_users set avatar_url = null, updated_at = now()
     where id = $1
     returning id, email, name, title, phone, avatar_url, role, status, two_factor, last_active_at`,
    [account.id],
  );
  if (!rows[0]) throw errors.authRequired();
  return shape(rows[0]);
}
