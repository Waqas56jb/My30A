import { api, pageWrap } from './api'
import { shapeGuest, shapeGuests, shapeHost, shapeHosts, shapePartner, shapePartners, shapeProperty, shapeProperties, shapeConversation, shapeConversations, shapeOrder, shapeOrders, shapeTransferRow, shapeTransfers, shapeCategories } from '../utils/shapeAdmin'
import { mergeSettings } from '../data/settings'

export function resetAll() {}
export const setAuditActor = () => {}
export function recordAudit() {}
export const subscribe = () => () => {}
export const settingsNow = () => ({})

const listOr = (data) => (Array.isArray(data) ? data : data?.rows ?? data?.items ?? [])

const matches = (row, search, ...fields) => {
  if (!search) return true
  const q = search.toLowerCase()
  return fields.some((field) => String(field ?? '').toLowerCase().includes(q))
}

export async function getGuests({ search = '', status = 'all', page = 1, pageSize = 25 } = {}) {
  const data = await api('/admin/guests')
  let rows = shapeGuests(listOr(data))
  if (status !== 'all') rows = rows.filter((g) => g.status === status)
  rows = rows.filter((g) =>
    matches(g, search, g.name, g.email, g.phone, g.propertyName, g.hostName, g.confirmationCode),
  )
  return pageWrap(rows, { page, pageSize })
}

export async function getGuest(id) {
  const guest = shapeGuest(await api(`/admin/guests/${id}`))
  if (!guest?.id) {
    const err = new Error('Guest not found')
    throw err
  }
  const [orderPage, transferPage, conversations] = await Promise.all([
    getOrders({ pageSize: 200 }).catch(() => ({ rows: [] })),
    getTransfers({ pageSize: 200 }).catch(() => ({ rows: [] })),
    getAllConversations().catch(() => []),
  ])
  const sameGuest = (row) => row.guestId === id || row.guest_id === id
  return {
    guest,
    orders: (orderPage.rows ?? []).filter(sameGuest),
    transfers: (transferPage.rows ?? []).filter(sameGuest),
    payments: [],
    conversations: (Array.isArray(conversations) ? conversations : []).filter(sameGuest),
    reviews: [],
  }
}

export async function updateGuest() {
  throw new Error('Guest records are updated from the guest account.')
}

export async function getHosts({ search = '', status = 'all', page = 1, pageSize = 25 } = {}) {
  const data = await api('/admin/hosts')
  let rows = shapeHosts(listOr(data))
  if (status !== 'all') rows = rows.filter((h) => h.status === status)
  rows = rows.filter((h) => matches(h, search, h.name, h.email, h.company, h.phone, h.town))
  return pageWrap(rows, { page, pageSize })
}

export async function getHost(id) {
  const host = shapeHost(await api(`/admin/hosts/${id}`))
  if (!host?.id) throw new Error('Host not found')
  const properties = await getProperties({ hostId: id, pageSize: 200 }).catch(() => ({ rows: [] }))
  return {
    host: { ...host, propertyCount: host.propertyCount || properties.rows.length },
    properties: properties.rows ?? [],
    guests: [],
    payments: [],
    reviews: [],
  }
}

export async function setHostStatus(id, status, reason = '') {
  return api(`/admin/hosts/${id}/status`, { method: 'POST', body: { status, reason } })
}

export async function getProperties({ search = '', status = 'all', hostId = null, page = 1, pageSize = 25 } = {}) {
  const data = await api('/admin/properties')
  let rows = shapeProperties(listOr(data))
  if (status !== 'all') rows = rows.filter((p) => p.status === status)
  if (hostId) rows = rows.filter((p) => p.hostId === hostId || p.host_id === hostId)
  rows = rows.filter((p) => matches(p, search, p.name, p.address, p.town, p.hostName, p.type))
  return pageWrap(rows, { page, pageSize })
}

