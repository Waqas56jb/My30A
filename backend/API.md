# My30A Host API

Base path: `/api/v1`  
Auth: `Authorization: Bearer <jwt>`  
Roles: `GUEST` `HOST` `PARTNER` `ADMIN`

Success: `{ "success": true, "data": ..., "requestId": "..." }`  
Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`

## Health

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | public | Backend, database, OpenAI, email, storage, Socket.IO. No secrets. |

## Auth

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/auth/login` | public | `{ email, password, role, remember? }` |
| POST | `/auth/register` | public | `{ role: GUEST\|HOST, email, password, firstName, lastName, phone? }` |
| POST | `/auth/forgot-password` | public | `{ email, role }` — does not reveal whether the email exists |
| POST | `/auth/reset-password` | public | `{ role, token, password }` |
| GET | `/auth/me` | any | Hydrated account (stay rebound from DB) |
| POST | `/auth/logout` | any | Audit only; client drops the token |

Errors: `AUTH_REQUIRED` `AUTH_INVALID` `VALIDATION_ERROR`

## Explore (public)

| Method | Path | Notes |
|---|---|---|
| GET | `/restaurants` | `?search` `?category`. Each row includes `bookingPlatform`, `bookingUrl`, `phone`, `lastVerifiedDate`. |
| GET | `/restaurants/:id` | |
| GET | `/restaurants/:id/reserve` | Per-restaurant handoff: `{ platform, action: open_url\|call, url, phone }`. Never a global OpenTable search. |
| GET | `/partners` | Approved + published only |
| GET | `/partners/:id` | |
| GET | `/beaches` | |
| GET | `/beaches/:id` | |
| GET | `/events` | |
| GET | `/events/:id` | |
| GET | `/map/entities` | beaches, restaurants, partners, events |
| GET | `/explore/weather` | Open-Meteo, cached, `stale` if fallback |
| GET | `/weather` | alias |
| GET | `/local-guide/categories` | |
| GET | `/pricing` | Grocery packages, airports, vehicles, cancellation |
| GET | `/partners/tracking-policy` | What is and is not tracked |

