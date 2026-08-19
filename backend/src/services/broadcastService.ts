import { query } from '../config/db.js';
import { errors } from '../utils/errors.js';
import { sendOfficial } from '../integrations/email/emailService.js';
import { recordAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import type { AppRole } from '../types/index.js';

export type BroadcastAudience = 'guest' | 'host' | 'partner' | 'admin';
export type BroadcastChannel = 'push' | 'email' | 'both';

const ROLE: Record<BroadcastAudience, AppRole> = {
  guest: 'GUEST',
  host: 'HOST',
  partner: 'PARTNER',
  admin: 'ADMIN',
};

const INBOX_LINK: Record<BroadcastAudience, string> = {
  guest: '/notifications',
  host: '/host/notifications',
  partner: '/partner/notifications',
  admin: '/admin',
};

type Recipient = { id: string; email: string };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function notificationFlags() {
  const { rows } = await query<{ value: unknown }>(
    `select value from system_settings where key = 'notifications'`,
  );
  const raw = rows[0]?.value;
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const flags = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    pushEnabled: flags.pushEnabled !== false,
    emailEnabled: flags.emailEnabled !== false,
  };
}

async function loadRecipients(audience: BroadcastAudience): Promise<Recipient[]> {
  if (audience === 'guest') {
    try {
      const { rows } = await query<Recipient>(
        `select id, email from guests
         where deleted_at is null and coalesce(status, 'active') = 'active'`,
      );
      return rows;
    } catch {
      const { rows } = await query<Recipient>(
        `select id, email from guests where deleted_at is null`,
      );
      return rows;
    }
  }
  if (audience === 'host') {
    const { rows } = await query<Recipient>(
      `select id, email from hosts
       where deleted_at is null and status = 'active'`,
    );
    return rows;
  }
  if (audience === 'partner') {
    const { rows } = await query<Recipient>(
      `select id, email from partners
       where deleted_at is null and status = 'approved'`,
    );
    return rows;
  }
  const { rows } = await query<Recipient>(
    `select id, email from admin_users
     where deleted_at is null and status = 'active'`,
  );
  return rows;
}

function shapeBroadcast(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    audience: row.audience,
    channel: row.channel,
    status: row.status,
    recipients: Number(row.recipients ?? 0),
    emailed: Number(row.emailed ?? 0),
    failed: Number(row.failed ?? 0),
    opened: Number(row.opened ?? 0),
    failureReason: row.failure_reason ?? null,
    createdBy: row.created_by ?? null,
    sentAt: row.created_at ?? null,
    createdAt: row.created_at ?? null,
    scheduledFor: null,
    read: true,
  };
}

export async function listBroadcasts(input: {
  search?: string;
  audience?: string;
  status?: string;
}) {
  const search = (input.search ?? '').trim();
  const audience = input.audience && input.audience !== 'all' ? input.audience : null;
  const status = input.status && input.status !== 'all' ? input.status : null;
  const { rows } = await query(
    `select b.*,
            coalesce((
              select count(*)::int from notifications n
              where n.campaign_id = b.id and n.read = true
            ), 0) as opened
     from notification_broadcasts b
     where ($1 = '' or b.title ilike '%' || $1 || '%' or b.message ilike '%' || $1 || '%')
       and ($2::text is null or b.audience = $2)
       and ($3::text is null or b.status = $3)
     order by b.created_at desc
     limit 200`,
    [search, audience, status],
  );
  return rows.map((row) => shapeBroadcast(row as Record<string, unknown>));
}

export async function sendBroadcast(input: {
  title: string;
  message: string;
  audience: BroadcastAudience;
  channel: BroadcastChannel;
  actorId: string;
  actorName?: string | null;
}) {
  const title = input.title.trim();
  const message = input.message.trim();
  if (!title || !message) {
    throw errors.validation('A title and a message are both required.');
  }

  const flags = await notificationFlags();
  const wantPush = input.channel === 'push' || input.channel === 'both';
  const wantEmail = input.channel === 'email' || input.channel === 'both';
  const sendPush = wantPush && flags.pushEnabled;
  const sendEmail = wantEmail && flags.emailEnabled;

  if (!sendPush && !sendEmail) {
    throw errors.validation(
      wantPush && !flags.pushEnabled
        ? 'Push is turned off in Settings → Notifications.'
        : 'Email is turned off in Settings → Notifications.',
    );
  }

  const people = await loadRecipients(input.audience);
  if (!people.length) {
    throw errors.validation('There are no accounts in that audience to send to.');
  }

  const role = ROLE[input.audience];
  const link = INBOX_LINK[input.audience];
  const emailBody = `<p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>`;

  let recipients = 0;
  let emailed = 0;
  let failed = 0;
  const problems: string[] = [];

  const campaignId = (
    await query<{ id: string }>(
      `insert into notification_broadcasts
        (title, message, audience, channel, status, recipients, emailed, failed, created_by)
       values ($1,$2,$3,$4,'failed',0,0,0,$5)
       returning id`,
      [title, message, input.audience, input.channel, input.actorId],
    )
  ).rows[0].id;

  for (const person of people) {
    if (sendPush) {
      try {
        await createNotification({
          recipientId: person.id,
          recipientRole: role,
          type: 'ANNOUNCEMENT',
          title,
          message,
          link,
          entityType: 'broadcast',
          entityId: campaignId,
          campaignId,
        });
        recipients += 1;
      } catch (error) {
        failed += 1;
        if (problems.length < 3) problems.push(String((error as Error).message));
      }
    }

    if (sendEmail) {
      const result = await sendOfficial(
        person.email,
        title,
        'admin_broadcast',
        title,
        emailBody,
      );
      if (result.ok) emailed += 1;
      else {
        failed += 1;
        if (result.error && problems.length < 3) problems.push(result.error);
      }
    }
  }

  const skipped: string[] = [];
  if (wantPush && !flags.pushEnabled) skipped.push('push is disabled in settings');
  if (wantEmail && !flags.emailEnabled) skipped.push('email is disabled in settings');

  const delivered = sendPush ? recipients : emailed;
  let status: 'sent' | 'partial' | 'failed' = 'sent';
  if (delivered === 0) status = 'failed';
  else if (failed > 0) status = 'partial';

  const failureReason =
    status === 'sent' && !skipped.length
      ? null
      : [...problems, ...skipped].filter(Boolean).join(' · ') ||
        (status === 'failed' ? 'Nothing was delivered.' : null);

  await query(
    `update notification_broadcasts
        set status = $2, recipients = $3, emailed = $4, failed = $5, failure_reason = $6
      where id = $1`,
    [campaignId, status, sendPush ? recipients : people.length, emailed, failed, failureReason],
  );

  await recordAudit({
    actorId: input.actorId,
    actorRole: 'ADMIN',
    actorName: input.actorName ?? null,
    action: 'Sent notification',
    entity: 'Notification',
    entityId: campaignId,
    metadata: { audience: input.audience, channel: input.channel, status, recipients, emailed, failed },
  });

  const { rows } = await query(
    `select b.*, 0 as opened from notification_broadcasts b where b.id = $1`,
    [campaignId],
  );
  return shapeBroadcast(rows[0] as Record<string, unknown>);
}
