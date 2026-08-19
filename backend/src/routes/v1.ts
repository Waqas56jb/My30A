import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok, validate } from '../utils/http.js';
import { optionalAuth, requireAuth, requirePermission, requireRole } from '../middleware/auth.js';
import { login, requestPasswordReset, resetPassword, hashPassword } from '../services/authService.js';
import { query } from '../config/db.js';
import {
  listRestaurants, getRestaurant, listPartnersPublic, getPartnerPublic,
  listBeaches, getBeach, listEvents, getEvent, getMapEntities, getWeather, getCategories,
  listAdminCategories,
} from '../services/exploreService.js';
import { listBeachAccess, getBeachAccessPoint, getBeachConditions } from '../services/beachAccessService.js';
import { syncEventsFeed } from '../services/eventsFeedService.js';
import { restaurantReservation, openTableSearchUrl } from '../services/openTableService.js';
import {
  listAdminRestaurants, createRestaurant, updateRestaurant, markRestaurantVerified,
  checkRestaurantBookingFreshness,
} from '../services/restaurantBookingService.js';
import { createGroceryRequest, getGrocery, listGroceries, setGroceryStatus } from '../services/groceryService.js';
import { createTransferRequest, getTransfer, listTransfers, setTransferStatus, previewCancellation } from '../services/transferService.js';
import { getPricingCatalog } from '../services/pricingService.js';
import { redeemAccess, getAuthorizedProperty, currentStay } from '../services/stayService.js';
import {
  applyAsPartner, setPartnerStatus, trackPartnerEvent, partnerAnalytics,
  getPartnerSelf, updatePartnerSelf, trackingPolicy,
  listPendingPartnerUpdates, reviewPartnerUpdate,
} from '../services/partnerService.js';
import { trackEvent, adminOverview, adminSeries } from '../services/analyticsService.js';
import { sendMessage, listGuestMessages, clearGuestConversations, listAdminConversations, getAdminConversation, vitoriaKpis } from '../services/vitoriaService.js';
import {
  listNotifications, markRead, markAllRead, unreadCount, createNotification,
} from '../services/notificationService.js';
import {
  listHostProperties, createProperty, updateProperty, getHostProperty,
  setPropertyStatus, regenerateGuestAccess, listHostGuests,
  listHostRecommendations, getHostRecommendation, createHostRecommendation,
  updateHostRecommendation, deleteHostRecommendation,
} from '../services/propertyService.js';
import { recordAudit } from '../services/auditService.js';
import {
  getAdminProfile, updateAdminProfile, changeAdminPassword, uploadAdminAvatar, removeAdminAvatar,
} from '../services/adminProfileService.js';
import { errors } from '../utils/errors.js';
import { uploadProof } from '../services/storageService.js';
import type { AppRole, GroceryStatus, TransferStatus } from '../types/index.js';

export const v1 = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['GUEST', 'HOST', 'PARTNER', 'ADMIN']),
  remember: z.boolean().optional(),
}).strict();

v1.post('/auth/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const result = await login(req.body);
  await recordAudit({ actorId: result.account.id, actorRole: result.account.role, action: 'login', entity: 'Session', entityId: result.account.id, ip: req.ip });
  ok(res, result);
}));

v1.post('/auth/register', validate(z.object({
  role: z.enum(['GUEST', 'HOST']),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
}).strict()), asyncHandler(async (req, res) => {
  const hash = await hashPassword(req.body.password);
  if (req.body.role === 'GUEST') {
    const { rows } = await query(
      `insert into guests (email, password_hash, first_name, last_name, phone) values ($1,$2,$3,$4,$5) returning id, email, first_name, last_name, phone`,
      [req.body.email.toLowerCase(), hash, req.body.firstName, req.body.lastName, req.body.phone ?? ''],
    );
    const result = await login({ email: req.body.email, password: req.body.password, role: 'GUEST' });
    return ok(res, { ...result, profile: rows[0] }, 201);
  }
  const { rows } = await query(
    `insert into hosts (email, password_hash, first_name, last_name, phone, status) values ($1,$2,$3,$4,$5,'pending') returning id, email, first_name, last_name`,
    [req.body.email.toLowerCase(), hash, req.body.firstName, req.body.lastName, req.body.phone ?? ''],
  );
  const result = await login({ email: req.body.email, password: req.body.password, role: 'HOST' });
  ok(res, { ...result, profile: rows[0] }, 201);
}));

v1.post('/auth/forgot-password', validate(z.object({
  email: z.string().email(),
  role: z.enum(['GUEST', 'HOST', 'PARTNER', 'ADMIN']),
}).strict()), asyncHandler(async (req, res) => {
  const out = await requestPasswordReset(req.body.email, req.body.role as AppRole);
  ok(res, { ok: true, email: out.email });
}));

v1.post('/auth/reset-password', validate(z.object({
  role: z.enum(['GUEST', 'HOST', 'PARTNER', 'ADMIN']),
  token: z.string(),
  password: z.string().min(8),
}).strict()), asyncHandler(async (req, res) => {
  ok(res, await resetPassword(req.body.role, req.body.token, req.body.password));
}));

