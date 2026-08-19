import { query, withTransaction } from '../config/db.js';
import { errors } from '../utils/errors.js';
import { recordAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import { sendOfficial } from '../integrations/email/emailService.js';
import { emitStatus } from '../sockets/io.js';
import { hashPassword, hydrateAccount, signToken } from './authService.js';
import type { AuthAccount } from '../types/index.js';

function slugify(name: string) {
  const base = String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42);
  return `${base || 'partner'}-${Date.now().toString(36)}`;
}

async function resolveCategoryId(value?: string | null) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) {
    const { rows } = await query<{ id: string }>(`select id from partner_categories where id = $1`, [raw]);
    return rows[0]?.id ?? null;
  }
  const slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const { rows } = await query<{ id: string }>(
    `select id from partner_categories
     where lower(name) = lower($1) or slug = $2 or name ilike $3
     order by (lower(name) = lower($1)) desc
     limit 1`,
    [raw, slug, `%${raw}%`],
  );
  return rows[0]?.id ?? null;
}

export const trackingPolicy = () => ({
  tracked: ['profile_view', 'website_click', 'phone_click', 'directions_click'],
  notTracked: [
    'Whether the guest actually bought anything',
    'Bookings taken by phone, email or in person',
    "Checkout on the partner's own website",
    'Whether the service was delivered',
  ],
});

export async function applyAsPartner(input: {
  email: string;
  password: string;
  name: string;
  ownerName?: string;
  categoryId?: string;
  category?: string;
  description?: string;
  phone?: string;
  website?: string;
  address?: string;
  town?: string;
  city?: string;
  state?: string;
  startingPrice?: number | string;
  priceLabel?: string;
  hours?: Record<string, string>;
  coverUrl?: string;
  photos?: unknown[];
}) {
  const email = String(input.email ?? '').trim().toLowerCase();
  const name = String(input.name ?? '').trim();
  const password = String(input.password ?? '');
  if (!email || !email.includes('@')) throw errors.validation('Enter a valid email address.', { field: 'email' });
  if (!name) throw errors.validation('Enter your business name.', { field: 'name' });
  if (password.length < 8) throw errors.validation('Choose a password of at least 8 characters.', { field: 'password' });

  const existing = await query(`select id from partners where lower(email) = $1 and deleted_at is null`, [email]);
  if (existing.rows[0]) {
    throw errors.conflict('An account with that email already exists. Sign in instead.');
  }

  const hash = await hashPassword(password);
  const categoryId = await resolveCategoryId(input.categoryId ?? input.category);
  const town = String(input.town ?? input.city ?? '').trim() || null;
  const price = Number(input.startingPrice);
  const cover = typeof input.coverUrl === 'string' && input.coverUrl
    ? input.coverUrl
    : Array.isArray(input.photos) && typeof input.photos[0] === 'string'
      ? input.photos[0]
      : typeof input.photos?.[0] === 'object' && input.photos[0] && 'image' in (input.photos[0] as object)
        ? String((input.photos[0] as { image?: string }).image ?? '')
        : null;
  const hours = input.hours && typeof input.hours === 'object' ? input.hours : {};

  let rows;
  try {
    const inserted = await query(
      `insert into partners (
         email, password_hash, name, owner_name, category_id, slug, short_description, description,
         phone, website, address, town, state, starting_price_cents, price_unit, hours, cover_url,
         listing_status, status
       )
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17,'paid_partner','pending')
       returning *`,
      [
        email,
        hash,
        name,
        input.ownerName ?? null,
        categoryId,
        slugify(name),
        String(input.description ?? '').slice(0, 160),
        input.description ?? '',
        input.phone ?? null,
        input.website ?? null,
        input.address ?? null,
        town,
        input.state ?? 'FL',
        Number.isFinite(price) && price > 0 ? Math.round(price * 100) : null,
        input.priceLabel ?? null,
        JSON.stringify(hours),
        cover || null,
      ],
    );
    rows = inserted.rows;
  } catch (err: unknown) {
    const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code) : '';
    if (code === '23505') throw errors.conflict('An account with that email already exists. Sign in instead.');
    throw err;
  }

  const { password_hash: _hash, ...partner } = rows[0] as Record<string, unknown> & { id: string; name: string; email: string };
  const account = await hydrateAccount('PARTNER', rows[0] as Record<string, unknown>);
  const token = signToken(account);
  const { rows: admins } = await query<{ id: string }>(`select id from admin_users where status = 'active'`);
  for (const admin of admins) {
    await createNotification({
      recipientId: admin.id,
      recipientRole: 'ADMIN',
      type: 'PARTNER_APPLICATION',
      title: 'New partner application',
      message: `${String(partner.name)} applied to be listed.`,
      link: `/admin/partners/${partner.id}`,
      entityType: 'partner',
      entityId: String(partner.id),
    });
  }
  void sendOfficial(
    String(partner.email),
    'We received your My30A partner application',
    'partner_submitted',
    'Application received',
    `<p>Thanks for applying. Your listing is pending review.</p>`,
  );
  return { ...partner, token, account };
}