## Guest

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/guests/me` | GUEST | Profile + stay + preferences |
| PATCH | `/guests/me` | GUEST | `{ firstName, lastName, phone }` |
| PUT | `/guests/me/preferences` | GUEST | |
| POST | `/guests/me/saved` | GUEST | Toggle saved place |
| GET | `/stays/current` | GUEST | `null` if no stay |
| GET | `/properties/authorized` | GUEST | Private WiFi/access. `PROPERTY_ACCESS_DENIED` without stay |
| POST | `/access-codes/redeem` | GUEST | `{ code }` |
| POST | `/stays/rating` | GUEST | |

## Grocery (My30A operated)

Statuses: `pending → confirmed → payment_required → shopping → on_the_way → delivered` plus `cancelled`.  
`paid` is rejected with `PAYMENT_PROVIDER_NOT_CONFIGURED`.

| Method | Path | Role |
|---|---|---|
| GET | `/grocery` | GUEST own / ADMIN all |
| GET | `/grocery/:id` | GUEST own (404 if other guest) / ADMIN |
| POST | `/grocery` | GUEST (requires stay), ADMIN |
| POST | `/grocery/:id/status` | ADMIN `orders:edit` |
| POST | `/grocery/:id/cancel` | GUEST, ADMIN |
| POST | `/grocery/:id/pay` | always `PAYMENT_PROVIDER_NOT_CONFIGURED` |
| POST | `/grocery/:id/tip` | GUEST — stores tip, then same payment error |
| POST | `/grocery/:id/rating` | GUEST |

HOST and PARTNER receive `FORBIDDEN`.

## Airport transfers (My30A operated)

Statuses: `pending → confirmed → driver_assigned → in_progress → completed` plus `cancelled` `no_show`.  
`payment_authorized` is rejected with `PAYMENT_PROVIDER_NOT_CONFIGURED`.

| Method | Path | Role |
|---|---|---|
| GET | `/transfers` | GUEST own / ADMIN all |
| GET | `/transfers/:id` | |
| POST | `/transfers` | GUEST (requires stay), ADMIN |
| GET | `/transfers/:id/cancellation-preview` | 48h / 24–48h / same-day fees, no charge |
| POST | `/transfers/:id/status` | ADMIN `orders:edit` |
| POST | `/transfers/:id/cancel` | GUEST, ADMIN |
| POST | `/transfers/:id/authorize` | `PAYMENT_PROVIDER_NOT_CONFIGURED` |
| POST | `/transfers/quote` | public quote from DB prices |
| GET | `/orders` | grocery + transfers |

## Vitoria

| Method | Path | Role |
|---|---|---|
| POST | `/vitoria/chat` | GUEST `{ text, conversationId? }` |
| GET | `/conversations` | GUEST own / HOST property-scoped metadata / ADMIN |
| GET | `/conversations/:id` | Isolated by role |

Tools (server-side, authorized):  
`get_guest_profile` `get_current_stay` `get_property_information` `get_property_rules` `get_property_access_information` `get_local_categories` `get_local_partners` `get_partner_details` `get_restaurants` `get_events` `get_weather` `get_orders` `get_order_status` `get_service_pricing` `get_cancellation_policy` `create_grocery_request` `create_airport_transfer_request` `get_guest_notifications` `get_guest_activity` `escalate_to_human`

If `OPENAI_MODEL` is not on the key, chat returns `VITORIA_MODEL_UNAVAILABLE`. No fabricated replies.

## Notifications

| Method | Path | Auth |
|---|---|---|
| GET | `/notifications` | recipient scoped |
| POST | `/notifications/:id/read` | owner |
| POST | `/notifications/read-all` | owner |
| POST | `/admin/notifications` | ADMIN |

Realtime: `notification:new` on the recipient room.

## Host

| Method | Path | Role |
|---|---|---|
| GET/PATCH | `/hosts/me` | HOST |
| GET/POST | `/hosts/me/properties` | HOST |
| GET/PATCH | `/hosts/me/properties/:id` | own property only |
| POST | `/hosts/me/properties/:id/status` | |
| POST | `/hosts/me/properties/:id/access` | new guest code |
| GET | `/hosts/me/guests` | own properties |
| GET | `/hosts/me/analytics` | property-scoped counts |

## Partner (referral only)

| Method | Path | Role |
|---|---|---|
| POST | `/partners/apply` | public |
| GET/PATCH | `/partners/me` | PARTNER — edits go to `pending_partner_updates` |
| GET | `/partners/me/analytics` | own clicks/views only |
| POST | `/partners/:id/events` | `{ eventType }` view / website / phone / directions |

Never returned: bookings, conversions, revenue, guest PII.

## Admin

Every route checks the permission matrix (`full` `edit` `view` `none`) for areas:  
`users` `hosts` `partners` `properties` `orders` `payments` `content` `analytics` `settings`.

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/overview` | analytics:view |
| GET | `/admin/guests` `/admin/guests/:id` | users:view |
| GET | `/admin/hosts` `/admin/hosts/:id` | hosts:view |
| POST | `/admin/hosts/:id/status` | hosts:edit |
| GET | `/admin/partners` `/admin/partners/:id` | partners:view |
| POST | `/admin/partners/:id/status` | partners:edit |
| GET | `/admin/partner-updates` | partners:view |
| POST | `/admin/partner-updates/:id/review` | partners:edit `{ approve }` |
| GET | `/admin/properties` `/admin/properties/:id` | properties:view |
| PATCH | `/admin/properties/:id` | properties:edit |
| GET/POST/PATCH/DELETE | `/admin/categories` | content |
| GET | `/admin/restaurants` | content:view — includes stale flag (90 days) |
| POST/PATCH | `/admin/restaurants` | content:edit — `bookingPlatform`, `bookingUrl`, `phone`, `lastVerifiedDate` |
| POST | `/admin/restaurants/:id/verify` | content:edit — sets `last_verified_date` to today |
| GET | `/admin/restaurants/freshness` | content:view — rows not verified in 90 days |
| POST/PATCH | `/admin/events` | content:edit |
| GET/PATCH | `/admin/content` | content |
| GET | `/admin/media` | content:view |
| GET | `/admin/knowledge` | content:view |
| POST | `/admin/knowledge` | content:edit |
| GET | `/admin/users` | settings:view |
| GET | `/admin/audit` | settings:view |
| GET | `/admin/settings` | settings:view |
| PUT | `/admin/settings/:key` | settings:full |
| GET | `/admin/payments` | empty + not configured |
| POST | `/admin/payments/:id/refund` | `PAYMENT_PROVIDER_NOT_CONFIGURED` |
| GET | `/admin/search?q=` | ADMIN |
| GET | `/ratings` | ADMIN |
| POST | `/uploads/proof` | orders:edit — `{ entityId, mimeType, base64 }` |

## Analytics

| Method | Path | Auth |
|---|---|---|
| POST | `/analytics/events` | optional | `{ event, properties }` |

## Error codes

`AUTH_REQUIRED` `AUTH_INVALID` `FORBIDDEN` `NOT_FOUND` `VALIDATION_ERROR` `PROPERTY_ACCESS_DENIED` `INVALID_STATUS_TRANSITION` `VITORIA_MODEL_UNAVAILABLE` `PAYMENT_PROVIDER_NOT_CONFIGURED` `PARTNER_BOOKING_NOT_SUPPORTED` `STORAGE_NOT_CONFIGURED` `CONFLICT` `RATE_LIMITED` `SERVICE_UNAVAILABLE` `INTERNAL_ERROR`