v1.get('/auth/me', requireAuth, asyncHandler(async (req, res) => {
  ok(res, req.auth);
}));

v1.post('/auth/logout', requireAuth, asyncHandler(async (req, res) => {
  await recordAudit({ actorId: req.auth?.id, actorRole: req.auth?.role, action: 'logout', entity: 'Session', entityId: req.auth?.id, ip: req.ip });
  ok(res, { ok: true });
}));

// Public explore
v1.get('/restaurants', asyncHandler(async (req, res) => ok(res, await listRestaurants({ search: String(req.query.search ?? ''), category: String(req.query.category ?? '') }))));
v1.get('/restaurants/opentable', asyncHandler(async (req, res) => {
  ok(res, {
    provider: 'opentable',
    partnership: false,
    url: openTableSearchUrl({
      query: String(req.query.query ?? req.query.term ?? ''),
      covers: req.query.covers ? Number(req.query.covers) : 2,
      dateTime: req.query.dateTime ? String(req.query.dateTime) : undefined,
    }),
  });
}));
v1.get('/restaurants/:id/reserve', asyncHandler(async (req, res) => {
  ok(res, await restaurantReservation(req.params.id));
}));
v1.get('/restaurants/:id', asyncHandler(async (req, res) => ok(res, await getRestaurant(req.params.id))));
v1.get('/partners', asyncHandler(async (req, res) => ok(res, await listPartnersPublic({ search: String(req.query.search ?? ''), category: String(req.query.category ?? '') }))));
v1.post('/partners/apply', asyncHandler(async (req, res) => ok(res, await applyAsPartner(req.body), 201)));
v1.get('/partners/tracking-policy', (_req, res) => ok(res, trackingPolicy()));
v1.get('/partners/me', requireAuth, requireRole('PARTNER'), asyncHandler(async (req, res) => ok(res, await getPartnerSelf(req.auth!))));
v1.patch('/partners/me', requireAuth, requireRole('PARTNER'), asyncHandler(async (req, res) => ok(res, await updatePartnerSelf(req.auth!, req.body))));
v1.get('/partners/me/analytics', requireAuth, requireRole('PARTNER'), asyncHandler(async (req, res) => ok(res, await partnerAnalytics(req.auth!.id, Number(req.query.days ?? 30)))));
v1.get('/partners/:id', asyncHandler(async (req, res) => ok(res, await getPartnerPublic(req.params.id))));
v1.get('/beaches', asyncHandler(async (req, res) => ok(res, await listBeaches(String(req.query.search ?? ''), String(req.query.useClass ?? '')))));
v1.get('/beaches/:id', asyncHandler(async (req, res) => ok(res, await getBeach(req.params.id))));
v1.get('/public/beach-access', asyncHandler(async (req, res) => ok(res, await listBeachAccess({
  search: String(req.query.search ?? ''),
  useClass: String(req.query.useClass ?? 'all'),
  neighborhood: String(req.query.neighborhood ?? ''),
}))));
v1.get('/public/beach-access/:id', asyncHandler(async (req, res) => ok(res, await getBeachAccessPoint(req.params.id))));
v1.get('/public/beach-conditions', asyncHandler(async (_req, res) => ok(res, await getBeachConditions())));
v1.get('/events', asyncHandler(async (req, res) => ok(res, await listEvents({ search: String(req.query.search ?? ''), category: String(req.query.category ?? '') }))));
v1.get('/events/:id', asyncHandler(async (req, res) => ok(res, await getEvent(req.params.id))));
v1.get('/map/entities', asyncHandler(async (_req, res) => ok(res, await getMapEntities())));
v1.get('/explore/weather', asyncHandler(async (req, res) => ok(res, await getWeather(req.query.lat ? Number(req.query.lat) : undefined, req.query.lon ? Number(req.query.lon) : undefined))));
v1.get('/weather', asyncHandler(async (_req, res) => ok(res, await getWeather())));
v1.get('/local-guide/categories', asyncHandler(async (_req, res) => ok(res, await getCategories())));
v1.get('/pricing', asyncHandler(async (_req, res) => ok(res, await getPricingCatalog())));

v1.post('/analytics/events', optionalAuth, asyncHandler(async (req, res) => {
  const events = Array.isArray(req.body) ? req.body : [req.body];
  for (const event of events) {
    void trackEvent({
      eventName: String(event.event ?? event.eventName ?? 'unknown'),
      userId: req.auth?.id,
      guestId: req.auth?.role === 'GUEST' ? req.auth.id : event.guestId,
      partnerId: event.partnerId,
      propertyId: req.auth?.propertyId ?? event.propertyId,
      metadata: event.properties ?? event.metadata,
    });
  }
  ok(res, { accepted: true });
}));

v1.post('/partners/:id/events', optionalAuth, asyncHandler(async (req, res) => {
  ok(res, await trackPartnerEvent({
    partnerId: req.params.id,
    eventType: req.body.eventType,
    guestId: req.auth?.role === 'GUEST' ? req.auth.id : undefined,
    propertyId: req.auth?.propertyId ?? undefined,
    sessionId: req.body.sessionId,
  }));
}));

