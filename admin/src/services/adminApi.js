import { request, clone, notFound, publish, subscribe } from './mockClient'
import { readStore, writeStore, removeStore, STORAGE_KEYS } from '../utils/storage'

import { mockGuests, guestStatus } from '../data/guests'
import { mockHosts } from '../data/hosts'
import { mockProperties } from '../data/properties'
import { mockPartners } from '../data/partners'
import { mockCategories } from '../data/localGuide'
import { mockOrders, GROCERY_STATUSES } from '../data/orders'
import { mockTransfers, TRANSFER_STATUSES } from '../data/transfers'
import { mockPayments, mockRefunds } from '../data/payments'
import { mockConversations } from '../data/conversations'
import { mockKnowledge, mockAutomations } from '../data/knowledge'
import { mockReviews } from '../data/reviews'
import { mockNotifications } from '../data/notifications'
import { mockContent, mockMedia } from '../data/content'
import { mockAdminUsers } from '../data/adminUsers'
import { mockAudit } from '../data/audit'
import { DEFAULT_SETTINGS } from '../data/settings'

/**
 * The single mock backend for the admin panel.
 *
 * Every collection follows the same shape: seed fixtures on first run, then a
 * locally persisted copy so an approval or a status change survives a refresh.
 * `resetAll()` puts the shipped data back.
 *
 * Nothing here talks to a network. When a real API arrives, this file is the
 * seam — the components never see anything but the promises it returns.
 */

/* --------------------------- Persisted tables ---------------------------- */

const TABLES = {
  guests: { key: STORAGE_KEYS.guests, seed: mockGuests },
  hosts: { key: STORAGE_KEYS.hosts, seed: mockHosts },
  properties: { key: STORAGE_KEYS.properties, seed: mockProperties },
  partners: { key: STORAGE_KEYS.partners, seed: mockPartners },
  categories: { key: STORAGE_KEYS.categories, seed: mockCategories },
  orders: { key: STORAGE_KEYS.orders, seed: mockOrders },
  transfers: { key: STORAGE_KEYS.transfers, seed: mockTransfers },
  payments: { key: STORAGE_KEYS.payments, seed: mockPayments },
  refunds: { key: 'refunds', seed: mockRefunds },
  conversations: { key: 'conversations', seed: mockConversations },
  knowledge: { key: STORAGE_KEYS.knowledge, seed: mockKnowledge },
  automations: { key: STORAGE_KEYS.automation, seed: mockAutomations },
  reviews: { key: STORAGE_KEYS.reviews, seed: mockReviews },
  notifications: { key: STORAGE_KEYS.notifications, seed: mockNotifications },
  content: { key: STORAGE_KEYS.content, seed: mockContent },
  media: { key: STORAGE_KEYS.media, seed: mockMedia },
  adminUsers: { key: STORAGE_KEYS.adminUsers, seed: mockAdminUsers },
  audit: { key: STORAGE_KEYS.audit, seed: mockAudit },
}

const db = Object.fromEntries(
  Object.entries(TABLES).map(([name, { key, seed }]) => [name, readStore(key, null) ?? clone(seed)]),
)

let settings = { ...clone(DEFAULT_SETTINGS), ...(readStore(STORAGE_KEYS.settings) ?? {}) }

const persist = (name) => {
  writeStore(TABLES[name].key, db[name])
  publish(name, db[name])
}

export function resetAll() {
  Object.entries(TABLES).forEach(([name, { key, seed }]) => {
    db[name] = clone(seed)
    removeStore(key)
    publish(name, db[name])
  })
  settings = clone(DEFAULT_SETTINGS)
  removeStore(STORAGE_KEYS.settings)
  publish('settings', settings)
}

export { subscribe }

/* ------------------------------ Audit trail ------------------------------ */

let actor = { id: 'adm_001', name: 'Alicia Brandt', role: 'super_admin' }

export const setAuditActor = (next) => {
  if (next) actor = next
}

/**
 * Append to the audit log. Called by every mutation below rather than by the
 * components, so an action cannot be performed without being recorded.
 */
export function recordAudit({ action, entity, entityId, detail = '', status = 'success' }) {
  db.audit = [
    {
      id: `aud_live_${db.audit.length + 1}_${entityId}`,
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action,
      entity,
      entityId,
      status,
      detail,
      ip: '—',
      at: new Date().toISOString(),
    },
    ...db.audit,
  ]
  persist('audit')
}

/* ------------------------------ Generic read ----------------------------- */

const list = (name) => clone(db[name])

const paginate = (rows, { page = 1, pageSize = 25 } = {}) => ({
  rows: rows.slice((page - 1) * pageSize, page * pageSize),
  total: rows.length,
  page,
  pageSize,
  pages: Math.max(1, Math.ceil(rows.length / pageSize)),
})

const matches = (row, term, fields) => {
  if (!term) return true
  const needle = term.trim().toLowerCase()
  return fields.some((f) => String(row[f] ?? '').toLowerCase().includes(needle))
}

/* --------------------------------- Guests -------------------------------- */

export async function getGuests({ search = '', status = 'all', page = 1, pageSize = 25, sort = 'checkIn' } = {}) {
  return request(() => {
    let rows = db.guests.map((g) => ({ ...g, status: guestStatus(g) }))
    if (status !== 'all') rows = rows.filter((g) => g.status === status)
    rows = rows.filter((g) => matches(g, search, ['name', 'email', 'phone', 'propertyName', 'hostName']))
    rows.sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : b.checkIn.localeCompare(a.checkIn)))
    return paginate(clone(rows), { page, pageSize })
  }, { label: 'the guest list' })
}