export async function setPartnerStatus(id: string, status: string, reason: string, account: AuthAccount) {
  if (['rejected', 'suspended'].includes(status) && !reason) {
    throw errors.validation('A reason is required.');
  }
  await withTransaction(async (client) => {
    await client.query(
      `update partners set status = $2, reason = $3, published = ($2 = 'approved'), reviewed_at = now()
       where id = $1`,
      [id, status, reason || null],
    );
    await recordAudit(
      { actorId: account.id, actorRole: account.role, actorName: account.name, action: `Set partner ${status}`, entity: 'Partner', entityId: id, metadata: { reason } },
      client,
    );
  });
  const { rows } = await query(`select * from partners where id = $1`, [id]);
  const partner = rows[0];
  await createNotification({
    recipientId: partner.id,
    recipientRole: 'PARTNER',
    type: status === 'approved' ? 'PARTNER_APPROVED' : 'PARTNER_REJECTED',
    title: status === 'approved' ? 'Your listing is live' : `Application ${status}`,
    message: reason || `Your listing is ${status}.`,
    link: '/partner/dashboard',
    entityType: 'partner',
    entityId: id,
  });
  if (partner.email) {
    void sendOfficial(
      partner.email,
      `Your My30A partner listing is ${status}`,
      `partner_${status}`,
      `Partner listing ${status}`,
      `<p>${reason || `Your listing is now ${status}.`}</p>`,
    );
  }
  emitStatus(`partner:${id}`, 'partner:updated', { id, status });
  emitStatus('admin:ops', 'partner:updated', { id, status });
  return partner;
}

const EVENT_MAP: Record<string, 'partner_view' | 'website_click' | 'phone_click' | 'directions_click'> = {
  partner_view: 'partner_view',
  view: 'partner_view',
  partner_website_click: 'website_click',
  website_click: 'website_click',
  partner_phone_click: 'phone_click',
  phone_click: 'phone_click',
  partner_directions_click: 'directions_click',
  directions_click: 'directions_click',
};

export async function trackPartnerEvent(input: {
  partnerId: string;
  eventType: string;
  guestId?: string;
  propertyId?: string;
  sessionId?: string;
}) {
  const eventType = EVENT_MAP[input.eventType];
  if (!eventType) throw errors.validation('That click type is not tracked.');
  await query(
    `insert into partner_click_events (partner_id, guest_id, property_id, event_type, session_id)
     values ($1,$2,$3,$4,$5)`,
    [input.partnerId, input.guestId ?? null, input.propertyId ?? null, eventType, input.sessionId ?? null],
  );
  const col =
    eventType === 'partner_view'
      ? 'views'
      : eventType === 'website_click'
        ? 'website_clicks'
        : eventType === 'phone_click'
          ? 'phone_clicks'
          : 'directions_clicks';
  await query(
    `insert into partner_analytics_daily (partner_id, day, ${col}) values ($1, current_date, 1)
     on conflict (partner_id, day) do update set ${col} = partner_analytics_daily.${col} + 1`,
    [input.partnerId],
  );
  return { ok: true, ...trackingPolicy() };
}

export async function partnerAnalytics(partnerId: string, days = 30) {
  const { rows } = await query(
    `select coalesce(sum(views),0)::int as views,
            coalesce(sum(website_clicks),0)::int as website,
            coalesce(sum(phone_clicks),0)::int as phone,
            coalesce(sum(directions_clicks),0)::int as directions
     from partner_analytics_daily
     where partner_id = $1 and day >= current_date - $2::int`,
    [partnerId, days],
  );
  const totals = rows[0] ?? { views: 0, website: 0, phone: 0, directions: 0 };
  const series = await query(
    `select day, views, website_clicks as website, phone_clicks as phone, directions_clicks as directions
     from partner_analytics_daily where partner_id = $1 and day >= current_date - $2::int order by day`,
    [partnerId, days],
  );
  return { totals, series: series.rows, ...trackingPolicy() };
}

export async function getPartnerSelf(account: AuthAccount) {
  if (account.role !== 'PARTNER') throw errors.forbidden();
  const { rows } = await query(`select * from partners where id = $1`, [account.id]);
  if (!rows[0]) throw errors.notFound('your listing');
  const { password_hash: _p, ...safe } = rows[0];
  return safe;
}

export async function updatePartnerSelf(account: AuthAccount, patch: Record<string, unknown>) {
  await query(
    `insert into pending_partner_updates (partner_id, payload) values ($1,$2)`,
    [account.id, JSON.stringify(patch)],
  );
  return { ok: true, pendingReview: true };
}

export async function listPendingPartnerUpdates() {
  const { rows } = await query(
    `select u.*, p.name as partner_name from pending_partner_updates u
     join partners p on p.id = u.partner_id
     where u.status = 'pending' order by u.created_at desc`,
  );
  return rows;
}

export async function reviewPartnerUpdate(id: string, approve: boolean, account: AuthAccount) {
  const { rows } = await query(`select * from pending_partner_updates where id = $1`, [id]);
  const update = rows[0];
  if (!update) throw errors.notFound('that update');
  if (approve) {
    const payload = update.payload as Record<string, unknown>;
    const allowed = ['name', 'description', 'short_description', 'phone', 'website', 'address', 'town', 'hours', 'services', 'tags'];
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(payload)) {
      const col = key === 'shortDescription' ? 'short_description' : key;
      if (!allowed.includes(col)) continue;
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      sets.push(`${col} = $${values.length}`);
    }
    if (sets.length) {
      values.push(update.partner_id);
      await query(`update partners set ${sets.join(', ')} where id = $${values.length}`, values);
    }
  }
  await query(
    `update pending_partner_updates set status = $2, reviewed_at = now() where id = $1`,
    [id, approve ? 'approved' : 'rejected'],
  );
  await recordAudit({
    actorId: account.id,
    actorRole: account.role,
    action: approve ? 'Approved partner update' : 'Rejected partner update',
    entity: 'Partner',
    entityId: String(update.partner_id),
  });
  return { ok: true, approved: approve };
}