// Guest stay / profile
v1.get('/guests/me', requireAuth, requireRole('GUEST'), asyncHandler(async (req, res) => {
  const { rows } = await query(`select id, email, first_name, last_name, phone, avatar_url, language from guests where id = $1`, [req.auth!.id]);
  const stay = await currentStay(req.auth!.id);
  const prefs = await query(`select * from guest_preferences where guest_id = $1`, [req.auth!.id]);
  const saved = await query(`select entity_id from saved_items where guest_id = $1`, [req.auth!.id]);
  ok(res, { ...rows[0], stay, preferences: prefs.rows[0] ?? {}, savedPlaceIds: saved.rows.map((r) => r.entity_id) });
}));

v1.patch('/guests/me', requireAuth, requireRole('GUEST'), asyncHandler(async (req, res) => {
  const { firstName, lastName, phone } = req.body as Record<string, string>;
  const { rows } = await query(
    `update guests set first_name = coalesce($2, first_name), last_name = coalesce($3, last_name), phone = coalesce($4, phone)
     where id = $1 returning id, email, first_name, last_name, phone`,
    [req.auth!.id, firstName, lastName, phone],
  );
  ok(res, rows[0]);
}));

v1.put('/guests/me/preferences', requireAuth, requireRole('GUEST'), asyncHandler(async (req, res) => {
  await query(
    `insert into guest_preferences (guest_id, cuisines, dietary, traveling_with_kids, activities, pace, budget)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (guest_id) do update set cuisines = $2, dietary = $3, traveling_with_kids = $4, activities = $5, pace = $6, budget = $7`,
    [req.auth!.id, JSON.stringify(req.body.cuisines ?? []), JSON.stringify(req.body.dietary ?? []), Boolean(req.body.travelingWithKids), JSON.stringify(req.body.activities ?? []), req.body.pace ?? null, req.body.budget ?? null],
  );
  ok(res, req.body);
}));

v1.post('/guests/me/saved', requireAuth, requireRole('GUEST'), asyncHandler(async (req, res) => {
  const id = String(req.body.id);
  const existing = await query(`select id from saved_items where guest_id = $1 and entity_id = $2`, [req.auth!.id, id]);
  if (existing.rowCount) await query(`delete from saved_items where guest_id = $1 and entity_id = $2`, [req.auth!.id, id]);
  else await query(`insert into saved_items (guest_id, entity_id) values ($1,$2)`, [req.auth!.id, id]);
  const saved = await query(`select entity_id from saved_items where guest_id = $1`, [req.auth!.id]);
  ok(res, saved.rows.map((r) => r.entity_id));
}));

v1.get('/stays/current', requireAuth, requireRole('GUEST'), asyncHandler(async (req, res) => {
  ok(res, await currentStay(req.auth!.id));
}));

v1.get('/properties/authorized', requireAuth, requireRole('GUEST'), asyncHandler(async (req, res) => {
  ok(res, await getAuthorizedProperty(req.auth!));
}));

v1.post('/access-codes/redeem', requireAuth, requireRole('GUEST'), validate(z.object({ code: z.string().min(3) }).strict()), asyncHandler(async (req, res) => {
  ok(res, await redeemAccess(req.auth!, req.body.code));
}));

// Grocery / transfers
v1.get('/grocery', requireAuth, asyncHandler(async (req, res) => ok(res, await listGroceries(req.auth!, { status: String(req.query.status ?? '') }))));
v1.get('/grocery/:id', requireAuth, asyncHandler(async (req, res) => ok(res, await getGrocery(req.params.id, req.auth!))));
v1.post('/grocery', requireAuth, requireRole('GUEST', 'ADMIN'), asyncHandler(async (req, res) => {
  ok(res, await createGroceryRequest(req.auth!, req.body), 201);
}));
v1.post('/grocery/:id/status', requireAuth, requireRole('ADMIN'), requirePermission('orders', 'edit'), asyncHandler(async (req, res) => {
  ok(res, await setGroceryStatus(req.params.id, req.body.status as GroceryStatus, req.auth!, req.body));
}));
v1.post('/grocery/:id/cancel', requireAuth, requireRole('GUEST', 'ADMIN'), asyncHandler(async (req, res) => {
  ok(res, await setGroceryStatus(req.params.id, 'cancelled', req.auth!, { note: 'Cancelled' }));
}));
v1.post('/grocery/:id/pay', requireAuth, asyncHandler(async () => {
  throw errors.paymentNotConfigured();
}));
v1.post('/grocery/:id/tip', requireAuth, requireRole('GUEST'), asyncHandler(async (req, res) => {
  await query(`update grocery_orders set tip_percent = $2, tip_amount_cents = $3, tip_status = 'pending_payment' where id = $1`, [req.params.id, req.body.percent ?? null, req.body.amount != null ? Math.round(req.body.amount * 100) : null]);
  throw errors.paymentNotConfigured();
}));
v1.post('/grocery/:id/rating', requireAuth, requireRole('GUEST'), asyncHandler(async (req, res) => {
  await query(`insert into ratings (guest_id, subject_type, subject_id, rating, comment) values ($1,'grocery',$2,$3,$4) on conflict do nothing`, [req.auth!.id, req.params.id, req.body.stars, req.body.feedback ?? '']);
  await query(`update grocery_orders set rating = $2 where id = $1`, [req.params.id, JSON.stringify(req.body)]);
  ok(res, { ok: true });
}));

