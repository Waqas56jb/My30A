/**
 * Mock API layer.
 *
 * Every screen talks to this module and never to the mock data directly, so
 * swapping in the real backend later is a matter of reimplementing these
 * functions against HTTP — no component changes required. All functions are
 * async, return plain JSON-serialisable data, and can fail on demand so the
 * error states are real code paths rather than decoration.
 */

import {
  mockGuests,
  getGuestBySlug,
  mockProperties,
  getPropertyById,
  getPropertyBySlug,
  mockRestaurants,
  mockPartners,
  mockBeaches,
  mockEvents,
  mockGroceryOrders,
  mockPartnerBookings,
  mockTransfers,
  mockNotifications,
  mockMessages,
  mockRecommendations,
  AIRPORTS,
  VEHICLE_CLASSES,
} from '../data'
import { readStore, writeStore, STORAGE_KEYS } from '../utils/storage'
import { makeId } from '../utils/format'
import { track, ANALYTICS_EVENTS, trackPartnerClick, trackPartnerView } from './analytics'

/* -------------------------------------------------------------------------- */
/* Transport simulation                                                       */
/* -------------------------------------------------------------------------- */

let latency = [220, 520]
let failNext = false
let failureMode = false

export const setFailureMode = (on) => {
  failureMode = !!on
}
export const getFailureMode = () => failureMode
export const failOnce = () => {
  failNext = true
}
export const setLatency = (min, max) => {
  latency = [min, max]
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function respond(factory, { label = 'request' } = {}) {
  const [min, max] = latency
  await wait(min + Math.random() * (max - min))
  if (failNext || failureMode) {
    failNext = false
    const error = new Error(
      `We could not reach the concierge service while loading ${label}. Please try again.`,
    )
    error.code = 'MOCK_NETWORK_ERROR'
    throw error
  }
  return typeof factory === 'function' ? factory() : factory
}

const clone = (value) => JSON.parse(JSON.stringify(value))

/* -------------------------------------------------------------------------- */
/* Local persistence — keeps demo state across refreshes                       */
/* -------------------------------------------------------------------------- */

const db = {
  groceryOrders: readStore(STORAGE_KEYS.groceryOrders) ?? clone(mockGroceryOrders),
  transfers: readStore(STORAGE_KEYS.transfers) ?? clone(mockTransfers),
  notifications: readStore(STORAGE_KEYS.notifications) ?? clone(mockNotifications),
  messages: readStore(STORAGE_KEYS.messages) ?? clone(mockMessages),
  saved: readStore(STORAGE_KEYS.saved) ?? null,
  preferences: readStore(STORAGE_KEYS.preferences) ?? null,
}

const persist = {
  groceryOrders: () => writeStore(STORAGE_KEYS.groceryOrders, db.groceryOrders),
  transfers: () => writeStore(STORAGE_KEYS.transfers, db.transfers),
  notifications: () => writeStore(STORAGE_KEYS.notifications, db.notifications),
  messages: () => writeStore(STORAGE_KEYS.messages, db.messages),
  saved: () => writeStore(STORAGE_KEYS.saved, db.saved),
  preferences: () => writeStore(STORAGE_KEYS.preferences, db.preferences),
}

/** Wipe locally created records and return to the shipped demo data. */
export function resetMockData() {
  db.groceryOrders = clone(mockGroceryOrders)
  db.transfers = clone(mockTransfers)
  db.notifications = clone(mockNotifications)
  db.messages = clone(mockMessages)
  db.saved = null
  db.preferences = null
  Object.values(persist).forEach((fn) => fn())
}

/* -------------------------------------------------------------------------- */
/* Guest + property                                                            */
/* -------------------------------------------------------------------------- */

export async function getGuest(slug) {
  return respond(() => {
    const guest = getGuestBySlug(slug) ?? mockGuests[0]
    if (!guest) {
      const err = new Error('We could not find a stay for this link.')
      err.code = 'GUEST_NOT_FOUND'
      throw err
    }
    const withOverrides = {
      ...clone(guest),
      preferences: db.preferences ? { ...guest.preferences, ...db.preferences } : clone(guest.preferences),
      savedPlaceIds: db.saved ?? clone(guest.savedPlaceIds),
    }
    return withOverrides
  }, { label: 'your stay' })
}

export async function getProperty(idOrSlug) {
  return respond(() => {
    const property = getPropertyById(idOrSlug) ?? getPropertyBySlug(idOrSlug)
    if (!property) {
      const err = new Error('That property is no longer available.')
      err.code = 'PROPERTY_NOT_FOUND'
      throw err
    }
    return clone(property)
  }, { label: 'your property' })
}

/** Resolve a guest link in one call — what /guest/:guestId uses. */
export async function resolveGuestLink(slug) {
  const guest = await getGuest(slug)
  const property = getPropertyById(guest.propertyId)
  track(ANALYTICS_EVENTS.GUEST_LINK_RESOLVED, { slug, guestId: guest.id })
  return { guest, property: clone(property) }
}

/* -------------------------------------------------------------------------- */
/* Catalogue                                                                   */
/* -------------------------------------------------------------------------- */

const matches = (item, q) => {
  if (!q) return true
  const needle = q.trim().toLowerCase()
  return [item.name, item.title, item.category, item.cuisine, item.location, item.shortDescription]
    .concat(item.tags ?? [])
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(needle))
}

