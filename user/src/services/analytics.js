/**
 * Mock analytics. Events are logged to the console and kept in an in-memory
 * ring buffer that Settings can display, so engagement tracking is verifiable
 * before a real provider (Segment/PostHog/backend) is wired in.
 *
 * IMPORTANT product rule: we only track what we can actually observe —
 * views, website clicks, phone clicks, CTA clicks. We never claim to know
 * whether a transaction completed on the partner's own site.
 */

export const ANALYTICS_EVENTS = {
  GUEST_OPENED_APP: 'guest_opened_app',
  GUEST_LINK_RESOLVED: 'guest_link_resolved',
  VITORIA_MESSAGE_SENT: 'vitoria_message_sent',
  VITORIA_SUGGESTION_CLICKED: 'vitoria_suggestion_clicked',
  VITORIA_ACTION_CLICKED: 'vitoria_action_clicked',
  PARTNER_VIEWED: 'partner_viewed',
  PARTNER_WEBSITE_CLICKED: 'partner_website_clicked',
  PARTNER_PHONE_CLICKED: 'partner_phone_clicked',
  PARTNER_CTA_CLICKED: 'partner_cta_clicked',
  RESTAURANT_VIEWED: 'restaurant_viewed',
  BEACH_VIEWED: 'beach_viewed',
  EVENT_VIEWED: 'event_viewed',
  EVENT_LINK_CLICKED: 'event_external_clicked',
  GROCERY_REQUEST_STARTED: 'grocery_request_started',
  GROCERY_REQUEST_SUBMITTED: 'grocery_request_submitted',
  TRANSFER_REQUEST_STARTED: 'transfer_request_started',
  TRANSFER_REQUEST_SUBMITTED: 'transfer_request_submitted',
  SERVICE_VIEWED: 'service_viewed',
  PAYMENT_AUTHORIZED: 'payment_authorization_mocked',
  PAYMENT_COMPLETED: 'payment_completed_mocked',
  TIP_SELECTED: 'tip_selected',
  RATING_SUBMITTED: 'rating_submitted',
  PLACE_SAVED: 'place_saved',
  PLACE_UNSAVED: 'place_unsaved',
  SEARCH_PERFORMED: 'search_performed',
  MAP_OPENED: 'map_opened',
  NOTIFICATION_OPENED: 'notification_opened',
}

const MAX_EVENTS = 200
const buffer = []
const subscribers = new Set()

let context = {}

/** Attach ambient properties (guest, property) to every subsequent event. */
export function setAnalyticsContext(next) {
  context = { ...context, ...next }
}

export function track(event, properties = {}) {
  const record = {
    id: `${Date.now()}-${buffer.length}`,
    event,
    properties: { ...context, ...properties },
    at: new Date().toISOString(),
  }
  buffer.unshift(record)
  if (buffer.length > MAX_EVENTS) buffer.length = MAX_EVENTS

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`%c[analytics] ${event}`, 'color:#2b7d7a;font-weight:600', record.properties)
  }
  subscribers.forEach((fn) => fn(record))
  const apiBase = String(
    import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'https://my30a-server.vercel.app'),
  ).replace(/\/+$/, '')
  if (apiBase) {
    void fetch(`${apiBase}/api/v1/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: event, properties }),
    }).catch(() => {})
  }
  return record
}

export const getAnalyticsLog = () => [...buffer]

export function subscribeToAnalytics(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

export function clearAnalyticsLog() {
  buffer.length = 0
  subscribers.forEach((fn) => fn(null))
}

/* ---- Convenience wrappers used by partner surfaces ---- */

export const trackPartnerView = (partner) =>
  track(
    partner?.type === 'restaurant' ? ANALYTICS_EVENTS.RESTAURANT_VIEWED : ANALYTICS_EVENTS.PARTNER_VIEWED,
    { partnerId: partner?.id, partnerName: partner?.name, category: partner?.category },
  )

export const trackPartnerClick = (partner, channel) =>
  track(
    channel === 'phone'
      ? ANALYTICS_EVENTS.PARTNER_PHONE_CLICKED
      : channel === 'website'
        ? ANALYTICS_EVENTS.PARTNER_WEBSITE_CLICKED
        : ANALYTICS_EVENTS.PARTNER_CTA_CLICKED,
    {
      partnerId: partner?.id,
      partnerName: partner?.name,
      category: partner?.category,
      channel,
      outbound: channel === 'phone' || channel === 'website',
    },
  )
