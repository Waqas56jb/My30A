export const RANGES = [
  { id: 'today', label: 'Today', days: 1, bucket: 'hour' },
  { id: '7d', label: '7 days', days: 7, bucket: 'day' },
  { id: '30d', label: '30 days', days: 30, bucket: 'day' },
  { id: '90d', label: '90 days', days: 90, bucket: 'week' },
  { id: '12m', label: '12 months', days: 365, bucket: 'month' },
]

export const rangeById = (id) => RANGES.find((r) => r.id === id) ?? RANGES[2]

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

export function series() {
  return []
}

export const seriesTotal = () => 0

export function seriesDelta() {
  return { now: 0, before: 0, change: 0 }
}

export function todaySnapshot() {
  return {
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
    revenue: 0,
  }
}

export const GUEST_FUNNEL = [
  { label: 'Guests with an active stay', value: 0 },
  { label: 'Opened the Local Guide', value: 0 },
  { label: 'Viewed a partner listing', value: 0 },
  { label: 'Clicked through to a partner', value: 0 },
  { label: 'Website, phone or directions', value: 0, terminal: true },
]

export const SERVICE_FUNNEL = [
  { label: 'Talked to Vitoria', value: 0 },
  { label: 'Created a service request', value: 0 },
  { label: 'Request confirmed', value: 0 },
  { label: 'Paid', value: 0 },
  { label: 'Service completed', value: 0 },
  { label: 'Left a tip', value: 0 },
  { label: 'Left a review', value: 0 },
]