const sortBy = (items, sort) => {
  const list = [...items]
  switch (sort) {
    case 'distance':
      return list.sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99))
    case 'rating':
      return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    case 'price':
      return list.sort((a, b) => (a.startingPrice ?? a.priceLevel ?? 0) - (b.startingPrice ?? b.priceLevel ?? 0))
    case 'name':
      return list.sort((a, b) => String(a.name).localeCompare(String(b.name)))
    default:
      return list.sort((a, b) => Number(b.featured ?? 0) - Number(a.featured ?? 0))
  }
}

export async function getRestaurants({ search = '', category = null, sort = 'featured' } = {}) {
  return respond(() => {
    let list = clone(mockRestaurants)
    if (category && category !== 'All') list = list.filter((r) => r.cuisine?.includes(category) || r.tags?.includes(category))
    list = list.filter((r) => matches(r, search))
    return sortBy(list, sort)
  }, { label: 'restaurants' })
}

export async function getRestaurant(id) {
  return respond(() => {
    const found = mockRestaurants.find((r) => r.id === id)
    if (!found) {
      const err = new Error('We could not find that restaurant.')
      err.code = 'NOT_FOUND'
      throw err
    }
    return clone(found)
  }, { label: 'this restaurant' })
}

export async function getPartners({ search = '', category = null, sort = 'featured' } = {}) {
  return respond(() => {
    let list = clone(mockPartners)
    if (category && category !== 'All') list = list.filter((p) => p.category === category)
    list = list.filter((p) => matches(p, search))
    return sortBy(list, sort)
  }, { label: 'local partners' })
}

export async function getPartner(id) {
  return respond(() => {
    const found = mockPartners.find((p) => p.id === id) ?? mockRestaurants.find((r) => r.id === id)
    if (!found) {
      const err = new Error('We could not find that partner.')
      err.code = 'NOT_FOUND'
      throw err
    }
    return clone(found)
  }, { label: 'this partner' })
}

export async function getBeaches({ search = '' } = {}) {
  return respond(() => clone(mockBeaches).filter((b) => matches(b, search)), { label: 'beaches' })
}

export async function getBeach(id) {
  return respond(() => {
    const found = mockBeaches.find((b) => b.id === id)
    if (!found) {
      const err = new Error('We could not find that beach.')
      err.code = 'NOT_FOUND'
      throw err
    }
    return clone(found)
  }, { label: 'this beach' })
}

export async function getEvents({ search = '', category = null } = {}) {
  return respond(() => {
    let list = clone(mockEvents)
    if (category && category !== 'All') list = list.filter((e) => e.category === category)
    return list.filter((e) => matches(e, search)).sort((a, b) => a.date.localeCompare(b.date))
  }, { label: 'events' })
}

export async function getEvent(id) {
  return respond(() => {
    const found = mockEvents.find((e) => e.id === id)
    if (!found) {
      const err = new Error('We could not find that event.')
      err.code = 'NOT_FOUND'
      throw err
    }
    return clone(found)
  }, { label: 'this event' })
}