export async function getGuest(id) {
  return request(() => {
    const guest = db.guests.find((g) => g.id === id)
    if (!guest) throw notFound('that guest')
    return {
      guest: { ...clone(guest), status: guestStatus(guest) },
      orders: clone(db.orders.filter((o) => o.guestId === id)),
      transfers: clone(db.transfers.filter((t) => t.guestId === id)),
      payments: clone(db.payments.filter((p) => p.guestId === id)),
      conversations: clone(db.conversations.filter((c) => c.guestId === id)),
      reviews: clone(db.reviews.filter((r) => r.guestId === id)),
    }
  }, { label: 'that guest' })
}

export async function updateGuest(id, patch) {
  return request(() => {
    const index = db.guests.findIndex((g) => g.id === id)
    if (index < 0) throw notFound('that guest')
    db.guests[index] = { ...db.guests[index], ...patch }
    persist('guests')
    recordAudit({ action: 'Edited guest information', entity: 'Guest', entityId: id })
    return clone(db.guests[index])
  }, { label: 'that guest' })
}

/* --------------------------------- Hosts --------------------------------- */

const withPropertyCount = (host) => ({
  ...host,
  propertyCount: db.properties.filter((p) => p.hostId === host.id).length,
})

export async function getHosts({ search = '', status = 'all', page = 1, pageSize = 25 } = {}) {
  return request(() => {
    let rows = db.hosts.map(withPropertyCount)
    if (status !== 'all') rows = rows.filter((h) => h.status === status)
    rows = rows.filter((h) => matches(h, search, ['name', 'email', 'phone', 'company', 'town']))
    return paginate(clone(rows), { page, pageSize })
  }, { label: 'the host list' })
}

export async function getHost(id) {
  return request(() => {
    const host = db.hosts.find((h) => h.id === id)
    if (!host) throw notFound('that host')
    const properties = db.properties.filter((p) => p.hostId === id)
    const propertyIds = properties.map((p) => p.id)
    return {
      host: clone(withPropertyCount(host)),
      properties: clone(properties),
      guests: clone(db.guests.filter((g) => propertyIds.includes(g.propertyId)).map((g) => ({ ...g, status: guestStatus(g) }))),
      payments: clone(db.payments.filter((p) => p.hostId === id)),
      reviews: clone(db.reviews.filter((r) => propertyIds.includes(r.propertyId))),
    }
  }, { label: 'that host' })
}

export async function setHostStatus(id, status, reason = '') {
  return request(() => {
    const index = db.hosts.findIndex((h) => h.id === id)
    if (index < 0) throw notFound('that host')
    db.hosts[index] = { ...db.hosts[index], status, notes: reason || db.hosts[index].notes }
    persist('hosts')
    const verb = { active: 'Approved host', suspended: 'Suspended host', rejected: 'Rejected host', pending: 'Reset host to pending' }[status]
    recordAudit({ action: verb ?? 'Updated host', entity: 'Host', entityId: id, detail: reason })
    return clone(db.hosts[index])
  }, { label: 'that host' })
}

/* ------------------------------- Properties ------------------------------ */

const withGuestCount = (property) => ({
  ...property,
  currentGuests: db.guests.filter((g) => g.propertyId === property.id && guestStatus(g) === 'active').length,
})

export async function getProperties({ search = '', status = 'all', hostId = null, page = 1, pageSize = 25 } = {}) {
  return request(() => {
    let rows = db.properties.map(withGuestCount)
    if (status !== 'all') rows = rows.filter((p) => p.status === status)
    if (hostId) rows = rows.filter((p) => p.hostId === hostId)
    rows = rows.filter((p) => matches(p, search, ['name', 'town', 'address', 'hostName', 'type']))
    return paginate(clone(rows), { page, pageSize })
  }, { label: 'the property list' })
}

export async function getProperty(id) {
  return request(() => {
    const property = db.properties.find((p) => p.id === id)
    if (!property) throw notFound('that property')
    const guests = db.guests.filter((g) => g.propertyId === id).map((g) => ({ ...g, status: guestStatus(g) }))
    return {
      property: clone(withGuestCount(property)),
      host: clone(db.hosts.find((h) => h.id === property.hostId) ?? null),
      guests: clone(guests),
      orders: clone(db.orders.filter((o) => o.propertyId === id)),
      transfers: clone(db.transfers.filter((t) => t.propertyId === id)),
      conversations: clone(db.conversations.filter((c) => c.propertyId === id)),
    }
  }, { label: 'that property' })
}

export async function updateProperty(id, patch) {
  return request(() => {
    const index = db.properties.findIndex((p) => p.id === id)
    if (index < 0) throw notFound('that property')
    db.properties[index] = { ...db.properties[index], ...patch }
    persist('properties')
    recordAudit({ action: 'Updated property', entity: 'Property', entityId: id })
    return clone(db.properties[index])
  }, { label: 'that property' })
}

/* -------------------------------- Partners ------------------------------- */

