/**
 * Live admin API rows are sparse snake_case. The screens still expect the
 * mock-shaped objects (name, images[], stats, subscription, vitoria, …).
 * Mapping here keeps every list/detail page from throwing into ErrorBoundary.
 */

const LANG = { en: 'English', es: 'Spanish', fr: 'French', de: 'German' }

const PROPERTY_STATUS = {
  published: 'active',
  draft: 'pending',
  paused: 'inactive',
  active: 'active',
  pending: 'pending',
  inactive: 'inactive',
  suspended: 'suspended',
}

const emptyStats = {
  views: 0,
  websiteClicks: 0,
  phoneClicks: 0,
  directionsClicks: 0,
  conversations: 0,
  messages: 0,
  partnerViews: 0,
  partnerClicks: 0,
  serviceRequests: 0,
  payments: 0,
  tips: 0,
  guestSessions: 0,
  satisfaction: null,
}

const pick = (row, ...keys) => {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

const finiteNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const fullName = (row) => {
  const name = [pick(row, 'firstName', 'first_name'), pick(row, 'lastName', 'last_name')]
    .filter(Boolean)
    .join(' ')
    .trim()
  return name || pick(row, 'name', 'email') || '—'
}

const asArray = (value) => {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return []
}

const asObject = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    } catch {
      /* ignore */
    }
  }
  return {}
}

const asLabel = (value, fallback = '') => {
  if (value == null || value === '') return fallback
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  return asText(value, fallback)
}

const shapeLineItems = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item, i) => {
        if (item == null) return null
        if (typeof item === 'string') return { id: `it_${i}`, name: item, qty: 1, note: '' }
        if (typeof item === 'object') {
          return {
            id: item.id ?? `it_${i}`,
            name: asLabel(item.name || item.label || item.text, `Item ${i + 1}`),
            qty: finiteNumber(item.qty ?? item.quantity, 1),
            note: asLabel(item.note, ''),
          }
        }
        return { id: `it_${i}`, name: String(item), qty: 1, note: '' }
      })
      .filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((name, i) => ({ id: `it_${i}`, name, qty: 1, note: '' }))
  }
  return []
}