export async function getProperty(id) {
  const property = shapeProperty(await api(`/admin/properties/${id}`))
  if (!property?.id) throw new Error('Property not found')
  let host = null
  if (property.hostId) {
    try {
      host = shapeHost(await api(`/admin/hosts/${property.hostId}`))
    } catch {
      host = { id: property.hostId, name: property.hostName }
    }
  }
  return { property, host, guests: [], orders: [], transfers: [], conversations: [] }
}

export async function updateProperty(id, patch) {
  const statusMap = { active: 'published', pending: 'draft', inactive: 'paused', suspended: 'paused' }
  const body = { ...patch }
  if (body.status && statusMap[body.status]) body.status = statusMap[body.status]
  return api(`/admin/properties/${id}`, { method: 'PATCH', body })
}

export async function getPartners({ search = '', status = 'all', featured, categoryId = '', page = 1, pageSize = 25 } = {}) {
  const data = await api('/admin/partners')
  let rows = shapePartners(listOr(data))
  if (status !== 'all') rows = rows.filter((p) => p.status === status)
  if (featured === true) rows = rows.filter((p) => p.featured)
  if (categoryId) rows = rows.filter((p) => p.categoryId === categoryId)
  rows = rows.filter((p) => matches(p, search, p.name, p.email, p.owner, p.town))
  return pageWrap(rows, { page, pageSize })
}

export async function getPartner(id) {
  const partner = shapePartner(await api(`/admin/partners/${id}`))
  if (!partner?.id) throw new Error('Partner not found')
  let category = null
  try {
    const cats = await getCategories()
    const list = Array.isArray(cats) ? cats : listOr(cats)
    category = list.find((c) => c.id === partner.categoryId) ?? null
  } catch {
    /* category is optional */
  }
  return { partner, category, reviews: [] }
}

export async function setPartnerStatus(id, status, reason = '') {
  return api(`/admin/partners/${id}/status`, { method: 'POST', body: { status, reason } })
}

export async function updatePartner(id, patch) {
  return api(`/admin/partners/${id}/status`, {
    method: 'POST',
    body: { status: patch.status, reason: patch.reason ?? '' },
  })
}

export async function getCategories() {
  return shapeCategories(listOr(await api('/admin/categories')))
}

export async function saveCategory(category) {
  const body = {
    name: category.name,
    slug: category.slug,
    blurb: category.description ?? category.blurb,
    enabled: category.enabled,
    sortOrder: category.order ?? category.sortOrder,
  }
  if (category.id) return api(`/admin/categories/${category.id}`, { method: 'PATCH', body })
  return api('/admin/categories', { method: 'POST', body })
}

export async function deleteCategory(id) {
  return api(`/admin/categories/${id}`, { method: 'DELETE' })
}

export async function reorderCategory(id, direction) {
  return api(`/admin/categories/${id}`, { method: 'PATCH', body: { direction } })
}

export async function getAdminRestaurants() {
  return api('/admin/restaurants')
}

export async function saveRestaurant(restaurant) {
  const body = {
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    description: restaurant.description,
    location: restaurant.location,
    phone: restaurant.phone,
    website: restaurant.website,
    featured: restaurant.featured,
    active: restaurant.active,
    bookingPlatform: restaurant.bookingPlatform,
    bookingUrl: restaurant.bookingPlatform === 'phone_only' ? null : restaurant.bookingUrl,
    bookingNotes: restaurant.bookingNotes,
    lastVerifiedDate: restaurant.lastVerifiedDate,
  }
  if (restaurant.id) return api(`/admin/restaurants/${restaurant.id}`, { method: 'PATCH', body })
  return api('/admin/restaurants', { method: 'POST', body })
}

export async function verifyRestaurant(id) {
  return api(`/admin/restaurants/${id}/verify`, { method: 'POST', body: {} })
}

export async function getRestaurantFreshness() {
  return api('/admin/restaurants/freshness')
}

