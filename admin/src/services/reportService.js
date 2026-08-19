import { formatCurrency } from '../utils/format'

/**
 * Report generation.
 *
 * The CSV is assembled in the browser from the records already loaded on the
 * screen, so a downloaded file matches what the operator is looking at.
 */

const EMPTY_STATS = {
  views: 0,
  websiteClicks: 0,
  phoneClicks: 0,
  directionsClicks: 0,
  conversations: 0,
  serviceRequests: 0,
}

const statsOf = (row) => ({ ...EMPTY_STATS, ...(row?.stats && typeof row.stats === 'object' ? row.stats : {}) })

const cell = (value) => {
  if (value == null || value === '') return '—'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  return '—'
}

const money = (value) => formatCurrency(value ?? 0)

export const REPORTS = [
  {
    id: 'guest_activity', name: 'Guest Activity Report', icon: 'users',
    blurb: 'Every guest in the period with their stay, conversations, requests and spend.',
    columns: ['Guest', 'Email', 'Property', 'Host', 'Arrival', 'Departure', 'Conversations', 'Requests', 'Rating'],
  },
  {
    id: 'host', name: 'Host Report', icon: 'building',
    blurb: 'Hosts, their properties, subscription state and guest satisfaction.',
    columns: ['Host', 'Company', 'Status', 'Properties', 'Plan', 'Subscription', 'Next billing', 'Satisfaction'],
  },
  {
    id: 'partner', name: 'Partner Performance Report', icon: 'sparkles',
    blurb: 'Referral activity per partner. Views and clicks only — no sales data exists.',
    columns: ['Partner', 'Category', 'Status', 'Profile views', 'Website clicks', 'Phone clicks', 'Directions', 'CTR'],
  },
  {
    id: 'grocery', name: 'Grocery Report', icon: 'bag',
    blurb: 'Orders, basket amounts, service fees, tips and delivery outcomes.',
    columns: ['Order', 'Guest', 'Property', 'Delivery date', 'Basket', 'Service fee', 'Tip', 'Status'],
  },
  {
    id: 'transfer', name: 'Airport Transfer Report', icon: 'car',
    blurb: 'Transfers by airport with vehicle, driver, amount and outcome.',
    columns: ['Transfer', 'Guest', 'Airport', 'Flight', 'Pickup', 'Vehicle', 'Amount', 'Status'],
  },
  {
    id: 'revenue', name: 'Revenue Report', icon: 'dollar',
    blurb: 'Captured payments by type, with refunds and net.',
    columns: ['Payment', 'Guest', 'Type', 'Amount', 'Status', 'Method', 'Created', 'Related'],
  },
  {
    id: 'vitoria', name: 'Vitoria Report', icon: 'sparkles',
    blurb: 'Conversation volume, topics, escalations and requests created.',
    columns: ['Conversation', 'Guest', 'Property', 'Topic', 'Language', 'Messages', 'Status', 'Created request'],
  },
  {
    id: 'referral', name: 'Referral Traffic Report', icon: 'navigation',
    blurb: 'Outbound interactions by category. Referral activity only.',
    columns: ['Category', 'Listings', 'Profile views', 'Website clicks', 'Phone clicks', 'Directions', 'CTR'],
  },
]

export const reportById = (id) => REPORTS.find((r) => r.id === id) ?? REPORTS[0]

const esc = (value) => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const toCsv = (columns, rows) =>
  [columns.map(esc).join(','), ...rows.map((row) => row.map(esc).join(','))].join('\n')