const asText = (value, fallback = '') => {
  if (value == null || value === '') return fallback
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => asText(item)).filter(Boolean).join(', ') || fallback
  if (typeof value === 'object') {
    if (value.label || value.text || value.notes || value.instructions) {
      return String(value.label ?? value.text ?? value.notes ?? value.instructions)
    }
    const parts = Object.entries(value)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? asText(v) : v}`)
    return parts.join(' · ') || fallback
  }
  return fallback
}

const asImages = (row) => {
  const raw = pick(row, 'images', 'photos') ?? []
  const urls = asArray(raw)
    .map((item) => (typeof item === 'string' ? item : item?.url ?? item?.src ?? item?.photoId))
    .filter(Boolean)
  const cover = pick(row, 'coverUrl', 'cover_url', 'logoUrl', 'logo_url', 'avatarUrl', 'avatar_url')
  if (cover && !urls.includes(cover)) urls.unshift(cover)
  return urls
}

const isoDay = (value) => {
  if (!value) return null
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
    return match ? match[1] : null
  }
  try {
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString().slice(0, 10)
  } catch {
    return null
  }
}

const nightsBetween = (start, end) => {
  const a = isoDay(start)
  const b = isoDay(end)
  if (!a || !b) return 0
  const ms = new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()
  return Math.max(0, Math.round(ms / 86400000))
}

const stayStatus = (checkIn, checkOut, fallback) => {
  const today = new Date().toISOString().slice(0, 10)
  const inDay = isoDay(checkIn)
  const outDay = isoDay(checkOut)
  if (!inDay || !outDay) return fallback || 'inactive'
  if (outDay < today) return 'checked_out'
  if (inDay > today) return 'upcoming'
  return 'active'
}

export function shapeGuest(row) {
  if (!row) return row
  const checkIn = pick(row, 'checkIn', 'check_in', 'check_in_date')
  const checkOut = pick(row, 'checkOut', 'check_out', 'check_out_date')
  const adults = Number(pick(row, 'adults') ?? 0)
  const children = Number(pick(row, 'children') ?? 0)
  const language = pick(row, 'language') ?? 'en'
  return {
    ...row,
    firstName: pick(row, 'firstName', 'first_name') ?? '',
    lastName: pick(row, 'lastName', 'last_name') ?? '',
    name: fullName(row),
    phone: pick(row, 'phone') ?? '—',
    language: LANG[language] ?? language,
    propertyId: pick(row, 'propertyId', 'property_id') ?? '',
    propertyName: pick(row, 'propertyName', 'property_name') ?? 'No stay on file',
    propertySlug: pick(row, 'propertySlug', 'property_slug') ?? '',
    hostId: pick(row, 'hostId', 'host_id') ?? '',
    hostName: pick(row, 'hostName', 'host_name') ?? '—',
    checkIn: isoDay(checkIn) ?? checkIn ?? null,
    checkOut: isoDay(checkOut) ?? checkOut ?? null,
    nights: pick(row, 'nights') ?? nightsBetween(checkIn, checkOut),
    adults,
    children,
    partySize: pick(row, 'partySize', 'party_size') ?? adults + children,
    confirmationCode: pick(row, 'confirmationCode', 'confirmation_code') ?? '—',
    returning: Boolean(pick(row, 'returning')),
    lastActiveAt: pick(row, 'lastActiveAt', 'last_active_at', 'updated_at', 'created_at') ?? null,
    joinedAt: pick(row, 'joinedAt', 'created_at') ?? null,
    rating: pick(row, 'rating') ?? null,
    languageCode: language,
    notes: pick(row, 'notes') ?? '',
    accountStatus: pick(row, 'accountStatus', 'account_status') === 'blocked' ? 'blocked' : 'active',
    status: stayStatus(checkIn, checkOut, pick(row, 'stay_status')),
    stats: { ...emptyStats, ...asObject(row.stats) },
  }
}

export function shapeHost(row) {
  if (!row) return row
  const subscription = {
    planId: 'plan_essential',
    status: 'trial',
    amount: 0,
    nextBillingDate: null,
    startedAt: pick(row, 'created_at', 'joinedAt') ?? null,
    method: 'Not billed yet',
    trialEndsAt: null,
    ...asObject(row.subscription),
  }
  return {
    ...row,
    firstName: pick(row, 'firstName', 'first_name') ?? '',
    lastName: pick(row, 'lastName', 'last_name') ?? '',
    name: fullName(row),
    phone: pick(row, 'phone') ?? '—',
    company: pick(row, 'company') ?? null,
    town: pick(row, 'town', 'city') ?? '—',
    status: pick(row, 'status') ?? 'pending',
    joinedAt: pick(row, 'joinedAt', 'created_at') ?? null,
    lastActiveAt: pick(row, 'lastActiveAt', 'last_active_at', 'updated_at', 'created_at') ?? null,
    propertyCount: Number(pick(row, 'propertyCount', 'property_count') ?? 0),
    guestCount: Number(pick(row, 'guestCount', 'guest_count') ?? 0),
    notes: pick(row, 'notes') ?? '',
    subscription,
    vitoria: {
      conversations: 0,
      resolved: 0,
      escalations: 0,
      ...asObject(row.vitoria),
    },
  }
}

export function shapePartner(row) {
  if (!row) return row
  const cents = pick(row, 'startingPrice', 'starting_price_cents')
  return {
    ...row,
    name: pick(row, 'name') ?? 'Untitled listing',
    ownerName: pick(row, 'ownerName', 'owner_name', 'owner') ?? '',
    owner: pick(row, 'owner', 'ownerName', 'owner_name') ?? '—',
    town: pick(row, 'town', 'city') ?? '—',
    address: pick(row, 'address') ?? '—',
    phone: pick(row, 'phone') ?? '—',
    website: pick(row, 'website') ?? '',
    description: pick(row, 'description', 'short_description') ?? '',
    hours: asText(pick(row, 'hours'), '—'),
    social: { instagram: '—', ...asObject(row.social) },
    categoryId: pick(row, 'categoryId', 'category_id') ?? null,
    slug: pick(row, 'slug') ?? '',
    status: pick(row, 'status') ?? 'pending',
    published: Boolean(pick(row, 'published')),
    featured: Boolean(pick(row, 'featured')),
    submittedAt: pick(row, 'submittedAt', 'submitted_at', 'created_at') ?? null,
    startingPrice: typeof cents === 'number' ? (cents > 1000 ? cents / 100 : cents) : cents ?? null,
    images: asImages(row),
    stats: { ...emptyStats, ...asObject(row.stats) },
  }
}

export function shapeProperty(row) {
  if (!row) return row
  const wifi = asObject(pick(row, 'wifi'))
  const checkIn = asObject(pick(row, 'checkIn', 'check_in'))
  const checkOut = asObject(pick(row, 'checkOut', 'check_out'))
  const emergency = asObject(pick(row, 'emergency'))
  const vitoria = {
    enabled: true,
    tone: 'Warm and local',
    specialNotes: '',
    escalateAfter: 2,
    ...asObject(pick(row, 'vitoria')),
  }
  const dbStatus = pick(row, 'status') ?? 'draft'
  const parkingRaw = pick(row, 'parking')
  return {
    ...row,
    hostId: pick(row, 'hostId', 'host_id') ?? '',
    hostName: pick(row, 'hostName', 'host_name') ?? '—',
    town: pick(row, 'town', 'city', 'community') ?? '—',
    type: pick(row, 'type') ?? 'Vacation Home',
    address: pick(row, 'address') ?? '—',
    status: PROPERTY_STATUS[dbStatus] ?? dbStatus,
    bedrooms: Number(pick(row, 'bedrooms') ?? 0),
    bathrooms: Number(pick(row, 'bathrooms') ?? 0),
    sleeps: Number(pick(row, 'sleeps') ?? 0),
    currentGuests: Number(pick(row, 'currentGuests', 'current_guests') ?? 0),
    recommendations: Number(pick(row, 'recommendations') ?? 0),
    createdAt: pick(row, 'createdAt', 'created_at') ?? null,
    slug: pick(row, 'slug') ?? '',
    images: asImages(row),
    wifi: {
      ...wifi,
      network: wifi.network ?? wifi.ssid ?? '',
      password: wifi.password ?? '',
      notes: wifi.notes ?? '',
    },
    checkIn: {
      ...checkIn,
      time: checkIn.time ?? '4:00 PM',
      instructions: checkIn.instructions ?? asText(pick(row, 'access'), ''),
    },
    checkOut: {
      ...checkOut,
      time: checkOut.time ?? '10:00 AM',
      instructions: checkOut.instructions ?? '',
    },
    parking: asText(parkingRaw, '—'),
    rules: asArray(pick(row, 'rules')).map((rule) => asText(rule)).filter(Boolean),
    emergency: {
      ...emergency,
      contactName: emergency.contactName ?? emergency.contact_name ?? '',
      contactPhone: emergency.contactPhone ?? emergency.contact_phone ?? '',
      managerPhone: emergency.managerPhone ?? emergency.manager_phone ?? '',
      hospital: emergency.hospital ?? '',
    },
    vitoria,
    stats: { ...emptyStats, ...asObject(row.stats) },
  }
}

export const shapeGuests = (rows) => asArray(rows).map(shapeGuest)
export const shapeHosts = (rows) => asArray(rows).map(shapeHost)
export const shapePartners = (rows) => asArray(rows).map(shapePartner)
export const shapeProperties = (rows) => asArray(rows).map(shapeProperty)

export function shapeCategory(row) {
  if (!row || typeof row !== 'object') return null
  return {
    ...row,
    id: pick(row, 'id') ?? '',
    name: asLabel(pick(row, 'name'), 'Untitled'),
    slug: asLabel(pick(row, 'slug'), ''),
    description: asLabel(pick(row, 'description', 'blurb'), ''),
    blurb: asLabel(pick(row, 'blurb', 'description'), ''),
    icon: asLabel(pick(row, 'icon'), 'compass'),
    image: pick(row, 'image', 'coverUrl', 'cover_url') ?? null,
    order: finiteNumber(pick(row, 'order', 'sort_order', 'sortOrder'), 0),
    enabled: pick(row, 'enabled') !== false,
    listings: finiteNumber(pick(row, 'listings', 'listingCount', 'listing_count'), 0),
  }
}

export const shapeCategories = (rows) => asArray(rows).map(shapeCategory).filter(Boolean)

const TOPIC_RULES = [
  [/wifi|wi-?fi|password|router|network/i, 'WiFi'],
  [/check[- ]?in|keypad|door code|arrival/i, 'Check-in'],
  [/check[- ]?out|before we leave/i, 'Check-out'],
  [/restaurant|dinner|breakfast|lunch|reservation|opentable/i, 'Restaurant'],
  [/beach|swim|gulf/i, 'Beach'],
  [/golf.?cart|cart rental/i, 'Golf Cart'],
  [/bonfire|fire pit/i, 'Bonfire'],
  [/groc|fridge|stocked|shopping list/i, 'Grocery'],
  [/airport|transfer|pickup|\becp\b|\bvps\b|\bpns\b|flight/i, 'Airport Transfer'],
  [/emergenc|air condition|\bac\b|leak|broken/i, 'Emergency'],
  [/house rule|quiet hour|parties/i, 'House Rules'],
]

export function inferTopic(text) {
  const value = String(text ?? '')
  for (const [pattern, topic] of TOPIC_RULES) {
    if (pattern.test(value)) return topic
  }
  return 'General'
}

export function shapeMessage(row) {
  if (!row) return row
  const roleRaw = pick(row, 'role', 'sender_type') ?? 'user'
  const role =
    roleRaw === 'assistant' || roleRaw === 'vitoria' ? 'vitoria' : 'guest'
  return {
    ...row,
    id: pick(row, 'id'),
    role,
    text: pick(row, 'text', 'content') ?? '',
    at: pick(row, 'at', 'created_at', 'createdAt') ?? null,
  }
}

export function shapeConversation(row) {
  if (!row) return row
  const first = pick(row, 'first_message', 'firstMessage', 'title') ?? ''
  const language = pick(row, 'language') ?? 'en'
  const guestName =
    pick(row, 'guestName', 'guest_name')?.trim() ||
    fullName({ first_name: pick(row, 'first_name'), last_name: pick(row, 'last_name'), email: pick(row, 'guest_email', 'email') })
  const createdGrocery = pick(row, 'created_grocery', 'createdGrocery')
  const createdTransfer = pick(row, 'created_transfer', 'createdTransfer')
  const createdRequest =
    pick(row, 'createdRequest') ??
    (createdTransfer
      ? { kind: 'transfer', label: 'Airport transfer request' }
      : createdGrocery
        ? { kind: 'grocery', label: 'Grocery delivery request' }
        : null)
  return {
    ...row,
    guestId: pick(row, 'guestId', 'guest_id') ?? '',
    guestName: guestName || 'Guest',
    propertyId: pick(row, 'propertyId', 'property_id') ?? '',
    propertyName: pick(row, 'propertyName', 'property_name') ?? '—',
    language: LANG[language] ?? language,
    topic: pick(row, 'topic') || inferTopic(first),
    status: pick(row, 'status') ?? 'active',
    messageCount: finiteNumber(
      pick(row, 'messageCount', 'message_count') ?? asArray(pick(row, 'messages')).length,
      0,
    ),
    responseSeconds: finiteNumber(pick(row, 'responseSeconds', 'response_seconds'), 0),
    satisfaction: pick(row, 'satisfaction') ?? null,
    createdAt: pick(row, 'createdAt', 'created_at') ?? null,
    updatedAt: pick(row, 'updatedAt', 'updated_at') ?? null,
    createdRequest,
    messages: asArray(pick(row, 'messages')).map(shapeMessage),
  }
}

export const shapeConversations = (rows) => asArray(rows).map(shapeConversation)

const dollarsFrom = (row, dollarKeys, centsKey) => {
  const dollars = pick(row, ...dollarKeys)
  if (dollars !== undefined) return finiteNumber(dollars)
  const cents = pick(row, centsKey)
  if (cents !== undefined) return finiteNumber(cents) / 100
  return 0
}

export function shapeOrder(row) {
  if (!row || typeof row !== 'object') return null
  const created = pick(row, 'createdAt', 'created_at')
  const estimatedAmount = dollarsFrom(row, ['estimatedAmount', 'estimatedTotal'], 'estimated_grocery_cents')
  const actualRaw = dollarsFrom(row, ['actualAmount'], 'actual_amount_cents')
  return {
    ...row,
    guestId: pick(row, 'guestId', 'guest_id') ?? '',
    guestName: asLabel(pick(row, 'guestName', 'guest_name'), 'Guest'),
    propertyId: pick(row, 'propertyId', 'property_id') ?? '',
    propertyName: asLabel(pick(row, 'propertyName', 'property_name'), '—'),
    hostName: asLabel(pick(row, 'hostName', 'host_name'), ''),
    deliveryDate: pick(row, 'deliveryDate', 'delivery_date') ?? null,
    deliveryWindow: asLabel(pick(row, 'deliveryWindow', 'delivery_window'), ''),
    estimatedAmount,
    estimatedTotal: estimatedAmount,
    actualAmount: actualRaw || null,
    serviceFee: dollarsFrom(row, ['serviceFee'], 'service_fee_cents'),
    tipAmount: dollarsFrom(row, ['tipAmount', 'tip'], 'tip_amount_cents'),
    createdAt: created ? String(created) : '',
    createdBy: asLabel(pick(row, 'createdBy', 'created_by'), 'guest'),
    status: asLabel(pick(row, 'status'), 'pending'),
    store: asLabel(pick(row, 'store'), ''),
    items: shapeLineItems(pick(row, 'items') ?? pick(row, 'items_text')),
    shopper: asLabel(pick(row, 'shopper')?.name ?? pick(row, 'shopper'), '') || null,
    paymentId: pick(row, 'paymentId', 'payment_id') ?? null,
  }
}

export function shapeTransferRow(row) {
  if (!row || typeof row !== 'object') return null
  const created = pick(row, 'createdAt', 'created_at')
  const amount = dollarsFrom(row, ['amount', 'quotedPrice'], 'quoted_fare_cents')
  const pickupTime = asLabel(pick(row, 'pickupTime', 'pickup_time', 'time'), '')
  const vehicleClass = asLabel(pick(row, 'vehicleClass', 'vehicle_id', 'vehicleId'), '')
  return {
    ...row,
    guestId: pick(row, 'guestId', 'guest_id') ?? '',
    guestName: asLabel(pick(row, 'guestName', 'guest_name'), 'Guest'),
    propertyId: pick(row, 'propertyId', 'property_id') ?? '',
    propertyName: asLabel(pick(row, 'propertyName', 'property_name'), '—'),
    hostName: asLabel(pick(row, 'hostName', 'host_name'), ''),
    pickupDate: pick(row, 'pickupDate', 'pickup_date', 'date') ?? null,
    pickupTime,
    time: pickupTime,
    flightNumber: asLabel(pick(row, 'flightNumber', 'flight_number'), ''),
    amount,
    quotedPrice: amount,
    tipAmount: dollarsFrom(row, ['tipAmount'], 'tip_amount_cents'),
    createdAt: created ? String(created) : '',
    createdBy: asLabel(pick(row, 'createdBy', 'created_by'), 'guest'),
    status: asLabel(pick(row, 'status'), 'pending'),
    airport: asLabel(pick(row, 'airport'), ''),
    vehicleClass,
    vehicleName: asLabel(pick(row, 'vehicleName', 'vehicle_name'), vehicleClass),
    driver: asLabel(pick(row, 'driver')?.name ?? pick(row, 'driver'), '') || null,
    passengers: finiteNumber(pick(row, 'passengers'), 0),
    bags: finiteNumber(pick(row, 'bags'), 0),
  }
}

export const shapeOrders = (rows) => asArray(rows).map(shapeOrder).filter(Boolean)
export const shapeTransfers = (rows) => asArray(rows).map(shapeTransferRow).filter(Boolean)

export function shapeAudit(row) {
  if (!row || typeof row !== 'object') return null
  const metadata = pick(row, 'detail', 'metadata')
  return {
    id: pick(row, 'id'),
    userId: pick(row, 'userId', 'user_id', 'actor_id') ?? '',
    userName: pick(row, 'userName', 'user_name', 'actor_name') ?? '—',
    userRole: pick(row, 'userRole', 'user_role', 'actor_role') ?? '',
    action: pick(row, 'action') ?? '—',
    entity: pick(row, 'entity') ?? '—',
    entityId: pick(row, 'entityId', 'entity_id') ?? '—',
    status: pick(row, 'status') ?? 'success',
    detail: typeof metadata === 'string' ? metadata : '',
    ip: pick(row, 'ip') || '—',
    at: pick(row, 'at', 'created_at', 'createdAt') ?? null,
  }
}

export const shapeAudits = (rows) => asArray(rows).map(shapeAudit).filter(Boolean)