/** Everything that can appear on the map, in one shape. */
export async function getMapEntities() {
  return respond(() => [
    ...clone(mockRestaurants).map((r) => ({ ...r, kind: 'restaurant' })),
    ...clone(mockBeaches).map((b) => ({ ...b, kind: 'beach' })),
    ...clone(mockPartners).map((p) => ({ ...p, kind: 'partner' })),
    ...clone(mockEvents).map((e) => ({ ...e, kind: 'event', name: e.title })),
  ], { label: 'the map' })
}

export async function getRecommendations() {
  return respond(() => clone(mockRecommendations), { label: 'your recommendations' })
}

export const getAirports = async () => respond(() => clone(AIRPORTS), { label: 'airports' })
export const getVehicleClasses = async () => respond(() => clone(VEHICLE_CLASSES), { label: 'vehicles' })

/* -------------------------------------------------------------------------- */
/* Orders — grocery                                                            */
/* -------------------------------------------------------------------------- */

export async function getGroceryOrders() {
  return respond(() => clone(db.groceryOrders), { label: 'your grocery requests' })
}

export async function getGroceryOrder(id) {
  return respond(() => {
    const found = db.groceryOrders.find((o) => o.id === id)
    if (!found) {
      const err = new Error('We could not find that request.')
      err.code = 'NOT_FOUND'
      throw err
    }
    return clone(found)
  }, { label: 'your request' })
}

export async function createGroceryRequest(payload) {
  return respond(() => {
    const id = `GR-${1025 + db.groceryOrders.filter((o) => o.id.startsWith('GR-')).length}`
    const now = new Date().toISOString()
    const order = {
      id,
      type: 'grocery',
      guestId: payload.guestId ?? 'guest_sarah_01',
      propertyId: payload.propertyId ?? 'prop_rosemary_01',
      createdAt: now,
      deliveryDate: payload.deliveryDate,
      deliveryWindow: payload.deliveryWindow,
      store: payload.store,
      status: 'pending',
      items: payload.items,
      itemCount: String(payload.items || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean).length,
      notes: payload.notes ?? '',
      attachments: payload.attachments ?? [],
      estimatedTotal: payload.estimatedTotal ?? null,
      serviceFee: 39,
      deliveryFee: 15,
      tax: null,
      tip: null,
      payment: { state: 'not_required', method: null, authorizedAt: null, capturedAt: null, amount: null },
      timeline: [{ status: 'pending', at: now, note: 'Request submitted' }],
      shopper: null,
      deliveryPhoto: null,
      rating: null,
      cancellationAccepted: !!payload.cancellationAccepted,
    }
    db.groceryOrders = [order, ...db.groceryOrders]
    persist.groceryOrders()
    pushNotification({
      type: 'grocery',
      icon: 'bag',
      title: 'Grocery request received',
      message: `${id} is with our concierge team. We usually confirm within an hour.`,
      link: `/groceries/${id}`,
    })
    track(ANALYTICS_EVENTS.GROCERY_REQUEST_SUBMITTED, { orderId: id, store: payload.store })
    return clone(order)
  }, { label: 'your grocery request' })
}

/* -------------------------------------------------------------------------- */
/* Orders — transfers                                                          */
/* -------------------------------------------------------------------------- */

export async function getTransfers() {
  return respond(() => clone(db.transfers), { label: 'your transfers' })
}

export async function getTransfer(id) {
  return respond(() => {
    const found = db.transfers.find((t) => t.id === id)
    if (!found) {
      const err = new Error('We could not find that transfer.')
      err.code = 'NOT_FOUND'
      throw err
    }
    return clone(found)
  }, { label: 'your transfer' })
}