/** Build the rows for a report from the data already loaded on the page. */
export function buildReport(id, data) {
  const guests = Array.isArray(data?.guests) ? data.guests : []
  const hosts = Array.isArray(data?.hosts) ? data.hosts : []
  const partners = Array.isArray(data?.partners) ? data.partners : []
  const orders = Array.isArray(data?.orders) ? data.orders : []
  const transfers = Array.isArray(data?.transfers) ? data.transfers : []
  const payments = Array.isArray(data?.payments) ? data.payments : []
  const conversations = Array.isArray(data?.conversations) ? data.conversations : []
  const categories = Array.isArray(data?.categories) ? data.categories : []

  switch (id) {
    case 'guest_activity':
      return guests.map((g) => {
        const stats = statsOf(g)
        return [
          cell(g?.name), cell(g?.email), cell(g?.propertyName), cell(g?.hostName),
          cell(g?.checkIn), cell(g?.checkOut), cell(stats.conversations),
          cell(stats.serviceRequests), cell(g?.rating ?? '—'),
        ]
      })

    case 'host':
      return hosts.map((h) => {
        const subscription = h?.subscription && typeof h.subscription === 'object' ? h.subscription : {}
        return [
          cell(h?.name), cell(h?.company ?? '—'), cell(h?.status), cell(h?.propertyCount),
          cell(subscription.planId ?? subscription.planName ?? '—'),
          cell(subscription.status ?? '—'),
          cell(subscription.nextBillingDate ?? '—'),
          cell(h?.satisfaction ?? '—'),
        ]
      })

    case 'partner':
      return partners.map((p) => {
        const stats = statsOf(p)
        const clicks = Number(stats.websiteClicks) + Number(stats.phoneClicks) + Number(stats.directionsClicks)
        const views = Number(stats.views) || 0
        return [
          cell(p?.name), cell(p?.categoryId), cell(p?.status), cell(views),
          cell(stats.websiteClicks), cell(stats.phoneClicks), cell(stats.directionsClicks),
          views ? `${((clicks / views) * 100).toFixed(1)}%` : '0%',
        ]
      })

    case 'grocery':
      return orders.map((o) => [
        cell(o?.id), cell(o?.guestName), cell(o?.propertyName), cell(o?.deliveryDate),
        money(o?.actualAmount ?? o?.estimatedAmount), money(o?.serviceFee),
        o?.tipAmount ? money(o.tipAmount) : '—', cell(o?.status),
      ])

    case 'transfer':
      return transfers.map((t) => [
        cell(t?.id), cell(t?.guestName), cell(t?.airport), cell(t?.flightNumber),
        cell([t?.pickupDate, t?.pickupTime].filter(Boolean).join(' ') || '—'),
        cell(t?.vehicleName), money(t?.amount), cell(t?.status),
      ])

    case 'revenue':
      return payments.map((p) => [
        cell(p?.id), cell(p?.guestName ?? p?.guest_name), cell(p?.type),
        money(p?.amount ?? p?.amount_cents), cell(p?.status), cell(p?.method),
        cell(String(p?.createdAt ?? p?.created_at ?? '').slice(0, 10) || '—'),
        cell(p?.relatedLabel ?? p?.related_label ?? '—'),
      ])

    case 'vitoria':
      return conversations.map((c) => [
        cell(c?.id), cell(c?.guestName), cell(c?.propertyName), cell(c?.topic),
        cell(c?.language), cell(c?.messageCount), cell(c?.status),
        cell(c?.createdRequest?.label ?? '—'),
      ])

    case 'referral':
      return categories.filter(Boolean).map((cat) => {
        const inCategory = partners.filter((p) => p?.categoryId === cat?.id)
        const sum = (field) => inCategory.reduce((total, p) => total + Number(statsOf(p)[field] || 0), 0)
        const views = sum('views')
        const clicks = sum('websiteClicks') + sum('phoneClicks') + sum('directionsClicks')
        return [
          cell(cat?.name), inCategory.length, views, sum('websiteClicks'), sum('phoneClicks'),
          sum('directionsClicks'), views ? `${((clicks / views) * 100).toFixed(1)}%` : '0%',
        ]
      })

    default:
      return []
  }
}

/**
 * Hand the CSV to the browser. Guarded because jsdom (and any sandboxed
 * viewer) has no download plumbing — the report must still "generate" in a
 * test without throwing.
 */
export function downloadCsv(filename, csv) {
  try {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

export const generate = async (id, data) => {
  const report = reportById(id)
  let rows = []
  try {
    const built = buildReport(id, data)
    rows = Array.isArray(built) ? built : []
  } catch {
    rows = []
  }
  return { report, rows, csv: toCsv(report.columns, rows), generatedAt: new Date().toISOString() }
}