export async function getPartners({ search = '', status = 'all', categoryId = null, featured = null, page = 1, pageSize = 25, sort = 'recent' } = {}) {
  return request(() => {
    let rows = [...db.partners]
    if (status !== 'all') rows = rows.filter((p) => p.status === status)
    if (categoryId) rows = rows.filter((p) => p.categoryId === categoryId)
    if (featured !== null) rows = rows.filter((p) => p.featured === featured)
    rows = rows.filter((p) => matches(p, search, ['name', 'owner', 'email', 'town', 'phone']))
    rows.sort((a, b) =>
      sort === 'views'
        ? b.stats.views - a.stats.views
        : sort === 'name'
          ? a.name.localeCompare(b.name)
          : String(b.submittedAt).localeCompare(String(a.submittedAt)),
    )
    return paginate(clone(rows), { page, pageSize })
  }, { label: 'the partner list' })
}

export async function getPartner(id) {
  return request(() => {
    const partner = db.partners.find((p) => p.id === id)
    if (!partner) throw notFound('that partner')
    return {
      partner: clone(partner),
      category: clone(db.categories.find((c) => c.id === partner.categoryId) ?? null),
      reviews: clone(db.reviews.filter((r) => r.partnerId === id)),
    }
  }, { label: 'that partner' })
}

export async function setPartnerStatus(id, status, reason = '') {
  return request(() => {
    const index = db.partners.findIndex((p) => p.id === id)
    if (index < 0) throw notFound('that partner')
    const partner = db.partners[index]

    db.partners[index] = {
      ...partner,
      status,
      reason: reason || (status === 'approved' ? undefined : partner.reason),
      // Approval is what makes a listing visible to guests; everything else hides it.
      published: status === 'approved' ? settings.business.autoPublishApprovedPartners : false,
      featured: status === 'approved' ? partner.featured : false,
      reviewedAt: new Date().toISOString(),
    }
    persist('partners')

    const verb = {
      approved: 'Approved partner', rejected: 'Rejected partner',
      suspended: 'Suspended partner', pending: 'Returned partner to review',
    }[status]
    recordAudit({ action: verb ?? 'Updated partner', entity: 'Partner', entityId: id, detail: reason })
    return clone(db.partners[index])
  }, { label: 'that partner' })
}

export async function updatePartner(id, patch) {
  return request(() => {
    const index = db.partners.findIndex((p) => p.id === id)
    if (index < 0) throw notFound('that partner')
    db.partners[index] = { ...db.partners[index], ...patch }
    persist('partners')
    const action = 'featured' in patch
      ? patch.featured ? 'Featured partner' : 'Unfeatured partner'
      : 'published' in patch
        ? patch.published ? 'Published listing' : 'Unpublished listing'
        : 'Updated partner'
    recordAudit({ action, entity: 'Partner', entityId: id })
    return clone(db.partners[index])
  }, { label: 'that partner' })
}

/* ------------------------------- Categories ------------------------------ */

export async function getCategories() {
  return request(() => {
    const counts = new Map()
    db.partners.forEach((p) => counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1))
    return clone(
      [...db.categories]
        .sort((a, b) => a.order - b.order)
        .map((c) => ({ ...c, listings: counts.get(c.id) ?? 0 })),
    )
  }, { label: 'the Local Guide categories' })
}

