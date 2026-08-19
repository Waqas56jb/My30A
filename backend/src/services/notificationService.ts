import { query } from '../config/db.js';
import { getIo } from '../sockets/io.js';
import { sendWebPush } from './pushService.js';
import type { AppRole } from '../types/index.js';

export async function createNotification(input: {
  recipientId: string;
  recipientRole: AppRole;
  type: string;
  title: string;
  message: string;
  link?: string;
  entityType?: string;
  entityId?: string;
  campaignId?: string;
  data?: unknown;
}) {
  const values = [
    input.recipientId,
    input.recipientRole,
    input.type,
    input.title,
    input.message,
    input.link ?? null,
    input.entityType ?? null,
    input.entityId ?? null,
    JSON.stringify(input.data ?? {}),
  ];
  let notification;
  try {
    const inserted = await query(
      `insert into notifications
        (recipient_id, recipient_role, type, title, message, link, entity_type, entity_id, data, campaign_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       returning *`,
      [...values, input.campaignId ?? null],
    );
    notification = inserted.rows[0];
  } catch {
    const inserted = await query(
      `insert into notifications
        (recipient_id, recipient_role, type, title, message, link, entity_type, entity_id, data)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning *`,
      values,
    );
    notification = inserted.rows[0];
  }
  const payload = {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    entityType: notification.entity_type,
    entityId: notification.entity_id,
    createdAt: notification.created_at,
  };
  const io = getIo();
  io?.to(`${input.recipientRole.toLowerCase()}:${input.recipientId}`).emit('notification:new', payload);
  void sendWebPush(input.recipientId, input.recipientRole, {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    link: notification.link,
  });
  return notification;
}

export async function listNotifications(recipientId: string, recipientRole: AppRole) {
  const { rows } = await query(
    `select * from notifications
     where recipient_id = $1 and recipient_role = $2
     order by created_at desc limit 100`,
    [recipientId, recipientRole],
  );
  return rows;
}

export async function unreadCount(recipientId: string, recipientRole: AppRole) {
  const { rows } = await query<{ count: string }>(
    `select count(*)::text as count from notifications
     where recipient_id = $1 and recipient_role = $2 and read = false`,
    [recipientId, recipientRole],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function markRead(id: string, recipientId: string) {
  await query(
    `update notifications set read = true, read_at = now()
     where id = $1 and recipient_id = $2`,
    [id, recipientId],
  );
}

export async function markAllRead(recipientId: string, recipientRole: AppRole) {
  await query(
    `update notifications set read = true, read_at = now()
     where recipient_id = $1 and recipient_role = $2 and read = false`,
    [recipientId, recipientRole],
  );
}
