import { api } from './api'
import { track, ANALYTICS_EVENTS, trackPartnerClick, trackPartnerView } from './analytics'
import { connectNotifications } from './realtime'
import { showBrowserNotification, restorePushIfGranted } from './pushClient'

export const setFailureMode = () => {}
export const getFailureMode = () => false
export const failOnce = () => {}
export const setLatency = () => {}
export function resetMockData() {}

function shapeNotification(n) {
  const createdAt = n.createdAt ?? n.created_at ?? n.at ?? null
  return {
    ...n,
    read: Boolean(n.read),
    createdAt,
    at: n.at ?? createdAt,
    type: String(n.type ?? 'info').toLowerCase(),
    title: n.title ?? 'Notification',
    message: n.message ?? '',
    link: n.link ?? null,
  }
}

export function subscribeToNotifications(onNotification) {
  restorePushIfGranted()
  const seen = new Set()
  let primed = false

  const deliver = (raw) => {
    const notification = shapeNotification({ ...raw, read: raw.read ?? false })
    if (notification.id) {
      if (seen.has(notification.id)) return
      seen.add(notification.id)
    }
    onNotification?.(notification)
    showBrowserNotification(notification)
  }

  const stopSocket = connectNotifications(deliver)

  const poll = async () => {
    try {
      const items = await getNotifications()
      if (!primed) {
        items.forEach((item) => {
          if (item.id) seen.add(item.id)
        })
        primed = true
        return
      }
      items
        .filter((item) => item.id && !seen.has(item.id))
        .reverse()
        .forEach(deliver)
    } catch {
      /* keep the shell up even if the inbox is briefly unreachable */
    }
  }
  poll()
  const timer = window.setInterval(poll, 12000)

  return () => {
    stopSocket()
    window.clearInterval(timer)
  }
}
export function appendMessage() {}
export const listGuests = async () => []
export const listProperties = async () => []

function shapeGuest(row) {
  if (!row) return null
  const rawStay = row.stay
  const stay =
    rawStay && (rawStay.id || rawStay.check_in_date || rawStay.checkInDate)
      ? {
          ...rawStay,
          checkInDate: rawStay.check_in_date ?? rawStay.checkInDate,
          checkOutDate: rawStay.check_out_date ?? rawStay.checkOutDate,
          propertyId: rawStay.property_id ?? rawStay.propertyId,
          propertyName: rawStay.property_name ?? rawStay.propertyName,
          confirmationCode: rawStay.confirmation_code ?? rawStay.confirmationCode,
          accessSlug: rawStay.access_slug ?? rawStay.accessSlug,
        }
      : null
  return {
    id: row.id,
    firstName: row.first_name ?? row.firstName,
    lastName: row.last_name ?? row.lastName,
    email: row.email,
    phone: row.phone,
    avatar: row.avatar_url ?? row.avatar,
    language: row.language,
    stay,
    preferences: row.preferences ?? {},
    savedPlaceIds: row.savedPlaceIds ?? [],
    propertyId: stay?.propertyId ?? null,
  }
}

export async function getGuest() {
  return shapeGuest(await api('/guests/me'))
}

export async function getProperty() {
  return api('/properties/authorized')
}

export async function resolveGuestLink() {
  const guest = await getGuest()
  const property = guest.stay ? await api('/properties/authorized').catch(() => null) : null
  return { guest, property }
}

export async function redeemAccess(code) {
  return api('/access-codes/redeem', { method: 'POST', body: { code } })
}

export async function getRestaurants(opts = {}) {
  const q = new URLSearchParams()
  if (opts.search) q.set('search', opts.search)
  if (opts.category) q.set('category', opts.category)
  return api(`/restaurants?${q}`)
}

export async function getRestaurant(id) {
  return api(`/restaurants/${id}`)
}

export async function getPartners(opts = {}) {
  const q = new URLSearchParams()
  if (opts.search) q.set('search', opts.search)
  if (opts.category) q.set('category', opts.category)
  const rows = await api(`/partners?${q}`)
  rows.forEach((p) => trackPartnerView(p.id))
  return rows
}

export async function getPartner(id) {
  const partner = await api(`/partners/${id}`)
  trackPartnerView(partner.id)
  return partner
}

export async function getBeaches(opts = {}) {
  const q = new URLSearchParams()
  if (opts.search) q.set('search', opts.search)
  if (opts.useClass) q.set('useClass', opts.useClass)
  return api(`/beaches?${q}`)
}

export async function getBeachAccess(opts = {}) {
  const q = new URLSearchParams()
  if (opts.search) q.set('search', opts.search)
  if (opts.useClass) q.set('useClass', opts.useClass)
  if (opts.neighborhood) q.set('neighborhood', opts.neighborhood)
  return api(`/public/beach-access?${q}`)
}