v1.get('/transfers', requireAuth, asyncHandler(async (req, res) => ok(res, await listTransfers(req.auth!, { status: String(req.query.status ?? ''), airport: String(req.query.airport ?? '') }))));
v1.get('/transfers/:id', requireAuth, asyncHandler(async (req, res) => ok(res, await getTransfer(req.params.id, req.auth!))));
v1.post('/transfers', requireAuth, requireRole('GUEST', 'ADMIN'), asyncHandler(async (req, res) => ok(res, await createTransferRequest(req.auth!, req.body), 201)));
v1.get('/transfers/:id/cancellation-preview', requireAuth, asyncHandler(async (req, res) => ok(res, await previewCancellation(req.params.id, req.auth!))));
v1.post('/transfers/:id/status', requireAuth, requireRole('ADMIN'), requirePermission('orders', 'edit'), asyncHandler(async (req, res) => {
  ok(res, await setTransferStatus(req.params.id, req.body.status as TransferStatus, req.auth!, req.body));
}));
v1.post('/transfers/:id/cancel', requireAuth, requireRole('GUEST', 'ADMIN'), asyncHandler(async (req, res) => {
  ok(res, await setTransferStatus(req.params.id, 'cancelled', req.auth!, { cancelReason: req.body.reason }));
}));
v1.post('/transfers/:id/authorize', requireAuth, asyncHandler(async () => {
  throw errors.paymentNotConfigured();
}));
v1.post('/transfers/quote', asyncHandler(async (req, res) => {
  const { airportFare } = await import('../services/pricingService.js');
  const fare = await airportFare(String(req.body.airport), String(req.body.vehicleClass ?? 'suv'), Number(req.body.bags ?? 0));
  ok(res, { quotedPrice: fare / 100, quoted_fare_cents: fare });
}));

// Vitoria
v1.post('/vitoria/chat', requireAuth, requireRole('GUEST'), asyncHandler(async (req, res) => {
  ok(res, await sendMessage(req.auth!, String(req.body.text ?? req.body.message ?? ''), req.body.conversationId));
}));
v1.post('/conversations/clear', requireAuth, requireRole('GUEST'), asyncHandler(async (req, res) => {
  ok(res, await clearGuestConversations(req.auth!));
}));
v1.get('/conversations', requireAuth, asyncHandler(async (req, res) => {
  if (req.auth!.role === 'GUEST') return ok(res, await listGuestMessages(req.auth!));
  if (req.auth!.role === 'HOST') return ok(res, await listAdminConversations(req.auth!.id));
  ok(res, await listAdminConversations());
}));
v1.get('/orders', requireAuth, requireRole('GUEST', 'ADMIN'), asyncHandler(async (req, res) => {
  const [groceries, transfers] = await Promise.all([
    listGroceries(req.auth!, { status: String(req.query.status ?? '') }),
    listTransfers(req.auth!, { status: String(req.query.status ?? '') }),
  ]);
  ok(res, { groceries, transfers });
}));

v1.get('/hosts/me', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `select id, email, first_name, last_name, phone, company, avatar_url, preferred_contact, status, email_verified, created_at
     from hosts where id = $1`,
    [req.auth!.id],
  );
  ok(res, rows[0]);
}));

v1.patch('/hosts/me', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, company, preferredContact } = req.body as Record<string, string>;
  const { rows } = await query(
    `update hosts set first_name = coalesce($2, first_name), last_name = coalesce($3, last_name),
      phone = coalesce($4, phone), company = coalesce($5, company), preferred_contact = coalesce($6, preferred_contact)
     where id = $1 returning id, email, first_name, last_name, phone, company, preferred_contact, status`,
    [req.auth!.id, firstName, lastName, phone, company, preferredContact],
  );
  ok(res, rows[0]);
}));

v1.get('/conversations/:id', requireAuth, asyncHandler(async (req, res) => {
  const detail = await getAdminConversation(req.params.id);
  if (!detail) throw errors.notFound('that conversation');
  if (req.auth!.role === 'GUEST' && detail.guest_id !== req.auth!.id) throw errors.notFound('that conversation');
  if (req.auth!.role === 'PARTNER') throw errors.forbidden();
  if (req.auth!.role === 'HOST') {
    const own = await query(`select 1 from properties where id = $1 and host_id = $2`, [detail.property_id, req.auth!.id]);
    if (!own.rowCount) throw errors.notFound('that conversation');
    const vis = (await query<{ vitoria: { conversation_visibility?: string } }>(
      `select vitoria from properties where id = $1`,
      [detail.property_id],
    )).rows[0]?.vitoria?.conversation_visibility ?? 'metadata';
    if (vis !== 'full') return ok(res, { ...detail, messages: [], visibility: vis });
  }
  ok(res, { ...detail, visibility: 'full' });
}));