export async function getOrders({ search = '', status = 'all', page = 1, pageSize = 25 } = {}) {
  const rows = shapeOrders(listOr(await api('/grocery')))
  const statuses = Array.isArray(status) ? status : status && status !== 'all' ? [status] : null
  const narrowed = statuses ? rows.filter((o) => statuses.includes(o.status)) : rows
  const filtered = search ? narrowed.filter((o) => matches(o, search, o.id, o.guestName, o.propertyName)) : narrowed
  return pageWrap(filtered, { page, pageSize })
}

export async function getOrder(id) {
  const order = shapeOrder(await api(`/grocery/${id}`))
  return { order, payments: [], guest: null }
}

export async function setOrderStatus(id, status, extra = {}) {
  return api(`/grocery/${id}/status`, { method: 'POST', body: { status, ...extra } })
}

export async function getTransfers({ search = '', status = 'all', airport = 'all', page = 1, pageSize = 25 } = {}) {
  const q = new URLSearchParams()
  if (status !== 'all') q.set('status', status)
  if (airport !== 'all') q.set('airport', airport)
  const rows = shapeTransfers(listOr(await api(`/transfers?${q}`)))
  const filtered = search ? rows.filter((t) => matches(t, search, t.id, t.guestName, t.propertyName, t.airport)) : rows
  return pageWrap(filtered, { page, pageSize })
}

export async function getTransfer(id) {
  const transfer = shapeTransferRow(await api(`/transfers/${id}`))
  return { transfer, payments: [], guest: null, refund: null }
}

export async function setTransferStatus(id, status, extra = {}) {
  return api(`/transfers/${id}/status`, { method: 'POST', body: { status, ...extra } })
}

export async function getPayments({ page = 1, pageSize = 25 } = {}) {
  const data = await api('/admin/payments')
  return pageWrap(listOr(data), { page, pageSize })
}

export async function getPayment(id) {
  const data = await getPayments({ page: 1, pageSize: 200 })
  const payment = data.rows.find((p) => p.id === id)
  return { payment: payment ?? null, refund: null }
}

export async function refundPayment(id, { amount, reason }) {
  return api(`/admin/payments/${id}/refund`, { method: 'POST', body: { amount, reason } })
}

export async function getRefunds({ page = 1, pageSize = 25 } = {}) {
  return pageWrap([], { page, pageSize })
}

export async function setRefundStatus() {
  throw new Error('Refund status is updated by the payment provider.')
}

export async function getTips({ page = 1, pageSize = 25 } = {}) {
  const data = await getPayments({ page: 1, pageSize: 200 })
  return pageWrap(data.rows.filter((p) => p.type === 'tip'), { page, pageSize })
}

export async function getSubscriptions({ search = '', status = 'all', page = 1, pageSize = 25 } = {}) {
  const data = await api('/admin/hosts')
  let rows = shapeHosts(listOr(data)).map((h) => ({
    id: `sub_${h.id}`,
    hostId: h.id,
    hostName: h.name,
    hostEmail: h.email,
    company: h.company,
    status: h.subscription.status ?? h.status,
    ...h.subscription,
  }))
  if (status !== 'all') rows = rows.filter((s) => s.status === status)
  if (search) rows = rows.filter((s) => `${s.hostName} ${s.hostEmail}`.toLowerCase().includes(search.toLowerCase()))
  return pageWrap(rows, { page, pageSize })
}

export async function setSubscriptionStatus() {
  throw new Error('Subscriptions are not billed yet.')
}

export async function getConversations({ search = '', status = 'all', topic = 'all', page = 1, pageSize = 25 } = {}) {
  const rows = shapeConversations(listOr(await api('/conversations')))
  const filtered = rows.filter((c) => {
    if (status !== 'all' && c.status !== status) return false
    if (topic !== 'all' && c.topic !== topic) return false
    return matches(c, search, c.guestName, c.propertyName, c.topic, c.guest_email)
  })
  return pageWrap(filtered, { page, pageSize })
}

