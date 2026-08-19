import webpush from 'web-push';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { AppRole } from '../types/index.js';

type VapidKeys = { publicKey: string; privateKey: string };

let configured = false;
let publicKey = '';

async function readStoredKeys(): Promise<VapidKeys | null> {
  const { rows } = await query<{ value: unknown }>(`select value from system_settings where key = 'vapid'`);
  const raw = rows[0]?.value;
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (
    value &&
    typeof value === 'object' &&
    typeof (value as VapidKeys).publicKey === 'string' &&
    typeof (value as VapidKeys).privateKey === 'string'
  ) {
    return value as VapidKeys;
  }
  return null;
}

export async function ensureWebPush(): Promise<string> {
  if (configured && publicKey) return publicKey;
  let keys = await readStoredKeys();
  if (!keys) {
    const generated = webpush.generateVAPIDKeys();
    keys = generated;
    await query(
      `insert into system_settings (key, value) values ('vapid', $1::jsonb)
       on conflict (key) do update set value = $1::jsonb, updated_at = now()`,
      [JSON.stringify({ publicKey: generated.publicKey, privateKey: generated.privateKey })],
    );
  }
  webpush.setVapidDetails(`mailto:${env.OFFICIAL_EMAIL}`, keys.publicKey, keys.privateKey);
  publicKey = keys.publicKey;
  configured = true;
  return publicKey;
}

export async function getVapidPublicKey() {
  return ensureWebPush();
}

export async function savePushSubscription(input: {
  accountId: string;
  accountRole: AppRole;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}) {
  await ensureWebPush();
  await query(
    `insert into push_subscriptions (account_id, account_role, endpoint, p256dh, auth, user_agent)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (endpoint) do update set
       account_id = excluded.account_id,
       account_role = excluded.account_role,
       p256dh = excluded.p256dh,
       auth = excluded.auth,
       user_agent = excluded.user_agent,
       updated_at = now()`,
    [
      input.accountId,
      input.accountRole,
      input.endpoint,
      input.p256dh,
      input.auth,
      input.userAgent ?? null,
    ],
  );
}

export async function deletePushSubscription(accountId: string, endpoint: string) {
  await query(
    `delete from push_subscriptions where account_id = $1 and endpoint = $2`,
    [accountId, endpoint],
  );
}

export async function sendWebPush(
  accountId: string,
  accountRole: AppRole,
  payload: { title: string; message: string; link?: string | null; id?: string },
) {
  try {
    await ensureWebPush();
  } catch (error) {
    logger.warn({ err: error }, 'web push not configured');
    return;
  }

  let rows: { id: string; endpoint: string; p256dh: string; auth: string }[] = [];
  try {
    const result = await query<{ id: string; endpoint: string; p256dh: string; auth: string }>(
      `select id, endpoint, p256dh, auth from push_subscriptions
       where account_id = $1 and account_role = $2`,
      [accountId, accountRole],
    );
    rows = result.rows;
  } catch (error) {
    logger.warn({ err: error }, 'push_subscriptions table is missing — run migrations');
    return;
  }
  if (!rows.length) return;

  const body = JSON.stringify({
    title: payload.title,
    message: payload.message,
    body: payload.message,
    link: payload.link ?? '/',
    id: payload.id ?? null,
  });

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          body,
        );
      } catch (error) {
        const status = Number((error as { statusCode?: number }).statusCode ?? 0);
        if (status === 404 || status === 410) {
          await query(`delete from push_subscriptions where id = $1`, [row.id]);
          return;
        }
        logger.warn({ err: error, endpoint: row.endpoint }, 'web push send failed');
      }
    }),
  );
}