// Notifications
v1.get('/notifications', requireAuth, asyncHandler(async (req, res) => {
  ok(res, {
    items: await listNotifications(req.auth!.id, req.auth!.role),
    unread: await unreadCount(req.auth!.id, req.auth!.role),
  });
}));
v1.post('/notifications/:id/read', requireAuth, asyncHandler(async (req, res) => {
  await markRead(req.params.id, req.auth!.id);
  ok(res, { ok: true });
}));
v1.post('/notifications/read-all', requireAuth, asyncHandler(async (req, res) => {
  await markAllRead(req.auth!.id, req.auth!.role);
  ok(res, { ok: true });
}));

// Host
v1.get('/hosts/me/properties', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => ok(res, await listHostProperties(req.auth!.id))));
v1.post('/hosts/me/properties', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => ok(res, await createProperty(req.auth!, req.body), 201)));
v1.get('/hosts/me/properties/:id', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => ok(res, await getHostProperty(req.auth!, req.params.id))));
v1.patch('/hosts/me/properties/:id', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => ok(res, await updateProperty(req.auth!, req.params.id, req.body))));
v1.post('/hosts/me/properties/:id/status', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => ok(res, await setPropertyStatus(req.auth!, req.params.id, req.body.status))));
v1.post('/hosts/me/properties/:id/access', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => ok(res, await regenerateGuestAccess(req.auth!, req.params.id))));
v1.get('/hosts/me/guests', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => ok(res, await listHostGuests(req.auth!.id))));
v1.get('/hosts/me/analytics', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => {
  const guests = await listHostGuests(req.auth!.id);
  ok(res, { guests: guests.length, properties: (await listHostProperties(req.auth!.id)).length });
}));
v1.get('/hosts/me/recommendations', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => {
  ok(res, await listHostRecommendations(req.auth!.id, req.query.propertyId ? String(req.query.propertyId) : undefined));
}));
v1.post('/hosts/me/recommendations', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => {
  ok(res, await createHostRecommendation(req.auth!, req.body), 201);
}));
v1.get('/hosts/me/recommendations/:id', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => {
  ok(res, await getHostRecommendation(req.auth!.id, req.params.id));
}));
v1.patch('/hosts/me/recommendations/:id', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => {
  ok(res, await updateHostRecommendation(req.auth!, req.params.id, req.body));
}));
v1.delete('/hosts/me/recommendations/:id', requireAuth, requireRole('HOST'), asyncHandler(async (req, res) => {
  ok(res, await deleteHostRecommendation(req.auth!, req.params.id));
}));

