import { rng, between, shiftDate, TODAY } from './seed'

/**
 * Time-series analytics.
 *
 * Series are generated from one seeded curve per metric — a baseline, a
 * weekly rhythm and a summer ramp — so 7d, 30d and 90d views of the same
 * metric are consistent slices of one history rather than three unrelated
 * random walks. Zooming out should never contradict zooming in.
 */

export const RANGES = [
  { id: 'today', label: 'Today', days: 1, bucket: 'hour' },
  { id: '7d', label: '7 days', days: 7, bucket: 'day' },
  { id: '30d', label: '30 days', days: 30, bucket: 'day' },
  { id: '90d', label: '90 days', days: 90, bucket: 'week' },
  { id: '12m', label: '12 months', days: 365, bucket: 'month' },
]

export const rangeById = (id) => RANGES.find((r) => r.id === id) ?? RANGES[2]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** One shared 365-day history per metric, generated once. */
function buildSeries(seed, { base, growth, weekend = 1, noise = 0.18 }) {
  const random = rng(seed)
  return Array.from({ length: 366 }, (_, i) => {
    const daysAgo = 365 - i
    const date = shiftDate(-daysAgo)
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
    const seasonal = 1 + 0.35 * Math.sin(((i / 365) * Math.PI * 2) - Math.PI / 2)
    const trend = 1 + growth * (i / 365)
    const weekly = weekday === 0 || weekday === 6 ? weekend : 1
    const jitter = 1 + (random() - 0.5) * noise * 2
    return { date, value: Math.max(0, Math.round(base * seasonal * trend * weekly * jitter)) }
  })
}

const HISTORY = {
  guests: buildSeries(101, { base: 26, growth: 0.9, weekend: 1.25 }),
  hosts: buildSeries(202, { base: 1.4, growth: 1.4, weekend: 0.6, noise: 0.5 }),
  partners: buildSeries(303, { base: 1.1, growth: 1.1, weekend: 0.5, noise: 0.6 }),
  requests: buildSeries(404, { base: 21, growth: 0.7, weekend: 1.15 }),
  revenue: buildSeries(505, { base: 1180, growth: 0.85, weekend: 1.2 }),
  partnerClicks: buildSeries(606, { base: 268, growth: 0.75, weekend: 1.3 }),
  conversations: buildSeries(707, { base: 96, growth: 0.95, weekend: 1.1 }),
  visits: buildSeries(808, { base: 640, growth: 0.8, weekend: 1.35 }),
}

export const METRICS = {
  guests: { label: 'Guest growth', suffix: '', prefix: '', color: 'sea' },
  hosts: { label: 'Host growth', suffix: '', prefix: '', color: 'gold' },
  partners: { label: 'Partner growth', suffix: '', prefix: '', color: 'success' },
  requests: { label: 'Service requests', suffix: '', prefix: '', color: 'info' },
  revenue: { label: 'Revenue', suffix: '', prefix: '$', color: 'sea' },
  partnerClicks: { label: 'Partner referral traffic', suffix: '', prefix: '', color: 'gold' },
  conversations: { label: 'Vitoria conversations', suffix: '', prefix: '', color: 'success' },
  visits: { label: 'App visits', suffix: '', prefix: '', color: 'info' },
}

const shortDate = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

/**
 * Slice a metric to a range and bucket it. Buckets are summed, not averaged —
 * "revenue over 90 days" means the total that week, not a typical day in it.
 */
export function series(metric, rangeId = '30d') {
  const range = rangeById(rangeId)
  const history = HISTORY[metric] ?? HISTORY.guests
  const window = history.slice(history.length - range.days)

  if (range.bucket === 'hour') {
    // A single day, spread over the hours the platform is actually awake.
    const random = rng(metric.length * 31 + 7)
    const total = window[window.length - 1]?.value ?? 0
    const shape = [1, 1, 1, 2, 4, 7, 9, 10, 9, 8, 7, 6, 6, 6, 5, 5, 4, 3]
    const sum = shape.reduce((a, b) => a + b, 0)
    return shape.map((weight, i) => ({
      label: `${String(i + 6).padStart(2, '0')}:00`,
      value: Math.round((total * weight) / sum * (0.9 + random() * 0.2)),
    }))
  }

  if (range.bucket === 'day') {
    return window.map((point) => ({ label: shortDate(point.date), value: point.value }))
  }

  if (range.bucket === 'week') {
    const out = []
    for (let i = 0; i < window.length; i += 7) {
      const chunk = window.slice(i, i + 7)
      out.push({
        label: shortDate(chunk[0].date),
        value: chunk.reduce((sum, p) => sum + p.value, 0),
      })
    }
    return out
  }

  // months
  const byMonth = new Map()
  window.forEach((point) => {
    const d = new Date(`${point.date}T12:00:00Z`)
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    const label = MONTHS[d.getUTCMonth()]
    const entry = byMonth.get(key) ?? { label, value: 0 }
    entry.value += point.value
    byMonth.set(key, entry)
  })
  return [...byMonth.values()]
}

export const seriesTotal = (metric, rangeId) =>
  series(metric, rangeId).reduce((sum, p) => sum + p.value, 0)

/** Same-length window immediately before this one, for a change indicator. */
export function seriesDelta(metric, rangeId = '30d') {
  const range = rangeById(rangeId)
  const history = HISTORY[metric] ?? HISTORY.guests
  const current = history.slice(history.length - range.days)
  const previous = history.slice(history.length - range.days * 2, history.length - range.days)
  const sum = (list) => list.reduce((total, p) => total + p.value, 0)
  const now = sum(current)
  const before = sum(previous)
  if (!before) return { now, before, change: 0 }
  return { now, before, change: (now - before) / before }
}

/**
 * Today's counters. Derived from the same history as the charts so the
 * dashboard cards and the graphs beneath them cannot disagree.
 */
export function todaySnapshot() {
  const last = (metric) => HISTORY[metric][HISTORY[metric].length - 1].value
  const random = rng(3160)
  return {
    date: TODAY,
    newGuests: last('guests'),
    newHosts: last('hosts'),
    newPartners: last('partners'),
    newRequests: last('requests'),
    completedOrders: between(random, 9, 24),
    payments: between(random, 14, 38),
    refunds: between(random, 0, 4),
    conversations: last('conversations'),
    partnerClicks: last('partnerClicks'),
    revenue: last('revenue'),
  }
}

/**
 * The two journeys the business runs on. The partner funnel deliberately stops
 * at the outbound click: what happens on the other side is not ours to measure.
 */
export const GUEST_FUNNEL = [
  { label: 'Guests with an active stay', value: 1428 },
  { label: 'Opened the Local Guide', value: 1102 },
  { label: 'Viewed a partner listing', value: 864 },
  { label: 'Clicked through to a partner', value: 391 },
  { label: 'Website, phone or directions', value: 391, terminal: true },
]

export const SERVICE_FUNNEL = [
  { label: 'Talked to Vitoria', value: 1186 },
  { label: 'Created a service request', value: 428 },
  { label: 'Request confirmed', value: 372 },
  { label: 'Paid', value: 344 },
  { label: 'Service completed', value: 331 },
  { label: 'Left a tip', value: 198 },
  { label: 'Left a review', value: 164 },
]