export async function createTransferRequest(payload) {
  return respond(() => {
    const id = `TR-${2049 + db.transfers.filter((t) => t.id.startsWith('TR-')).length}`
    const now = new Date().toISOString()
    const airport = AIRPORTS.find((a) => a.code === payload.airport)
    const vehicle = VEHICLE_CLASSES.find((v) => v.id === payload.vehicleClass)
    const transfer = {
      id,
      type: 'transfer',
      guestId: payload.guestId ?? 'guest_sarah_01',
      propertyId: payload.propertyId ?? 'prop_rosemary_01',
      direction: payload.direction ?? 'arrival',
      airport: payload.airport,
      airportName: airport?.name ?? '',
      date: payload.date,
      time: payload.time,
      flightNumber: payload.flightNumber,
      passengers: payload.passengers,
      bags: payload.bags,
      vehicleClass: payload.vehicleClass,
      vehicleName: vehicle?.name ?? '',
      pickupAddress: payload.pickupAddress,
      dropoffAddress: payload.dropoffAddress,
      specialRequests: payload.specialRequests ?? '',
      status: 'pending',
      quotedPrice: payload.quotedPrice ?? null,
      gratuity: null,
      payment: {
        state: 'not_required',
        method: null,
        authorizedAt: null,
        capturedAt: null,
        amount: payload.quotedPrice ?? null,
      },
      driver: null,
      timeline: [{ status: 'pending', at: now, note: 'Transfer requested' }],
      rating: null,
    }
    db.transfers = [transfer, ...db.transfers]
    persist.transfers()
    pushNotification({
      type: 'transfer',
      icon: 'car',
      title: 'Transfer request received',
      message: `${id} · ${payload.airport} on ${payload.date}. We are confirming a driver.`,
      link: `/transfers/${id}`,
    })
    track(ANALYTICS_EVENTS.TRANSFER_REQUEST_SUBMITTED, { transferId: id, airport: payload.airport })
    return clone(transfer)
  }, { label: 'your transfer request' })
}

/* -------------------------------------------------------------------------- */
/* Shared order mutations                                                      */
/* -------------------------------------------------------------------------- */

const NOTES = {
  confirmed: 'Confirmed by the concierge team',
  shopping: 'Your shopper is in the store',
  on_the_way: 'On the way to the property',
  delivered: 'Delivered and put away',
  payment_required: 'Card authorisation requested',
  scheduled: 'Driver assigned',
  completed: 'Completed',
  cancelled: 'Cancelled at guest request',
}

/**
 * Advance a mock order. In production the admin/ops console drives these
 * transitions and the guest app receives them over a socket or push.
 */
export async function updateMockOrderStatus(kind, id, status, extra = {}) {
  return respond(() => {
    const list = kind === 'grocery' ? db.groceryOrders : db.transfers
    const index = list.findIndex((o) => o.id === id)
    if (index === -1) {
      const err = new Error('We could not find that request.')
      err.code = 'NOT_FOUND'
      throw err
    }
    const now = new Date().toISOString()
    const current = list[index]
    const next = {
      ...current,
      status,
      ...extra,
      timeline: [...current.timeline, { status, at: now, note: extra.note ?? NOTES[status] ?? status }],
    }

    if (kind === 'grocery') {
      if (status === 'confirmed') {
        next.shopper = next.shopper ?? { name: 'Marcus D.', phone: '(850) 555-0333' }
        next.payment = { ...next.payment, state: 'payment_required', amount: estimateGroceryTotal(next) }
      }
      if (status === 'delivered') {
        next.deliveryPhoto = next.deliveryPhoto ?? extra.deliveryPhoto ?? null
      }
      db.groceryOrders[index] = next
      persist.groceryOrders()
    } else {
      if (status === 'confirmed') {
        next.payment = { ...next.payment, state: 'authorization_required' }
      }
      if (status === 'scheduled') {
        next.driver = next.driver ?? {
          name: 'Anthony P.',
          vehicle: 'Black Suburban · FL 4L8-22K',
          phone: '(850) 555-0345',
        }
      }
      if (status === 'completed') {
        next.payment = { ...next.payment, state: 'captured', capturedAt: now }
      }
      db.transfers[index] = next
      persist.transfers()
    }

    pushNotification({
      type: kind,
      icon: kind === 'grocery' ? 'bag' : 'car',
      title: statusHeadline(kind, status, id),
      message: extra.note ?? NOTES[status] ?? `${id} is now ${status.replace(/_/g, ' ')}.`,
      link: kind === 'grocery' ? `/groceries/${id}` : `/transfers/${id}`,
    })

    return clone(next)
  }, { label: 'your request' })
}

const statusHeadline = (kind, status, id) => {
  const noun = kind === 'grocery' ? 'grocery request' : 'airport transfer'
  switch (status) {
    case 'confirmed':
      return `Your ${noun} has been confirmed`
    case 'shopping':
      return 'Your shopper has started'
    case 'on_the_way':
      return 'Your grocery delivery is on the way'
    case 'delivered':
      return 'Your groceries have been delivered'
    case 'scheduled':
      return 'Your driver has been assigned'
    case 'completed':
      return 'Your transfer has been completed'
    case 'cancelled':
      return `${id} was cancelled`
    default:
      return `${id} updated`
  }
}

