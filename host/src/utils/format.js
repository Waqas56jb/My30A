/** Presentation helpers. Everything here is pure and locale-safe. */

const DAY_MS = 86_400_000

/** Parse 'YYYY-MM-DD' or an ISO datetime into a local Date (no TZ surprises). */
export function toDate(value) {
  if (value instanceof Date) return value
  if (!value) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(value, opts = { month: 'short', day: 'numeric' }) {
  const d = toDate(value)
  if (!d) return ''
  return d.toLocaleDateString('en-US', opts)
}

export const formatLongDate = (value) =>
  formatDate(value, { weekday: 'long', month: 'long', day: 'numeric' })

export const formatShortDate = (value) =>
  formatDate(value, { weekday: 'short', month: 'short', day: 'numeric' })

export function formatDateRange(start, end) {
  const a = toDate(start)
  const b = toDate(end)
  if (!a || !b) return ''
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  const left = a.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const right = b.toLocaleDateString('en-US', {
    month: sameMonth ? undefined : 'long',
    day: 'numeric',
  })
  return `${left} – ${right}`
}

export function formatTime(value) {
  const d = toDate(value)
  if (!d) return ''
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** 'Today', 'Yesterday', or a weekday/date label — used by chat separators. */
export function formatDayLabel(value, now = new Date()) {
  const d = toDate(value)
  if (!d) return ''
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOf(now) - startOf(d)) / DAY_MS)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays > 1 && diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

/** '3m ago' / '2h ago' / 'Aug 14' — used by the notification feed. */
export function formatRelative(value, now = new Date()) {
  const d = toDate(value)
  if (!d) return ''
  const diff = now.getTime() - d.getTime()
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(d)
}

export function formatCurrency(amount, { cents = true } = {}) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—'
  const n = Number(amount)
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents && n % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  })
}

export function formatDistance(miles) {
  if (miles === null || miles === undefined) return ''
  if (miles < 0.25) return 'Steps away'
  if (miles < 1) return `${(miles * 10).toFixed(0) / 10} mi away`
  return `${miles.toFixed(1)} mi away`
}

export const priceLevelLabel = (level) => '$'.repeat(Math.max(1, Math.min(4, level || 1)))

/** Whole days until a date; negative once it has passed. */
export function daysUntil(value, now = new Date()) {
  const d = toDate(value)
  if (!d) return null
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  return Math.round((startOf(d) - startOf(now)) / DAY_MS)
}

export function stayPhase(stay, now = new Date()) {
  const untilIn = daysUntil(stay?.checkInDate, now)
  const untilOut = daysUntil(stay?.checkOutDate, now)
  if (untilIn === null || untilOut === null) return { phase: 'unknown', label: '' }
  if (untilIn > 0)
    return {
      phase: 'upcoming',
      label: untilIn === 1 ? 'Arriving tomorrow' : `${untilIn} days until check-in`,
    }
  if (untilOut > 0)
    return {
      phase: 'in_stay',
      label: untilOut === 1 ? 'Last night tonight' : `${untilOut} nights remaining`,
    }
  if (untilOut === 0) return { phase: 'checkout_day', label: 'Check-out today' }
  return { phase: 'past', label: 'Stay complete' }
}

export const weekdayName = (date = new Date()) =>
  date.toLocaleDateString('en-US', { weekday: 'long' })

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

export const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`

/** Tiny classnames helper. */
export const cx = (...parts) => parts.filter(Boolean).join(' ')

/** Stable-ish id for locally created records. */
let seq = 0
export const makeId = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${(seq += 1)}`