export async function getConversation(id) {
  const raw = await api(`/conversations/${id}`)
  const conv = raw?.conversation ?? raw
  return shapeConversation({ ...conv, messages: raw.messages ?? conv.messages ?? [] })
}

export const getAllConversations = async () => shapeConversations(listOr(await api('/conversations')))

export async function getVitoriaKpis() {
  try {
    const data = await api('/admin/vitoria/kpis')
    return {
      conversations: Number(data?.conversations) || 0,
      messages: Number(data?.messages) || 0,
      active: Number(data?.active) || 0,
      resolved: Number(data?.resolved) || 0,
      escalated: Number(data?.escalated) || 0,
      automatedRate: Number(data?.automatedRate) || 0,
      escalationRate: Number(data?.escalationRate) || 0,
      avgResponse: Number.isFinite(Number(data?.avgResponse)) ? Number(data.avgResponse) : 0,
    }
  } catch {
    return null
  }
}

export async function getKnowledge({ search = '' } = {}) {
  const rows = listOr(await api('/admin/knowledge')).map((row) => ({
    ...row,
    question: row.question ?? '',
    answer: row.answer ?? row.content ?? '',
    enabled: row.enabled ?? row.is_active !== false,
    usedCount: Number(row.usedCount ?? row.used_count) || 0,
    source: row.source ?? row.source_type ?? 'admin',
    type: row.type ?? 'FAQ',
  }))
  return rows.filter((k) => !search || String(k.question).toLowerCase().includes(search.toLowerCase()))
}

export async function saveKnowledge(entry) {
  return api('/admin/knowledge', { method: 'POST', body: entry })
}

export async function deleteKnowledge() {
  throw new Error('Knowledge entries are archived from the content tools.')
}

export const getAutomations = async () => []

export async function toggleAutomation() {
  return null
}