export async function getBeachConditions() {
  return api('/public/beach-conditions')
}

export async function reserveRestaurant(id, opts = {}) {
  const q = new URLSearchParams()
  if (opts.covers) q.set('covers', String(opts.covers))
  if (opts.dateTime) q.set('dateTime', opts.dateTime)
  return api(`/restaurants/${id}/reserve?${q}`)
}

export async function openTableSearch(opts = {}) {
  const q = new URLSearchParams()
  if (opts.query) q.set('query', opts.query)
  if (opts.covers) q.set('covers', String(opts.covers))
  if (opts.dateTime) q.set('dateTime', opts.dateTime)
  return api(`/restaurants/opentable?${q}`)
}

export async function getBeach(id) {
  return api(`/beaches/${id}`)
}

export async function getEvents(opts = {}) {
  const q = new URLSearchParams()
  if (opts.search) q.set('search', opts.search)
  if (opts.category) q.set('category', opts.category)
  return api(`/events?${q}`)
}

export async function getEvent(id) {
  return api(`/events/${id}`)
}

export async function getMapEntities() {
  return api('/map/entities')
}

export async function getRecommendations() {
  return api('/partners')
}

export async function getCategories() {
  return api('/local-guide/categories')
}

export async function getPricing() {
  return api('/pricing')
}

export async function getAirports() {
  const pricing = await getPricing()
  return (pricing.airports ?? []).map((a) => ({
    code: a.code,
    name: a.name,
    city: a.city,
    driveTime: a.drive_time,
    basePrice: a.base_fare_cents != null ? Number(a.base_fare_cents) / 100 : 0,
  }))
}

export async function getVehicleClasses() {
  const pricing = await getPricing()
  return (pricing.vehicles ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    capacity: v.capacity,
    multiplier: Number(v.multiplier ?? 1),
  }))
}

export async function quoteTransfer(payload) {
  return api('/transfers/quote', { method: 'POST', body: payload })
}

const WMO = {
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Drizzle',
  61: 'Rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Snow',
  80: 'Showers',
  95: 'Thunderstorms',
}

function cToF(c) {
  if (c == null || Number.isNaN(Number(c))) return null
  return Math.round((Number(c) * 9) / 5 + 32)
}