// Admin
v1.get('/admin/overview', requireAuth, requireRole('ADMIN'), requirePermission('analytics', 'view'), asyncHandler(async (_req, res) => ok(res, await adminOverview())));
v1.get('/admin/vitoria/kpis', requireAuth, requireRole('ADMIN'), requirePermission('analytics', 'view'), asyncHandler(async (_req, res) => {
  ok(res, await vitoriaKpis());
}));
v1.get('/admin/insights/series', requireAuth, requireRole('ADMIN'), requirePermission('analytics', 'view'), asyncHandler(async (req, res) => {
  ok(res, await adminSeries(String(req.query.metric ?? 'conversations'), String(req.query.range ?? '30d')));
}));
v1.get('/admin/guests', requireAuth, requireRole('ADMIN'), requirePermission('users', 'view'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`
    select g.id, g.email, g.first_name, g.last_name, g.phone, g.language, g.created_at,
           s.check_in_date, s.check_out_date, s.adults, s.children, s.party_size,
           s.confirmation_code, s.status as stay_status,
           p.id as property_id, p.name as property_name, p.host_id,
           trim(h.first_name || ' ' || h.last_name) as host_name
    from guests g
    left join lateral (
      select * from guest_stays
      where guest_id = g.id
      order by check_in_date desc nulls last
      limit 1
    ) s on true
    left join properties p on p.id = s.property_id
    left join hosts h on h.id = p.host_id
    where g.deleted_at is null
    order by g.created_at desc
  `);
  ok(res, { rows, total: rows.length });
}));
v1.get('/admin/hosts', requireAuth, requireRole('ADMIN'), requirePermission('hosts', 'view'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`
    select h.id, h.email, h.first_name, h.last_name, h.company, h.status, h.phone, h.notes, h.created_at,
           (select count(*)::int from properties p where p.host_id = h.id and p.deleted_at is null) as property_count
    from hosts h
    where h.deleted_at is null
    order by h.created_at desc
  `);
  ok(res, { rows, total: rows.length });
}));
v1.post('/admin/hosts/:id/status', requireAuth, requireRole('ADMIN'), requirePermission('hosts', 'edit'), asyncHandler(async (req, res) => {
  await query(`update hosts set status = $2, notes = coalesce($3, notes) where id = $1`, [req.params.id, req.body.status, req.body.reason ?? null]);
  await recordAudit({ actorId: req.auth!.id, actorRole: 'ADMIN', action: `Host ${req.body.status}`, entity: 'Host', entityId: req.params.id });
  ok(res, { ok: true });
}));
v1.get('/admin/partners', requireAuth, requireRole('ADMIN'), requirePermission('partners', 'view'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`
    select id, email, name, owner_name, status, published, featured, submitted_at,
           phone, website, town, address, cover_url, logo_url, category_id,
           starting_price_cents, hours, description
    from partners
    where deleted_at is null
    order by submitted_at desc nulls last
  `);
  ok(res, { rows, total: rows.length });
}));
v1.post('/admin/partners/:id/status', requireAuth, requireRole('ADMIN'), requirePermission('partners', 'edit'), asyncHandler(async (req, res) => {
  ok(res, await setPartnerStatus(req.params.id, req.body.status, req.body.reason ?? '', req.auth!));
}));
v1.get('/admin/properties', requireAuth, requireRole('ADMIN'), requirePermission('properties', 'view'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`select p.*, h.first_name || ' ' || h.last_name as host_name from properties p join hosts h on h.id = p.host_id where p.deleted_at is null`);
  ok(res, { rows, total: rows.length });
}));
v1.get('/admin/audit', requireAuth, requireRole('ADMIN'), requirePermission('settings', 'view'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`select * from audit_logs order by created_at desc limit 200`);
  ok(res, { rows, total: rows.length });
}));
v1.get('/admin/settings', requireAuth, requireRole('ADMIN'), requirePermission('settings', 'view'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`select key, value from system_settings`);
  ok(
    res,
    Object.fromEntries(
      rows.map((r) => {
        const value = r.value;
        if (typeof value === 'string') {
          try {
            return [r.key, JSON.parse(value)];
          } catch {
            return [r.key, value];
          }
        }
        return [r.key, value];
      }),
    ),
  );
}));
v1.put('/admin/settings/:key', requireAuth, requireRole('ADMIN'), requirePermission('settings', 'full'), asyncHandler(async (req, res) => {
  await query(
    `insert into system_settings (key, value) values ($1,$2::jsonb) on conflict (key) do update set value = $2::jsonb, updated_at = now()`,
    [req.params.key, JSON.stringify(req.body ?? {})],
  );
  await recordAudit({ actorId: req.auth!.id, actorRole: 'ADMIN', action: 'Updated settings', entity: 'Settings', entityId: req.params.key });
  ok(res, { ok: true });
}));
v1.post('/admin/notifications', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  ok(res, await createNotification(req.body), 201);
}));
v1.get('/admin/knowledge', requireAuth, requireRole('ADMIN'), requirePermission('content', 'view'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`select id, question, content, type, source_type, is_active, used_count from knowledge_chunks order by updated_at desc`);
  ok(res, rows);
}));
v1.post('/admin/knowledge', requireAuth, requireRole('ADMIN'), requirePermission('content', 'edit'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `insert into knowledge_chunks (question, content, type, source_type, is_active) values ($1,$2,$3,$4,true) returning *`,
    [req.body.question, req.body.answer ?? req.body.content, req.body.type ?? 'FAQ', req.body.source ?? 'admin'],
  );
  ok(res, rows[0], 201);
}));
v1.get('/ratings', requireAuth, requireRole('ADMIN'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`select * from ratings order by created_at desc`);
  ok(res, rows);
}));
v1.post('/ratings/:id/status', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  await query(`update ratings set status = $2 where id = $1`, [req.params.id, req.body.status]);
  ok(res, { ok: true });
}));
v1.post('/stays/rating', requireAuth, requireRole('GUEST'), asyncHandler(async (req, res) => {
  await query(
    `insert into ratings (guest_id, subject_type, subject_id, property_id, rating, comment)
     values ($1,'stay',$2,$3,$4,$5) on conflict do nothing`,
    [req.auth!.id, req.auth!.stayId ?? req.auth!.id, req.auth!.propertyId ?? null, req.body.stars, req.body.feedback ?? ''],
  );
  ok(res, { ok: true });
}));