export async function getReviews({ search = '', page = 1, pageSize = 25 } = {}) {
  const rows = listOr(await api('/ratings'))
  const filtered = search
    ? rows.filter((r) => `${r.guest_name ?? ''} ${r.comment ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    : rows
  return pageWrap(filtered, { page, pageSize })
}

export const getAllReviews = async () => listOr(await api('/ratings'))

export async function setReviewStatus(id, status) {
  return api(`/ratings/${id}/status`, { method: 'POST', body: { status } })
}

export async function getNotifications() {
  const data = await api('/notifications')
  return Array.isArray(data) ? data : data?.items ?? []
}

const shapeInboxItem = (row) => {
  if (!row || typeof row !== 'object') return null
  return {
    id: row.id,
    title: row.title ?? 'Notification',
    message: row.message ?? '',
    type: row.type ?? 'info',
    link: row.link ?? null,
    read: Boolean(row.read),
    createdAt: row.createdAt ?? row.created_at ?? null,
    entityType: row.entityType ?? row.entity_type ?? null,
    entityId: row.entityId ?? row.entity_id ?? null,
  }
}

export async function getInbox() {
  const data = await api('/notifications')
  const items = (Array.isArray(data) ? data : data?.items ?? []).map(shapeInboxItem).filter(Boolean)
  return {
    items,
    unread: Number(data?.unread) || items.filter((row) => !row.read).length,
  }
}

export async function createNotification(input) {
  return api('/admin/notifications', { method: 'POST', body: input })
}

export async function markNotificationRead(id) {
  return api(`/notifications/${id}/read`, { method: 'POST', body: {} })
}

export async function markAllInboxRead() {
  return api('/notifications/read-all', { method: 'POST', body: {} })
}

export async function getContent({ search = '' } = {}) {
  const rows = listOr(await api('/admin/content'))
  return rows.filter((c) => !search || String(c.title ?? '').toLowerCase().includes(search.toLowerCase()))
}

export async function updateContent(id, patch) {
  return api(`/admin/content/${id}`, { method: 'PATCH', body: patch })
}

export async function reorderContent() {
  return getContent()
}

export async function getMedia() {
  return listOr(await api('/admin/media'))
}

export async function addMedia() {
  throw new Error('Media uploads use the operations upload endpoint.')
}

export async function updateMedia() {
  return null
}

export async function deleteMedia() {
  throw new Error('Media is archived by the content team.')
}

export async function getMe() {
  return api('/admin/me')
}

export async function updateMe(patch) {
  return api('/admin/me', { method: 'PATCH', body: patch })
}

export async function uploadMyAvatar({ mimeType, base64 }) {
  return api('/admin/me/avatar', { method: 'POST', body: { mimeType, base64 } })
}

export async function removeMyAvatar() {
  return api('/admin/me/avatar', { method: 'DELETE' })
}

export async function changeMyPassword({ currentPassword, newPassword }) {
  return api('/admin/me/password', { method: 'POST', body: { currentPassword, newPassword } })
}

export const getAdminUsers = async () => api('/admin/users')

export async function saveAdminUser() {
  throw new Error('Admin users are invited from operations settings.')
}

export async function removeAdminUser() {
  throw new Error('Admin users are removed from operations settings.')
}

export async function getAudit({ page = 1, pageSize = 25 } = {}) {
  const data = await api('/admin/audit')
  return pageWrap(listOr(data), { page, pageSize })
}

export const getSettings = async () => {
  const raw = (await api('/admin/settings').catch(() => ({}))) ?? {}
  return mergeSettings(raw)
}

export async function updateSettings(section, patch) {
  return api(`/admin/settings/${section}`, { method: 'PUT', body: patch })
}

export async function getOverview() {
  const data = await api('/admin/overview')
  const totals = data?.totals ?? {}
  return {
    ...data,
    totals: {
      guests: 0,
      activeGuests: 0,
      upcomingGuests: 0,
      hosts: 0,
      activeHosts: 0,
      properties: 0,
      activeProperties: 0,
      partners: 0,
      approvedPartners: 0,
      activeRequests: 0,
      revenue: 0,
      netRevenue: 0,
      partnerClicks: 0,
      ...totals,
    },
    attention: Array.isArray(data?.attention) ? data.attention : [],
    today: {
      date: new Date().toISOString().slice(0, 10),
      newGuests: 0,
      newHosts: 0,
      newPartners: 0,
      newRequests: 0,
      completedOrders: 0,
      payments: 0,
      refunds: 0,
      conversations: 0,
      partnerClicks: 0,
      conversations: 0,
      messages: 0,
      revenue: 0,
      ...(data?.today ?? {}),
    },
  }
}

export async function getInsightSeries(metric = 'conversations', range = '30d') {
  try {
    const rows = await api(`/admin/insights/series?metric=${encodeURIComponent(metric)}&range=${encodeURIComponent(range)}`)
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      label: String(row?.label ?? ''),
      value: Number(row?.value) || 0,
    }))
  } catch {
    return []
  }
}

export async function globalSearch(term) {
  return api(`/admin/search?q=${encodeURIComponent(term)}`)
}

export async function getSchedule() {
  const [ordersRaw, transfersRaw] = await Promise.all([
    api('/grocery').catch(() => []),
    api('/transfers').catch(() => []),
  ])
  const orders = shapeOrders(listOr(ordersRaw))
  const transfers = shapeTransfers(listOr(transfersRaw))
  return {
    today: new Date().toISOString().slice(0, 10),
    transfers: transfers.filter((t) => !['cancelled', 'no_show', 'completed'].includes(t.status)).slice(0, 8),
    deliveries: orders.filter((o) => ['confirmed', 'paid', 'shopping', 'on_the_way'].includes(o.status)).slice(0, 8),
    activeOrders: orders.filter((o) => ['pending', 'shopping', 'on_the_way'].includes(o.status)).length,
  }
}

export const getRecentAudit = async (limit = 12) => {
  const data = await getAudit({ page: 1, pageSize: limit })
  return data.rows
}