export async function saveCategory(category) {
  return request(() => {
    if (category.id) {
      const index = db.categories.findIndex((c) => c.id === category.id)
      if (index < 0) throw notFound('that category')
      db.categories[index] = { ...db.categories[index], ...category }
      recordAudit({ action: 'Updated category', entity: 'Category', entityId: category.id })
    } else {
      const id = `cat_${category.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
      db.categories.push({
        ...category,
        id,
        slug: category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        order: db.categories.length + 1,
        enabled: true,
        listings: 0,
      })
      recordAudit({ action: 'Created category', entity: 'Category', entityId: id })
    }
    persist('categories')
    return clone(db.categories)
  }, { label: 'that category' })
}

export async function deleteCategory(id) {
  return request(() => {
    const inUse = db.partners.filter((p) => p.categoryId === id).length
    if (inUse > 0) {
      const error = new Error(
        `${inUse} listing${inUse === 1 ? '' : 's'} still use this category. Move them first, or disable the category instead of deleting it.`,
      )
      error.code = 'IN_USE'
      throw error
    }
    db.categories = db.categories.filter((c) => c.id !== id)
    persist('categories')
    recordAudit({ action: 'Deleted category', entity: 'Category', entityId: id })
    return clone(db.categories)
  }, { label: 'that category' })
}

export async function reorderCategory(id, direction) {
  return request(() => {
    const sorted = [...db.categories].sort((a, b) => a.order - b.order)
    const index = sorted.findIndex((c) => c.id === id)
    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || swapWith < 0 || swapWith >= sorted.length) return clone(sorted)
    const a = sorted[index]
    const b = sorted[swapWith]
    const tmp = a.order
    a.order = b.order
    b.order = tmp
    db.categories = sorted
    persist('categories')
    recordAudit({ action: 'Reordered categories', entity: 'Category', entityId: id })
    return clone([...db.categories].sort((x, y) => x.order - y.order))
  }, { label: 'the categories' })
}

/* ----------------------------- Grocery orders ---------------------------- */

export async function getOrders({ search = '', status = 'all', page = 1, pageSize = 25 } = {}) {
  return request(() => {
    let rows = [...db.orders]
    if (Array.isArray(status)) rows = rows.filter((o) => status.includes(o.status))
    else if (status !== 'all') rows = rows.filter((o) => o.status === status)
    rows = rows.filter((o) => matches(o, search, ['id', 'guestName', 'propertyName', 'store', 'shopper']))
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return paginate(clone(rows), { page, pageSize })
  }, { label: 'the grocery orders' })
}

export async function getOrder(id) {
  return request(() => {
    const order = db.orders.find((o) => o.id === id)
    if (!order) throw notFound('that order')
    return {
      order: clone(order),
      payments: clone(db.payments.filter((p) => p.relatedId === id)),
      guest: clone(db.guests.find((g) => g.id === order.guestId) ?? null),
    }
  }, { label: 'that order' })
}

export async function setOrderStatus(id, status, extra = {}) {
  return request(() => {
    const index = db.orders.findIndex((o) => o.id === id)
    if (index < 0) throw notFound('that order')
    if (!GROCERY_STATUSES[status]) throw new Error(`${status} is not a grocery status.`)

    db.orders[index] = {
      ...db.orders[index],
      ...extra,
      status,
      updatedAt: new Date().toISOString(),
      shopper: db.orders[index].shopper ?? (status === 'shopping' ? 'Marcus B.' : null),
    }
    persist('orders')
    recordAudit({
      action: `Set order to ${GROCERY_STATUSES[status].label.toLowerCase()}`,
      entity: 'Grocery order',
      entityId: id,
      detail: extra.cancelReason ?? '',
    })
    return clone(db.orders[index])
  }, { label: 'that order' })
}

/* ---------------------------- Airport transfers -------------------------- */

export async function getTransfers({ search = '', status = 'all', airport = 'all', page = 1, pageSize = 25 } = {}) {
  return request(() => {
    let rows = [...db.transfers]
    if (Array.isArray(status)) rows = rows.filter((t) => status.includes(t.status))
    else if (status !== 'all') rows = rows.filter((t) => t.status === status)
    if (airport !== 'all') rows = rows.filter((t) => t.airport === airport)
    rows = rows.filter((t) => matches(t, search, ['id', 'guestName', 'propertyName', 'flightNumber', 'driver']))
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return paginate(clone(rows), { page, pageSize })
  }, { label: 'the transfers' })
}

export async function getTransfer(id) {
  return request(() => {
    const transfer = db.transfers.find((t) => t.id === id)
    if (!transfer) throw notFound('that transfer')
    return {
      transfer: clone(transfer),
      payments: clone(db.payments.filter((p) => p.relatedId === id)),
      guest: clone(db.guests.find((g) => g.id === transfer.guestId) ?? null),
      refund: clone(db.refunds.find((r) => r.relatedId === id) ?? null),
    }
  }, { label: 'that transfer' })
}

export async function setTransferStatus(id, status, extra = {}) {
  return request(() => {
    const index = db.transfers.findIndex((t) => t.id === id)
    if (index < 0) throw notFound('that transfer')
    if (!TRANSFER_STATUSES[status]) throw new Error(`${status} is not a transfer status.`)

    db.transfers[index] = {
      ...db.transfers[index],
      ...extra,
      status,
      driver: extra.driver ?? db.transfers[index].driver ?? (status === 'driver_assigned' ? 'Anthony P.' : null),
    }
    persist('transfers')

    /* Capture is what "completed" means financially — the hold becomes a
       charge. Reflecting it here keeps finance and operations in agreement. */
    if (status === 'completed') {
      const p = db.payments.findIndex((x) => x.relatedId === id && x.type === 'transfer')
      if (p >= 0) {
        db.payments[p] = { ...db.payments[p], status: 'captured', capturedAt: new Date().toISOString() }
        persist('payments')
      }
    }

    recordAudit({
      action: `Set transfer to ${TRANSFER_STATUSES[status].label.toLowerCase()}`,
      entity: 'Transfer',
      entityId: id,
      detail: extra.cancelReason ?? '',
    })
    return clone(db.transfers[index])
  }, { label: 'that transfer' })
}

/* -------------------------------- Payments ------------------------------- */

export async function getPayments({ search = '', status = 'all', type = 'all', page = 1, pageSize = 25 } = {}) {
  return request(() => {
    let rows = [...db.payments]
    if (status !== 'all') rows = rows.filter((p) => p.status === status)
    if (type !== 'all') rows = rows.filter((p) => p.type === type)
    rows = rows.filter((p) => matches(p, search, ['id', 'guestName', 'relatedLabel', 'method']))
    return paginate(clone(rows), { page, pageSize })
  }, { label: 'the payments' })
}

export async function getPayment(id) {
  return request(() => {
    const payment = db.payments.find((p) => p.id === id)
    if (!payment) throw notFound('that payment')
    return {
      payment: clone(payment),
      refund: clone(db.refunds.find((r) => r.paymentId === id) ?? null),
    }
  }, { label: 'that payment' })
}

export async function refundPayment(id, { amount, reason }) {
  return request(() => {
    const index = db.payments.findIndex((p) => p.id === id)
    if (index < 0) throw notFound('that payment')
    const payment = db.payments[index]

    db.payments[index] = { ...payment, status: 'refunded', refundedAt: new Date().toISOString() }
    persist('payments')

    db.refunds = [
      {
        id: `ref_live_${db.refunds.length + 1}`,
        paymentId: id,
        guestId: payment.guestId,
        guestName: payment.guestName,
        type: payment.type,
        originalAmount: payment.amount,
        fee: Math.max(0, payment.amount - amount),
        amount,
        reason,
        source: 'manual',
        status: 'processing',
        relatedId: payment.relatedId,
        relatedLink: payment.relatedLink,
        createdAt: new Date().toISOString(),
      },
      ...db.refunds,
    ]
    persist('refunds')

    recordAudit({ action: 'Issued refund', entity: 'Payment', entityId: id, detail: reason })
    return clone(db.payments[index])
  }, { label: 'that refund' })
}

export async function getRefunds({ search = '', status = 'all', page = 1, pageSize = 25 } = {}) {
  return request(() => {
    let rows = [...db.refunds]
    if (status !== 'all') rows = rows.filter((r) => r.status === status)
    rows = rows.filter((r) => matches(r, search, ['id', 'guestName', 'reason', 'relatedId']))
    return paginate(clone(rows), { page, pageSize })
  }, { label: 'the refunds' })
}

export async function setRefundStatus(id, status) {
  return request(() => {
    const index = db.refunds.findIndex((r) => r.id === id)
    if (index < 0) throw notFound('that refund')
    db.refunds[index] = { ...db.refunds[index], status }
    persist('refunds')
    recordAudit({ action: `Set refund to ${status}`, entity: 'Refund', entityId: id })
    return clone(db.refunds[index])
  }, { label: 'that refund' })
}

export async function getTips({ search = '', page = 1, pageSize = 25 } = {}) {
  return request(() => {
    let rows = db.payments.filter((p) => p.type === 'tip')
    rows = rows.filter((p) => matches(p, search, ['guestName', 'relatedLabel', 'recipient', 'service']))
    return paginate(clone(rows), { page, pageSize })
  }, { label: 'the tips' })
}

/* ----------------------------- Subscriptions ----------------------------- */

export async function getSubscriptions({ search = '', status = 'all', page = 1, pageSize = 25 } = {}) {
  return request(() => {
    let rows = db.hosts.map((h) => ({
      id: `sub_${h.id}`,
      hostId: h.id,
      hostName: h.name,
      hostEmail: h.email,
      company: h.company,
      properties: db.properties.filter((p) => p.hostId === h.id).length,
      ...h.subscription,
      planName: settings.business.plans.find((p) => p.id === h.subscription.planId)?.name ?? 'Custom',
    }))
    if (status !== 'all') rows = rows.filter((s) => s.status === status)
    rows = rows.filter((s) => matches(s, search, ['hostName', 'hostEmail', 'planName', 'company']))
    return paginate(clone(rows), { page, pageSize })
  }, { label: 'the subscriptions' })
}

export async function setSubscriptionStatus(hostId, status) {
  return request(() => {
    const index = db.hosts.findIndex((h) => h.id === hostId)
    if (index < 0) throw notFound('that host')
    db.hosts[index] = {
      ...db.hosts[index],
      subscription: { ...db.hosts[index].subscription, status },
    }
    persist('hosts')
    recordAudit({ action: `Set subscription to ${status}`, entity: 'Subscription', entityId: hostId })
    return clone(db.hosts[index])
  }, { label: 'that subscription' })
}

/* -------------------------------- Vitoria -------------------------------- */

export async function getConversations({ search = '', status = 'all', topic = 'all', page = 1, pageSize = 25 } = {}) {
  return request(() => {
    let rows = [...db.conversations]
    if (status !== 'all') rows = rows.filter((c) => c.status === status)
    if (topic !== 'all') rows = rows.filter((c) => c.topic === topic)
    rows = rows.filter((c) => matches(c, search, ['id', 'guestName', 'propertyName', 'topic']))
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return paginate(clone(rows), { page, pageSize })
  }, { label: 'the conversations' })
}

export async function getConversation(id) {
  return request(() => {
    const conversation = db.conversations.find((c) => c.id === id)
    if (!conversation) throw notFound('that conversation')
    return clone(conversation)
  }, { label: 'that conversation' })
}

export const getAllConversations = async () =>
  request(() => clone(db.conversations), { label: 'the AI activity' })

export async function getKnowledge({ search = '', source = 'all', type = 'all' } = {}) {
  return request(() => {
    let rows = [...db.knowledge]
    if (source !== 'all') rows = rows.filter((k) => k.source === source)
    if (type !== 'all') rows = rows.filter((k) => k.type === type)
    rows = rows.filter((k) => matches(k, search, ['question', 'answer', 'type']))
    return clone(rows)
  }, { label: 'the knowledge base' })
}

export async function saveKnowledge(entry) {
  return request(() => {
    if (entry.id) {
      const index = db.knowledge.findIndex((k) => k.id === entry.id)
      if (index < 0) throw notFound('that entry')
      db.knowledge[index] = { ...db.knowledge[index], ...entry, updatedAt: new Date().toISOString() }
      recordAudit({ action: 'Updated knowledge entry', entity: 'Knowledge', entityId: entry.id })
    } else {
      const id = `kb_live_${db.knowledge.length + 1}`
      db.knowledge.unshift({
        ...entry,
        id,
        enabled: true,
        usedCount: 0,
        author: actor.name,
        updatedAt: new Date().toISOString(),
      })
      recordAudit({ action: 'Created knowledge entry', entity: 'Knowledge', entityId: id })
    }
    persist('knowledge')
    return clone(db.knowledge)
  }, { label: 'that entry' })
}

export async function deleteKnowledge(id) {
  return request(() => {
    db.knowledge = db.knowledge.filter((k) => k.id !== id)
    persist('knowledge')
    recordAudit({ action: 'Deleted knowledge entry', entity: 'Knowledge', entityId: id })
    return clone(db.knowledge)
  }, { label: 'that entry' })
}

export const getAutomations = async () =>
  request(() => clone(db.automations), { label: 'the automations' })

export async function toggleAutomation(id, enabled) {
  return request(() => {
    const index = db.automations.findIndex((a) => a.id === id)
    if (index < 0) throw notFound('that automation')
    db.automations[index] = { ...db.automations[index], enabled, nextRun: enabled ? db.automations[index].nextRun : 'Paused' }
    persist('automations')
    recordAudit({ action: enabled ? 'Enabled automation' : 'Disabled automation', entity: 'Automation', entityId: id })
    return clone(db.automations[index])
  }, { label: 'that automation' })
}

/* -------------------------------- Reviews -------------------------------- */

export async function getReviews({ search = '', rating = 'all', status = 'all', subject = 'all', page = 1, pageSize = 25 } = {}) {
  return request(() => {
    let rows = [...db.reviews]
    if (rating !== 'all') rows = rows.filter((r) => r.rating === Number(rating))
    if (status !== 'all') rows = rows.filter((r) => r.status === status)
    if (subject !== 'all') rows = rows.filter((r) => r.subject === subject)
    rows = rows.filter((r) => matches(r, search, ['guestName', 'comment', 'propertyName', 'partnerName']))
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return paginate(clone(rows), { page, pageSize })
  }, { label: 'the reviews' })
}

export const getAllReviews = async () => request(() => clone(db.reviews), { label: 'the reviews' })

export async function setReviewStatus(id, status) {
  return request(() => {
    const index = db.reviews.findIndex((r) => r.id === id)
    if (index < 0) throw notFound('that review')
    db.reviews[index] = { ...db.reviews[index], status }
    persist('reviews')
    const verb = { hidden: 'Hid review', published: 'Restored review', flagged: 'Flagged review' }[status]
    recordAudit({ action: verb ?? 'Updated review', entity: 'Review', entityId: id })
    return clone(db.reviews[index])
  }, { label: 'that review' })
}

/* ----------------------------- Notifications ----------------------------- */

export async function getNotifications({ search = '', audience = 'all', status = 'all' } = {}) {
  return request(() => {
    let rows = [...db.notifications]
    if (audience !== 'all') rows = rows.filter((n) => n.audience === audience)
    if (status !== 'all') rows = rows.filter((n) => n.status === status)
    rows = rows.filter((n) => matches(n, search, ['title', 'message']))
    return clone(rows)
  }, { label: 'the notifications' })
}

export async function createNotification(input) {
  return request(() => {
    const id = `ntf_live_${db.notifications.length + 1}`
    db.notifications.unshift({
      ...input,
      id,
      status: input.status ?? 'draft',
      recipients: 0,
      opened: 0,
      read: false,
      sentAt: null,
      createdBy: actor.name,
      createdAt: new Date().toISOString(),
    })
    persist('notifications')
    recordAudit({ action: 'Created notification', entity: 'Notification', entityId: id })
    return clone(db.notifications)
  }, { label: 'that notification' })
}

export async function markNotificationRead(id) {
  return request(() => {
    const index = db.notifications.findIndex((n) => n.id === id)
    if (index < 0) throw notFound('that notification')
    db.notifications[index] = { ...db.notifications[index], read: true }
    persist('notifications')
    return clone(db.notifications[index])
  }, { label: 'that notification' })
}

/* -------------------------------- Content -------------------------------- */

export async function getContent({ search = '', type = 'all', published = 'all' } = {}) {
  return request(() => {
    let rows = [...db.content]
    if (type !== 'all') rows = rows.filter((c) => c.type === type)
    if (published !== 'all') rows = rows.filter((c) => c.published === (published === 'yes'))
    rows = rows.filter((c) => matches(c, search, ['title', 'note']))
    return clone(rows.sort((a, b) => a.order - b.order))
  }, { label: 'the content blocks' })
}

export async function updateContent(id, patch) {
  return request(() => {
    const index = db.content.findIndex((c) => c.id === id)
    if (index < 0) throw notFound('that block')
    db.content[index] = { ...db.content[index], ...patch, updatedBy: actor.name, updatedAt: new Date().toISOString() }
    persist('content')
    const action = 'published' in patch
      ? patch.published ? 'Published content block' : 'Unpublished content block'
      : 'Updated content block'
    recordAudit({ action, entity: 'Content', entityId: id })
    return clone(db.content[index])
  }, { label: 'that block' })
}

export async function reorderContent(id, direction) {
  return request(() => {
    const sorted = [...db.content].sort((a, b) => a.order - b.order)
    const index = sorted.findIndex((c) => c.id === id)
    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || swapWith < 0 || swapWith >= sorted.length) return clone(sorted)
    const tmp = sorted[index].order
    sorted[index].order = sorted[swapWith].order
    sorted[swapWith].order = tmp
    db.content = sorted
    persist('content')
    recordAudit({ action: 'Reordered content', entity: 'Content', entityId: id })
    return clone([...db.content].sort((a, b) => a.order - b.order))
  }, { label: 'the content blocks' })
}

/* --------------------------------- Media --------------------------------- */

export async function getMedia({ search = '', category = 'all', status = 'all' } = {}) {
  return request(() => {
    let rows = [...db.media]
    if (category !== 'all') rows = rows.filter((m) => m.category === category)
    if (status !== 'all') rows = rows.filter((m) => m.status === status)
    rows = rows.filter((m) => matches(m, search, ['name', 'category', 'usedBy']))
    return clone(rows)
  }, { label: 'the media library' })
}

export async function addMedia(input) {
  return request(() => {
    const id = `med_live_${db.media.length + 1}`
    db.media.unshift({
      ...input,
      id,
      usedBy: 'Unused',
      featured: false,
      status: 'active',
      uploadedBy: actor.name,
      uploadedAt: new Date().toISOString(),
    })
    persist('media')
    recordAudit({ action: 'Uploaded media', entity: 'Media', entityId: id })
    return clone(db.media)
  }, { label: 'that image' })
}

export async function updateMedia(id, patch) {
  return request(() => {
    const index = db.media.findIndex((m) => m.id === id)
    if (index < 0) throw notFound('that image')
    db.media[index] = { ...db.media[index], ...patch }
    persist('media')
    recordAudit({ action: 'featured' in patch ? 'Set featured image' : 'Updated media', entity: 'Media', entityId: id })
    return clone(db.media[index])
  }, { label: 'that image' })
}

export async function deleteMedia(id) {
  return request(() => {
    db.media = db.media.filter((m) => m.id !== id)
    persist('media')
    recordAudit({ action: 'Deleted media', entity: 'Media', entityId: id })
    return clone(db.media)
  }, { label: 'that image' })
}

/* ------------------------------ Admin users ------------------------------ */

export const getAdminUsers = async () =>
  request(() => clone(db.adminUsers), { label: 'the admin users' })

export async function saveAdminUser(user) {
  return request(() => {
    if (user.id) {
      const index = db.adminUsers.findIndex((u) => u.id === user.id)
      if (index < 0) throw notFound('that admin user')
      db.adminUsers[index] = { ...db.adminUsers[index], ...user }
      recordAudit({ action: 'Updated admin user', entity: 'Admin user', entityId: user.id })
    } else {
      const id = `adm_live_${db.adminUsers.length + 1}`
      db.adminUsers.push({
        ...user,
        id,
        status: 'invited',
        twoFactor: false,
        lastActiveAt: null,
        createdAt: new Date().toISOString(),
        actionsThisMonth: 0,
      })
      recordAudit({ action: 'Invited admin user', entity: 'Admin user', entityId: id })
    }
    persist('adminUsers')
    return clone(db.adminUsers)
  }, { label: 'that admin user' })
}

export async function removeAdminUser(id) {
  return request(() => {
    db.adminUsers = db.adminUsers.filter((u) => u.id !== id)
    persist('adminUsers')
    recordAudit({ action: 'Removed admin user', entity: 'Admin user', entityId: id })
    return clone(db.adminUsers)
  }, { label: 'that admin user' })
}

/* -------------------------------- Audit ---------------------------------- */

export async function getAudit({ search = '', entity = 'all', userId = 'all', page = 1, pageSize = 25 } = {}) {
  return request(() => {
    let rows = [...db.audit]
    if (entity !== 'all') rows = rows.filter((a) => a.entity === entity)
    if (userId !== 'all') rows = rows.filter((a) => a.userId === userId)
    rows = rows.filter((a) => matches(a, search, ['action', 'entity', 'entityId', 'userName']))
    return paginate(clone(rows), { page, pageSize })
  }, { label: 'the audit log' })
}

/* ------------------------------- Settings -------------------------------- */

export const getSettings = async () => request(() => clone(settings), { label: 'the settings' })

export async function updateSettings(section, patch) {
  return request(() => {
    settings = { ...settings, [section]: { ...settings[section], ...patch } }
    writeStore(STORAGE_KEYS.settings, settings)
    publish('settings', settings)
    recordAudit({ action: `Updated ${section} settings`, entity: 'Settings', entityId: `settings.${section}` })
    return clone(settings)
  }, { label: 'the settings' })
}

export const settingsNow = () => clone(settings)

/* ------------------------- Cross-cutting queries -------------------------- */

/** Everything the dashboard and the operations queue need, in one round trip. */
export async function getOverview() {
  return request(() => {
    const activeGuests = db.guests.filter((g) => guestStatus(g) === 'active')
    const upcoming = db.guests.filter((g) => guestStatus(g) === 'upcoming')
    const pendingPartners = db.partners.filter((p) => p.status === 'pending')
    const pendingHosts = db.hosts.filter((h) => h.status === 'pending')
    const pendingOrders = db.orders.filter((o) => o.status === 'pending')
    const pendingTransfers = db.transfers.filter((t) => t.status === 'pending')
    const failedPayments = db.payments.filter((p) => p.status === 'failed')
    const pendingRefunds = db.refunds.filter((r) => ['pending', 'processing'].includes(r.status))
    const flaggedReviews = db.reviews.filter((r) => r.status === 'flagged')
    const escalations = db.conversations.filter((c) => c.status === 'escalated')

    const captured = db.payments.filter((p) => p.status === 'captured')
    const revenue = captured.reduce((sum, p) => sum + p.amount, 0)
    const tips = captured.filter((p) => p.type === 'tip').reduce((sum, p) => sum + p.amount, 0)
    const refunded = db.refunds
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0)

    const partnerClicks = db.partners.reduce(
      (sum, p) => sum + p.stats.views + p.stats.websiteClicks + p.stats.phoneClicks + p.stats.directionsClicks,
      0,
    )

    return clone({
      totals: {
        guests: db.guests.length,
        activeGuests: activeGuests.length,
        upcomingGuests: upcoming.length,
        hosts: db.hosts.length,
        activeHosts: db.hosts.filter((h) => h.status === 'active').length,
        properties: db.properties.length,
        activeProperties: db.properties.filter((p) => p.status === 'active').length,
        partners: db.partners.length,
        approvedPartners: db.partners.filter((p) => p.status === 'approved').length,
        activeRequests:
          db.orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length +
          db.transfers.filter((t) => !['completed', 'cancelled', 'no_show'].includes(t.status)).length,
        revenue,
        tips,
        refunded,
        netRevenue: revenue - refunded,
        partnerClicks,
        conversations: db.conversations.length,
      },
      attention: [
        { id: 'partners', count: pendingPartners.length, label: 'partner applications awaiting approval', to: '/admin/partners?status=pending', tone: 'warn', icon: 'sparkles' },
        { id: 'orders', count: pendingOrders.length, label: 'grocery orders awaiting confirmation', to: '/admin/grocery?status=pending', tone: 'warn', icon: 'bag' },
        { id: 'transfers', count: pendingTransfers.length, label: 'airport transfers awaiting confirmation', to: '/admin/transfers?status=pending', tone: 'warn', icon: 'car' },
        { id: 'payments', count: failedPayments.length, label: 'failed payments', to: '/admin/payments?status=failed', tone: 'danger', icon: 'creditCard' },
        { id: 'refunds', count: pendingRefunds.length, label: 'refunds to process', to: '/admin/payments/refunds', tone: 'info', icon: 'refresh' },
        { id: 'reviews', count: flaggedReviews.length, label: 'flagged reviews', to: '/admin/reviews?status=flagged', tone: 'danger', icon: 'star' },
        { id: 'hosts', count: pendingHosts.length, label: 'hosts awaiting approval', to: '/admin/hosts?status=pending', tone: 'info', icon: 'building' },
        { id: 'escalations', count: escalations.length, label: 'Vitoria escalations to answer', to: '/admin/vitoria/conversations?status=escalated', tone: 'danger', icon: 'sparkles' },
      ].filter((item) => item.count > 0),
    })
  }, { label: 'the dashboard' })
}

/** Global search — one query, every entity that can be looked up by name. */
export async function globalSearch(term) {
  return request(() => {
    const needle = term.trim().toLowerCase()
    if (needle.length < 2) return []

    const hit = (row, fields) => fields.some((f) => String(row[f] ?? '').toLowerCase().includes(needle))
    const take = (rows, n = 4) => rows.slice(0, n)

    return clone([
      ...take(db.guests.filter((g) => hit(g, ['name', 'email', 'phone']))).map((g) => ({
        kind: 'Guest', id: g.id, title: g.name, subtitle: `${g.email} · ${g.propertyName}`, to: `/admin/guests/${g.id}`, icon: 'user',
      })),
      ...take(db.hosts.filter((h) => hit(h, ['name', 'email', 'company']))).map((h) => ({
        kind: 'Host', id: h.id, title: h.name, subtitle: h.company ?? h.email, to: `/admin/hosts/${h.id}`, icon: 'building',
      })),
      ...take(db.partners.filter((p) => hit(p, ['name', 'owner', 'email']))).map((p) => ({
        kind: 'Partner', id: p.id, title: p.name, subtitle: `${p.owner} · ${p.town}`, to: `/admin/partners/${p.id}`, icon: 'sparkles',
      })),
      ...take(db.properties.filter((p) => hit(p, ['name', 'address', 'hostName']))).map((p) => ({
        kind: 'Property', id: p.id, title: p.name, subtitle: `${p.town} · ${p.hostName}`, to: `/admin/properties/${p.id}`, icon: 'key',
      })),
      ...take(db.orders.filter((o) => hit(o, ['id', 'guestName']))).map((o) => ({
        kind: 'Grocery order', id: o.id, title: o.id, subtitle: `${o.guestName} · ${o.status.replace(/_/g, ' ')}`, to: `/admin/grocery/${o.id}`, icon: 'bag',
      })),
      ...take(db.transfers.filter((t) => hit(t, ['id', 'guestName', 'flightNumber']))).map((t) => ({
        kind: 'Transfer', id: t.id, title: t.id, subtitle: `${t.guestName} · ${t.airport} ${t.flightNumber}`, to: `/admin/transfers/${t.id}`, icon: 'car',
      })),
      ...take(db.payments.filter((p) => hit(p, ['id', 'guestName']))).map((p) => ({
        kind: 'Payment', id: p.id, title: p.id, subtitle: `${p.guestName} · $${p.amount}`, to: `/admin/payments?search=${p.id}`, icon: 'creditCard',
      })),
    ])
  }, { label: 'the search results' })
}

/** Today's operational schedule — what is physically happening in the field. */
export async function getSchedule() {
  return request(() => {
    const today = new Date().toISOString().slice(0, 10)
    return clone({
      today,
      transfers: db.transfers
        .filter((t) => !['cancelled', 'no_show', 'completed'].includes(t.status))
        .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate))
        .slice(0, 8),
      deliveries: db.orders
        .filter((o) => ['confirmed', 'paid', 'shopping', 'on_the_way'].includes(o.status))
        .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))
        .slice(0, 8),
      activeOrders: db.orders.filter((o) => ['pending', 'shopping', 'on_the_way'].includes(o.status)).length,
    })
  }, { label: 'today’s schedule' })
}

export const getRecentAudit = async (limit = 12) =>
  request(() => clone(db.audit.slice(0, limit)), { label: 'recent activity' })