export const estimateGroceryTotal = (order) =>
  Number(order.estimatedTotal ?? 0) + Number(order.serviceFee ?? 0) + Number(order.deliveryFee ?? 0)

export async function cancelOrder(kind, id) {
  return updateMockOrderStatus(kind, id, 'cancelled')
}

/* -------------------------------------------------------------------------- */
/* Payments — mock only. No Stripe SDK, no network, no card data.              */
/* -------------------------------------------------------------------------- */

export async function authorizePayment(kind, id, { method = 'Visa •••• 4242' } = {}) {
  return respond(() => {
    const list = kind === 'grocery' ? db.groceryOrders : db.transfers
    const index = list.findIndex((o) => o.id === id)
    if (index === -1) throw Object.assign(new Error('Request not found.'), { code: 'NOT_FOUND' })
    const now = new Date().toISOString()
    const record = list[index]
    const next = {
      ...record,
      payment: { ...record.payment, state: 'authorized', method, authorizedAt: now },
      status: kind === 'transfer' ? 'scheduled' : record.status,
      timeline: [
        ...record.timeline,
        { status: kind === 'transfer' ? 'scheduled' : record.status, at: now, note: 'Card authorised — nothing charged yet' },
      ],
      driver:
        kind === 'transfer'
          ? record.driver ?? { name: 'Anthony P.', vehicle: 'Black Suburban · FL 4L8-22K', phone: '(850) 555-0345' }
          : record.driver,
    }
    list[index] = next
    kind === 'grocery' ? persist.groceryOrders() : persist.transfers()
    track(ANALYTICS_EVENTS.PAYMENT_AUTHORIZED, { kind, id })
    return clone(next)
  }, { label: 'your payment' })
}

export async function payNow(kind, id, { method = 'Visa •••• 4242', amount = null } = {}) {
  return respond(() => {
    const list = kind === 'grocery' ? db.groceryOrders : db.transfers
    const index = list.findIndex((o) => o.id === id)
    if (index === -1) throw Object.assign(new Error('Request not found.'), { code: 'NOT_FOUND' })
    const now = new Date().toISOString()
    const record = list[index]
    const next = {
      ...record,
      payment: {
        ...record.payment,
        state: 'paid',
        method,
        amount: amount ?? record.payment?.amount ?? estimateGroceryTotal(record),
        authorizedAt: record.payment?.authorizedAt ?? now,
        capturedAt: now,
      },
      timeline: [...record.timeline, { status: record.status, at: now, note: 'Payment received' }],
    }
    list[index] = next
    kind === 'grocery' ? persist.groceryOrders() : persist.transfers()
    track(ANALYTICS_EVENTS.PAYMENT_COMPLETED, { kind, id })
    return clone(next)
  }, { label: 'your payment' })
}

export async function addTip(kind, id, amount) {
  return respond(() => {
    const list = kind === 'grocery' ? db.groceryOrders : db.transfers
    const index = list.findIndex((o) => o.id === id)
    if (index === -1) throw Object.assign(new Error('Request not found.'), { code: 'NOT_FOUND' })
    const record = list[index]
    const next =
      kind === 'grocery' ? { ...record, tip: amount } : { ...record, gratuity: amount }
    list[index] = next
    kind === 'grocery' ? persist.groceryOrders() : persist.transfers()
    track(ANALYTICS_EVENTS.TIP_SELECTED, { kind, id, amount })
    return clone(next)
  }, { label: 'your tip' })
}

export async function submitRating(kind, id, { stars, feedback = '' }) {
  return respond(() => {
    const list = kind === 'grocery' ? db.groceryOrders : db.transfers
    const index = list.findIndex((o) => o.id === id)
    if (index === -1) throw Object.assign(new Error('Request not found.'), { code: 'NOT_FOUND' })
    list[index] = { ...list[index], rating: { stars, feedback } }
    kind === 'grocery' ? persist.groceryOrders() : persist.transfers()
    track(ANALYTICS_EVENTS.RATING_SUBMITTED, { kind, id, stars })
    return clone(list[index])
  }, { label: 'your rating' })
}

