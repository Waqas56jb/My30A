import { formatCurrency } from '../utils/format'

/**
 * Report generation.
 *
 * The CSV is assembled in the browser from the records already loaded on the
 * screen, so a downloaded file matches what the operator is looking at.
 */

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
  const { guests = [], hosts = [], partners = [], orders = [], transfers = [], payments = [], conversations = [], categories = [] } = data

  switch (id) {
    case 'guest_activity':
      return guests.map((g) => [
        g.name, g.email, g.propertyName, g.hostName, g.checkIn, g.checkOut,
        g.stats.conversations, g.stats.serviceRequests, g.rating ?? '—',
      ])

    case 'host':
      return hosts.map((h) => [
        h.name, h.company ?? '—', h.status, h.propertyCount,
        h.subscription.planId, h.subscription.status, h.subscription.nextBillingDate,
        h.satisfaction ?? '—',
      ])

    case 'partner':
      return partners.map((p) => {
        const clicks = p.stats.websiteClicks + p.stats.phoneClicks + p.stats.directionsClicks
        return [
          p.name, p.categoryId, p.status, p.stats.views, p.stats.websiteClicks,
          p.stats.phoneClicks, p.stats.directionsClicks,
          p.stats.views ? `${((clicks / p.stats.views) * 100).toFixed(1)}%` : '0%',
        ]
      })

    case 'grocery':
      return orders.map((o) => [
        o.id, o.guestName, o.propertyName, o.deliveryDate,
        formatCurrency(o.actualAmount ?? o.estimatedAmount), formatCurrency(o.serviceFee),
        o.tipAmount ? formatCurrency(o.tipAmount) : '—', o.status,
      ])

    case 'transfer':
      return transfers.map((t) => [
        t.id, t.guestName, t.airport, t.flightNumber, `${t.pickupDate} ${t.pickupTime}`,
        t.vehicleName, formatCurrency(t.amount), t.status,
      ])

    case 'revenue':
      return payments.map((p) => [
        p.id, p.guestName, p.type, formatCurrency(p.amount), p.status, p.method,
        String(p.createdAt).slice(0, 10), p.relatedLabel ?? '—',
      ])

    case 'vitoria':
      return conversations.map((c) => [
        c.id, c.guestName, c.propertyName, c.topic, c.language, c.messageCount, c.status,
        c.createdRequest?.label ?? '—',
      ])

    case 'referral':
      return categories.map((cat) => {
        const inCategory = partners.filter((p) => p.categoryId === cat.id)
        const sum = (field) => inCategory.reduce((total, p) => total + p.stats[field], 0)
        const views = sum('views')
        const clicks = sum('websiteClicks') + sum('phoneClicks') + sum('directionsClicks')
        return [
          cat.name, inCategory.length, views, sum('websiteClicks'), sum('phoneClicks'),
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
  const rows = buildReport(id, data)
  return { report, rows, csv: toCsv(report.columns, rows), generatedAt: new Date().toISOString() }
}
