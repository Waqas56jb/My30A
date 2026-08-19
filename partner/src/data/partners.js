export const PARTNER_CATEGORIES = [
  'Golf Cart Rentals',
  'Bike Rentals',
  'Beach Bonfires',
  'Boating',
  'Fishing',
  'Water Sports',
  'Photography',
  'Wellness & Spa',
  'Family Services',
  'Babysitting',
  'Restaurants',
  'Events',
  'Activities',
  'Transportation',
  'Shopping',
  'Other',
]

export const PARTNER_STATUSES = {
  pending: {
    label: 'Pending review',
    tone: 'warn',
    icon: 'clock',
    title: 'Your listing is waiting for review',
    body: 'Our local team checks every business by hand — usually within two working days. We will email you the moment it goes live. Nothing to do in the meantime, though the more photos you add now, the better your listing will look on day one.',
  },
  approved: {
    label: 'Approved',
    tone: 'ok',
    icon: 'checkCircle',
    title: 'Your business is live on My30A',
    body: 'Guests exploring 30A can find you, see your photos, and connect with you directly by phone, website, or directions. Everything below shows how much interest that is generating.',
  },
  rejected: {
    label: 'Needs changes',
    tone: 'danger',
    icon: 'alert',
    title: 'We need a few changes before this goes live',
    body: 'Nothing is lost — update the details below and resubmit, and we will take another look straight away.',
  },
  suspended: {
    label: 'Suspended',
    tone: 'danger',
    icon: 'eyeOff',
    title: 'Your listing is temporarily unavailable',
    body: 'Guests cannot currently see your business. This is usually a phone number or website that stopped working. Fix the details below and get in touch and we will restore it.',
  },
}

export const PROFILE_CHECKS = [
  { key: 'description', label: 'Business description', test: (p) => (p.description ?? '').length > 80 },
  { key: 'phone', label: 'Phone number', test: (p) => !!p.phone },
  { key: 'website', label: 'Website', test: (p) => !!p.website },
  { key: 'address', label: 'Location', test: (p) => !!p.city },
  { key: 'photos', label: 'At least three photos', test: (p) => (p.photos ?? []).length >= 3 },
  { key: 'cover', label: 'Cover photo chosen', test: (p) => (p.photos ?? []).some((ph) => ph.cover) },
  { key: 'hours', label: 'Opening hours', test: (p) => Object.keys(p.hours ?? {}).length > 0 },
  { key: 'pricing', label: 'Starting price (optional)', test: (p) => !p.showPricing || !!p.startingPrice, optional: true },
]

export function profileCompleteness(partner) {
  if (!partner) return { items: [], done: 0, total: 0, percent: 0 }
  const items = PROFILE_CHECKS.map((check) => ({ ...check, done: check.test(partner) }))
  const done = items.filter((item) => item.done).length
  return { items, done, total: items.length, percent: Math.round((done / items.length) * 100) }
}
