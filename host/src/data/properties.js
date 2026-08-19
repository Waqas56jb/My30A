export const PROPERTY_TYPES = [
  'Beach House',
  'Vacation Home',
  'Condo',
  'Apartment',
  'Villa',
  'Cottage',
  'Other',
]

export const PHOTO_CATEGORIES = [
  'Exterior',
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Pool',
  'Beach Access',
  'Other',
]

export const PROPERTY_STATUSES = {
  draft: {
    label: 'Draft',
    tone: 'neutral',
    description: 'Guests cannot open the property experience yet.',
  },
  published: {
    label: 'Published',
    tone: 'ok',
    description: 'Guest access is live. Anyone with the link or QR can open their stay.',
  },
  paused: {
    label: 'Paused',
    tone: 'warn',
    description: 'Guest access is temporarily disabled. Existing links will not open.',
  },
}

export const SETUP_SECTIONS = [
  { key: 'information', label: 'Property information', route: 'information', icon: 'building' },
  { key: 'wifi', label: 'WiFi', route: 'wifi', icon: 'wifi' },
  { key: 'checkIn', label: 'Check-in', route: 'check-in', icon: 'key' },
  { key: 'checkOut', label: 'Check-out', route: 'check-out', icon: 'clock' },
  { key: 'rules', label: 'House rules', route: 'rules', icon: 'shield' },
  { key: 'parking', label: 'Parking', route: 'parking', icon: 'car' },
  { key: 'emergency', label: 'Emergency contacts', route: 'emergency', icon: 'alert' },
  { key: 'recommendations', label: 'Local recommendations', route: 'recommendations', icon: 'sparkles' },
  { key: 'photos', label: 'Photos', route: 'photos', icon: 'image' },
  { key: 'guestAccess', label: 'Guest access', route: 'guest-access', icon: 'grid' },
]

export function sectionComplete(property, key, recommendationCount = 0) {
  if (!property) return false
  switch (key) {
    case 'information':
      return Boolean(property.name && property.address && property.city && property.description)
    case 'wifi':
      return Boolean(property.wifi?.network && property.wifi?.password)
    case 'checkIn':
      return Boolean(property.checkIn?.time && property.checkIn?.arrival && property.checkIn?.doorCode)
    case 'checkOut':
      return Boolean(property.checkOut?.time && property.checkOut?.lockUp)
    case 'rules':
      return (property.rules ?? []).some((rule) => rule.enabled)
    case 'parking':
      return Boolean(property.parking?.location)
    case 'emergency':
      return Boolean(property.emergency?.contactPhone && property.emergency?.hospital)
    case 'recommendations':
      return recommendationCount > 0
    case 'photos':
      return (property.photos ?? []).length >= 3
    case 'guestAccess':
      return Boolean(property.guestAccess?.enabled && property.status === 'published')
    default:
      return false
  }
}

export function setupProgress(property, recommendationCount = 0) {
  const items = SETUP_SECTIONS.map((section) => ({
    ...section,
    done: sectionComplete(property, section.key, recommendationCount),
  }))
  const done = items.filter((item) => item.done).length
  return { items, done, total: items.length, percent: Math.round((done / items.length) * 100) }
}