function clockFromIso(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export const EMPTY_CONDITIONS = {
  weather: { tempF: '—', condition: 'Loading…', high: '—', low: '—' },
  water: { tempF: '—', surf: '' },
  beachFlag: { label: 'Live conditions', meaning: 'Weather from the 30A station.', color: '#94a3b8' },
  sunset: '—',
  sunrise: '—',
  tide: '',
}

export function shapeWeather(raw = {}) {
  const current = raw.current ?? {}
  const daily = raw.daily ?? {}
  const code = Number(current.weather_code ?? 0)
  const wind = Number(current.wind_speed_10m ?? 0)
  const highC = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[0] : daily.temperature_2m_max
  const sunrise = Array.isArray(daily.sunrise) ? daily.sunrise[0] : daily.sunrise
  const sunset = Array.isArray(daily.sunset) ? daily.sunset[0] : daily.sunset
  return {
    weather: {
      tempF: cToF(current.temperature_2m) ?? '—',
      condition: WMO[code] ?? 'Fair',
      high: cToF(highC) ?? '—',
      low: '—',
    },
    water: {
      tempF: '—',
      surf: wind >= 20 ? 'Choppy' : wind >= 10 ? 'Light chop' : 'Calm',
    },
    beachFlag: {
      label: wind >= 25 ? 'Red flag likely' : wind >= 15 ? 'Yellow flag likely' : 'Green flag likely',
      meaning: 'Flag status is an estimate from wind speed. Confirm locally before swimming.',
      color: wind >= 25 ? '#c2410c' : wind >= 15 ? '#ca8a04' : '#16a34a',
    },
    sunset: clockFromIso(sunset),
    sunrise: clockFromIso(sunrise),
    tide: '',
  }
}

export async function getWeather() {
  const raw = await api('/weather')
  return shapeWeather(raw)
}

export async function getGroceryFees(itemCount = 0) {
  const pricing = await getPricing()
  const packages = (pricing.packages ?? []).filter((p) => p.kind === 'grocery_package')
  const delivery = (pricing.packages ?? []).find((p) => p.kind === 'grocery_delivery' || p.code === 'delivery')
  const match =
    packages.find((p) => itemCount <= Number(p.meta?.maxItems ?? 9999)) ?? packages[0]
  return {
    serviceFee: match?.amount_cents != null ? Number(match.amount_cents) / 100 : 0,
    deliveryFee: delivery?.amount_cents != null ? Number(delivery.amount_cents) / 100 : 0,
    packageLabel: match?.label ?? 'Service',
  }
}

export async function getGroceryOrders() {
  return api('/grocery')
}

export async function getGroceryOrder(id) {
  return api(`/grocery/${id}`)
}

export async function createGroceryRequest(payload) {
  track(ANALYTICS_EVENTS.GROCERY_REQUEST_SUBMITTED)
  return api('/grocery', { method: 'POST', body: payload })
}

export async function getTransfers() {
  return api('/transfers')
}

export async function getTransfer(id) {
  return api(`/transfers/${id}`)
}

export async function createTransferRequest(payload) {
  track(ANALYTICS_EVENTS.TRANSFER_REQUEST_SUBMITTED)
  return api('/transfers', { method: 'POST', body: payload })
}

export async function updateMockOrderStatus() {
  throw new Error('Order status is updated by the My30A team.')
}

export async function cancelOrder(kind, id) {
  const path = kind === 'transfer' ? `/transfers/${id}/cancel` : `/grocery/${id}/cancel`
  return api(path, { method: 'POST', body: {} })
}

export async function authorizePayment(_kind, id) {
  return api(`/transfers/${id}/authorize`, { method: 'POST', body: {} })
}

export async function payNow(_kind, id) {
  return api(`/grocery/${id}/pay`, { method: 'POST', body: {} })
}

export async function addTip(_kind, id, amount) {
  return api(`/grocery/${id}/tip`, { method: 'POST', body: { amount } })
}

export async function submitRating(_kind, id, { stars, feedback = '' }) {
  return api(`/grocery/${id}/rating`, { method: 'POST', body: { stars, feedback } })
}

export async function submitStayRating({ stars, feedback = '' }) {
  return api('/stays/rating', { method: 'POST', body: { stars, feedback } })
}

export async function getOrders() {
  const data = await api('/orders')
  const groceries = (data?.groceries ?? []).map((o) => ({
    ...o,
    kind: 'grocery',
    title: 'Grocery Delivery',
    date: o.deliveryDate ?? o.delivery_date,
    amount: o.payment?.amount ?? o.estimatedTotal,
    link: `/groceries/${o.id}`,
  }))
  const transfers = (data?.transfers ?? []).map((o) => ({
    ...o,
    kind: 'transfer',
    title: 'Airport Transfer',
    date: o.date ?? o.pickup_date,
    amount: o.quotedPrice ?? o.payment?.amount,
    airport: o.airport,
    link: `/transfers/${o.id}`,
  }))
  return [...groceries, ...transfers].sort((a, b) =>
    String(b.createdAt ?? b.date ?? '').localeCompare(String(a.createdAt ?? a.date ?? '')),
  )
}

export async function getSavedPlaces(ids = []) {
  const unique = [...new Set(ids.filter(Boolean))]
  const rows = await Promise.all(unique.map((id) => resolveEntity(id)))
  return rows.filter(Boolean)
}

export async function getNotifications() {
  const data = await api('/notifications')
  return (data.items ?? data).map(shapeNotification)
}

export async function markNotificationRead(id) {
  return api(`/notifications/${id}/read`, { method: 'POST', body: {} })
}

export async function markAllNotificationsRead() {
  return api('/notifications/read-all', { method: 'POST', body: {} })
}

export async function getMessages() {
  const rows = await api('/conversations')
  if (!Array.isArray(rows)) return []
  return rows
    .filter((row) => row && (row.role === 'user' || row.role === 'assistant') && row.text)
    .map((row) => ({
      id: row.id,
      role: row.role,
      text: row.text,
      at: row.at ?? row.created_at,
      cards: row.cards ?? row.metadata?.cards ?? [],
      actions: row.actions ?? row.metadata?.actions ?? [],
      conversationId: row.conversationId,
    }))
}

export async function clearMessages() {
  try {
    await api('/conversations/clear', { method: 'POST', body: {} })
  } catch {
    /* keep the local clear even if the server is unreachable */
  }
}

export async function updatePreferences(next) {
  return api('/guests/me/preferences', { method: 'PUT', body: next })
}

export async function toggleSavedPlace(id) {
  return api('/guests/me/saved', { method: 'POST', body: { id } })
}

export async function resolveEntity(id) {
  if (!id) return null
  for (const fn of [getRestaurant, getPartner, getBeach, getEvent]) {
    try {
      return await fn(id)
    } catch {
      /* try next catalogue */
    }
  }
  return null
}

export function trackOutbound(partnerId, eventType) {
  if (!partnerId) return
  trackPartnerClick(partnerId, eventType)
  void api(`/partners/${partnerId}/events`, { method: 'POST', body: { eventType } }).catch(() => {})
}

export function estimateGroceryTotal(order) {
  return Number(order.estimatedTotal ?? 0) + Number(order.serviceFee ?? 0)
}

export { trackPartnerClick, trackPartnerView }