/** Post-checkout experience rating — not tied to a single service. */
export async function submitStayRating({ stars, feedback = '' }) {
  return respond(() => {
    track(ANALYTICS_EVENTS.RATING_SUBMITTED, { kind: 'stay', stars })
    return { ok: true, stars, feedback }
  }, { label: 'your review' })
}

/* -------------------------------------------------------------------------- */
/* Combined service feed                                                       */
/* -------------------------------------------------------------------------- */

export async function getOrders() {
  return respond(() => {
    const groceries = clone(db.groceryOrders).map((o) => ({
      ...o,
      kind: 'grocery',
      title: 'Grocery Delivery',
      date: o.deliveryDate,
      amount: o.payment?.amount ?? o.estimatedTotal,
      link: `/groceries/${o.id}`,
    }))
    const transfers = clone(db.transfers).map((t) => ({
      ...t,
      kind: 'transfer',
      title: 'Airport Transfer',
      date: t.date,
      amount: t.payment?.amount ?? t.quotedPrice,
      link: `/transfers/${t.id}`,
    }))
    const partners = clone(mockPartnerBookings).map((p) => ({
      ...p,
      kind: 'partner',
      title: p.partnerName,
      amount: null,
      link: `/partners/${p.partnerId}`,
    }))
    return [...groceries, ...transfers, ...partners].sort((a, b) =>
      String(b.date ?? '').localeCompare(String(a.date ?? '')),
    )
  }, { label: 'your services' })
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                               */
/* -------------------------------------------------------------------------- */

const notificationSubscribers = new Set()

export function subscribeToNotifications(fn) {
  notificationSubscribers.add(fn)
  return () => notificationSubscribers.delete(fn)
}

function pushNotification({ type, icon, title, message, link }) {
  const notification = {
    id: makeId('ntf'),
    type,
    icon,
    title,
    message,
    link,
    createdAt: new Date().toISOString(),
    read: false,
  }
  db.notifications = [notification, ...db.notifications]
  persist.notifications()
  notificationSubscribers.forEach((fn) => fn(clone(notification)))
  return notification
}

export async function getNotifications() {
  return respond(() => clone(db.notifications), { label: 'your notifications' })
}

export async function markNotificationRead(id) {
  return respond(() => {
    db.notifications = db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    persist.notifications()
    return clone(db.notifications)
  }, { label: 'your notifications' })
}

export async function markAllNotificationsRead() {
  return respond(() => {
    db.notifications = db.notifications.map((n) => ({ ...n, read: true }))
    persist.notifications()
    return clone(db.notifications)
  }, { label: 'your notifications' })
}

/* -------------------------------------------------------------------------- */
/* Vitoria conversation                                                        */
/* -------------------------------------------------------------------------- */

export async function getMessages() {
  return respond(() => clone(db.messages), { label: 'your conversation' })
}

/** Persist a message locally. The reply itself comes from vitoriaService. */
export function appendMessage(message) {
  db.messages = [...db.messages, message]
  persist.messages()
  return message
}

export function clearMessages() {
  db.messages = []
  persist.messages()
}

/* -------------------------------------------------------------------------- */
/* Preferences + saved places                                                  */
/* -------------------------------------------------------------------------- */

export async function updatePreferences(next) {
  return respond(() => {
    db.preferences = { ...(db.preferences ?? {}), ...next }
    persist.preferences()
    return clone(db.preferences)
  }, { label: 'your preferences' })
}

export async function toggleSavedPlace(id, currentList = []) {
  return respond(() => {
    const list = new Set(currentList)
    const wasSaved = list.has(id)
    wasSaved ? list.delete(id) : list.add(id)
    db.saved = [...list]
    persist.saved()
    track(wasSaved ? ANALYTICS_EVENTS.PLACE_UNSAVED : ANALYTICS_EVENTS.PLACE_SAVED, { placeId: id })
    return db.saved
  }, { label: 'your saved places' })
}

/** Look up any saved entity across catalogues. */
export function resolveEntity(id) {
  return (
    mockRestaurants.find((r) => r.id === id) ??
    mockPartners.find((p) => p.id === id) ??
    mockBeaches.find((b) => b.id === id) ??
    mockEvents.find((e) => e.id === id) ??
    null
  )
}

export { trackPartnerClick, trackPartnerView }
export const listProperties = () => clone(mockProperties)
export const listGuests = () => clone(mockGuests)