v1.get('/admin/guests/:id', requireAuth, requireRole('ADMIN'), requirePermission('users', 'view'), asyncHandler(async (req, res) => {
  const { rows } = await query(`
    select g.id, g.email, g.first_name, g.last_name, g.phone, g.language, g.created_at,
           s.check_in_date, s.check_out_date, s.adults, s.children, s.party_size,
           s.confirmation_code, s.status as stay_status,
           p.id as property_id, p.name as property_name, p.host_id,
           trim(h.first_name || ' ' || h.last_name) as host_name
    from guests g
    left join lateral (
      select * from guest_stays
      where guest_id = g.id
      order by check_in_date desc nulls last
      limit 1
    ) s on true
    left join properties p on p.id = s.property_id
    left join hosts h on h.id = p.host_id
    where g.id = $1 and g.deleted_at is null
  `, [req.params.id]);
  if (!rows[0]) throw errors.notFound('that guest');
  ok(res, rows[0]);
}));
v1.get('/admin/hosts/:id', requireAuth, requireRole('ADMIN'), requirePermission('hosts', 'view'), asyncHandler(async (req, res) => {
  const { rows } = await query(`
    select h.id, h.email, h.first_name, h.last_name, h.company, h.status, h.phone, h.notes, h.created_at,
           (select count(*)::int from properties p where p.host_id = h.id and p.deleted_at is null) as property_count
    from hosts h
    where h.id = $1 and h.deleted_at is null
  `, [req.params.id]);
  if (!rows[0]) throw errors.notFound('that host');
  ok(res, rows[0]);
}));
v1.get('/admin/partners/:id', requireAuth, requireRole('ADMIN'), requirePermission('partners', 'view'), asyncHandler(async (req, res) => {
  const { rows } = await query(`
    select id, email, name, owner_name, status, published, featured, phone, website,
           description, reason, submitted_at, town, address, cover_url, logo_url,
           category_id, starting_price_cents, hours
    from partners
    where id = $1 and deleted_at is null
  `, [req.params.id]);
  if (!rows[0]) throw errors.notFound('that partner');
  ok(res, rows[0]);
}));
v1.get('/admin/properties/:id', requireAuth, requireRole('ADMIN'), requirePermission('properties', 'view'), asyncHandler(async (req, res) => {
  ok(res, await getHostProperty(req.auth!, req.params.id));
}));
v1.patch('/admin/properties/:id', requireAuth, requireRole('ADMIN'), requirePermission('properties', 'edit'), asyncHandler(async (req, res) => {
  ok(res, await updateProperty(req.auth!, req.params.id, req.body));
}));
v1.get('/admin/categories', requireAuth, requireRole('ADMIN'), requirePermission('content', 'view'), asyncHandler(async (_req, res) => {
  ok(res, await listAdminCategories());
}));
v1.post('/admin/categories', requireAuth, requireRole('ADMIN'), requirePermission('content', 'edit'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `insert into partner_categories (name, slug, blurb, sort_order, enabled) values ($1,$2,$3,$4,$5) returning *`,
    [req.body.name, String(req.body.slug ?? req.body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'), req.body.blurb ?? '', req.body.sortOrder ?? 0, req.body.enabled !== false],
  );
  await recordAudit({ actorId: req.auth!.id, actorRole: 'ADMIN', action: 'Created category', entity: 'Category', entityId: rows[0].id });
  ok(res, rows[0], 201);
}));
v1.patch('/admin/categories/:id', requireAuth, requireRole('ADMIN'), requirePermission('content', 'edit'), asyncHandler(async (req, res) => {
  if (req.body.direction === 'up' || req.body.direction === 'down') {
    const { rows: all } = await query(`select id, sort_order from partner_categories order by sort_order, name`);
    const i = all.findIndex((row) => String(row.id) === String(req.params.id));
    if (i < 0) throw errors.notFound('that category');
    const j = req.body.direction === 'up' ? i - 1 : i + 1;
    if (j >= 0 && j < all.length) {
      const next = [...all];
      const [moved] = next.splice(i, 1);
      next.splice(j, 0, moved);
      for (let k = 0; k < next.length; k += 1) {
        await query(`update partner_categories set sort_order = $2 where id = $1`, [next[k].id, k + 1]);
      }
    }
    return ok(res, await listAdminCategories());
  }
  const { rows } = await query(
    `update partner_categories set name = coalesce($2, name), blurb = coalesce($3, blurb), enabled = coalesce($4, enabled), sort_order = coalesce($5, sort_order)
     where id = $1 returning *`,
    [req.params.id, req.body.name, req.body.blurb, req.body.enabled, req.body.sortOrder],
  );
  if (!rows[0]) throw errors.notFound('that category');
  ok(res, rows[0]);
}));
v1.delete('/admin/categories/:id', requireAuth, requireRole('ADMIN'), requirePermission('content', 'full'), asyncHandler(async (req, res) => {
  const listed = await query(`select 1 from partners where category_id = $1 limit 1`, [req.params.id]);
  if (listed.rowCount) {
    await query(`update partner_categories set enabled = false where id = $1`, [req.params.id]);
    return ok(res, { disabled: true, deleted: false });
  }
  await query(`delete from partner_categories where id = $1`, [req.params.id]);
  ok(res, { deleted: true });
}));
v1.get('/admin/restaurants', requireAuth, requireRole('ADMIN'), requirePermission('content', 'view'), asyncHandler(async (_req, res) => {
  ok(res, await listAdminRestaurants());
}));
v1.get('/admin/restaurants/freshness', requireAuth, requireRole('ADMIN'), requirePermission('content', 'view'), asyncHandler(async (_req, res) => {
  ok(res, await checkRestaurantBookingFreshness());
}));
v1.post('/admin/restaurants', requireAuth, requireRole('ADMIN'), requirePermission('content', 'edit'), asyncHandler(async (req, res) => {
  ok(res, await createRestaurant(req.body as Record<string, unknown>), 201);
}));
v1.patch('/admin/restaurants/:id', requireAuth, requireRole('ADMIN'), requirePermission('content', 'edit'), asyncHandler(async (req, res) => {
  ok(res, await updateRestaurant(req.params.id, req.body as Record<string, unknown>));
}));
v1.post('/admin/restaurants/:id/verify', requireAuth, requireRole('ADMIN'), requirePermission('content', 'edit'), asyncHandler(async (req, res) => {
  ok(res, await markRestaurantVerified(req.params.id));
}));
v1.post('/admin/events/sync', requireAuth, requireRole('ADMIN'), requirePermission('content', 'edit'), asyncHandler(async (_req, res) => {
  ok(res, await syncEventsFeed());
}));
v1.post('/admin/events', requireAuth, requireRole('ADMIN'), requirePermission('content', 'edit'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `insert into events (title, description, event_date, event_time, location, category, active)
     values ($1,$2,$3,$4,$5,$6,true) returning *`,
    [req.body.title ?? req.body.name, req.body.description ?? '', req.body.date ?? req.body.event_date, req.body.time ?? null, req.body.location ?? '', req.body.category ?? ''],
  );
  ok(res, rows[0], 201);
}));
v1.patch('/admin/events/:id', requireAuth, requireRole('ADMIN'), requirePermission('content', 'edit'), asyncHandler(async (req, res) => {
  const { rows } = await query(`update events set title = coalesce($2, title), active = coalesce($3, active) where id = $1 returning *`, [req.params.id, req.body.title ?? req.body.name, req.body.active]);
  if (!rows[0]) throw errors.notFound('that event');
  ok(res, rows[0]);
}));
v1.get('/admin/content', requireAuth, requireRole('ADMIN'), requirePermission('content', 'view'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`select * from content_blocks order by sort_order, created_at`);
  ok(res, rows);
}));
v1.patch('/admin/content/:id', requireAuth, requireRole('ADMIN'), requirePermission('content', 'edit'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `update content_blocks set title = coalesce($2, title), body = coalesce($3, body), published = coalesce($4, published)
     where id = $1 returning *`,
    [req.params.id, req.body.title, req.body.body, req.body.published],
  );
  if (!rows[0]) throw errors.notFound('that content block');
  ok(res, rows[0]);
}));
v1.get('/admin/media', requireAuth, requireRole('ADMIN'), requirePermission('content', 'view'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`select * from media_library order by created_at desc`);
  ok(res, rows);
}));
v1.get('/admin/me', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  ok(res, await getAdminProfile(req.auth!));
}));
v1.patch('/admin/me', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  ok(res, await updateAdminProfile(req.auth!, req.body));
}));
v1.post('/admin/me/avatar', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  ok(res, await uploadAdminAvatar(req.auth!, req.body));
}));
v1.delete('/admin/me/avatar', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  ok(res, await removeAdminAvatar(req.auth!));
}));
v1.post('/admin/me/password', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  ok(res, await changeAdminPassword(req.auth!, req.body));
}));
v1.get('/admin/users', requireAuth, requireRole('ADMIN'), requirePermission('settings', 'view'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`select id, email, name, title, phone, avatar_url, role, status, last_active_at, created_at from admin_users where deleted_at is null`);
  ok(res, rows);
}));
v1.get('/admin/payments', requireAuth, requireRole('ADMIN'), requirePermission('payments', 'view'), asyncHandler(async (_req, res) => {
  ok(res, { rows: [], total: 0, provider: 'none', note: 'PAYMENT_PROVIDER_NOT_CONFIGURED' });
}));
v1.post('/admin/payments/:id/refund', requireAuth, requireRole('ADMIN'), requirePermission('payments', 'full'), asyncHandler(async () => {
  throw errors.paymentNotConfigured();
}));
v1.get('/admin/partner-updates', requireAuth, requireRole('ADMIN'), requirePermission('partners', 'view'), asyncHandler(async (_req, res) => {
  ok(res, await listPendingPartnerUpdates());
}));
v1.post('/admin/partner-updates/:id/review', requireAuth, requireRole('ADMIN'), requirePermission('partners', 'edit'), asyncHandler(async (req, res) => {
  ok(res, await reviewPartnerUpdate(req.params.id, Boolean(req.body.approve), req.auth!));
}));
v1.post('/uploads/proof', requireAuth, requireRole('ADMIN'), requirePermission('orders', 'edit'), asyncHandler(async (req, res) => {
  ok(res, await uploadProof(req.auth!, req.body), 201);
}));

v1.get('/admin/search', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const q = `%${String(req.query.q ?? '').trim()}%`;
  if (String(req.query.q ?? '').trim().length < 2) return ok(res, []);
  const guests = await query(`select id, first_name || ' ' || last_name as title, email as subtitle from guests where email ilike $1 or first_name ilike $1 limit 4`, [q]);
  const hosts = await query(`select id, first_name || ' ' || last_name as title, email as subtitle from hosts where email ilike $1 or first_name ilike $1 limit 4`, [q]);
  const partners = await query(`select id, name as title, email as subtitle from partners where name ilike $1 or email ilike $1 limit 4`, [q]);
  ok(res, [
    ...guests.rows.map((r) => ({ kind: 'Guest', ...r, to: `/admin/guests/${r.id}` })),
    ...hosts.rows.map((r) => ({ kind: 'Host', ...r, to: `/admin/hosts/${r.id}` })),
    ...partners.rows.map((r) => ({ kind: 'Partner', ...r, to: `/admin/partners/${r.id}` })),
  ]);
}));
