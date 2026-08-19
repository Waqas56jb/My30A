const PLATFORM_LABEL = {
  opentable: 'OpenTable',
  resy: 'Resy',
  sevenrooms: 'SevenRooms',
  website_widget: 'their website',
  phone_only: 'phone',
}

export function bookingPlatformOf(place) {
  return place?.bookingPlatform ?? place?.booking_platform ?? place?.bookingProvider ?? null
}

export function bookingUrlOf(place) {
  return place?.bookingUrl ?? place?.booking_url ?? null
}

export function bookingCta(place) {
  const platform = bookingPlatformOf(place)
  switch (platform) {
    case 'resy':
      return {
        label: 'Reserve on Resy',
        shortLabel: 'Reserve',
        disclosure: `${place.name} is not a My30A partner. Tables are reserved through Resy.`,
      }
    case 'sevenrooms':
      return {
        label: 'Reserve a table',
        shortLabel: 'Reserve',
        disclosure: `${place.name} is not a My30A partner. Tables are reserved through SevenRooms.`,
      }
    case 'website_widget':
      return {
        label: 'Reserve on their website',
        shortLabel: 'Reserve',
        disclosure: `${place.name} is not a My30A partner. Reservations are on the restaurant’s website.`,
      }
    case 'phone_only':
      return {
        label: 'Call to reserve',
        shortLabel: 'Call',
        disclosure: `${place.name} is not a My30A partner. This restaurant takes reservations by phone only.`,
      }
    case 'opentable':
      return {
        label: 'Reserve on OpenTable',
        shortLabel: 'Reserve',
        disclosure: `${place.name} is not a My30A partner. Tables are reserved through OpenTable.`,
      }
    default:
      return {
        label: place?.phone ? 'Call to reserve' : 'Reservation details',
        shortLabel: place?.phone ? 'Call' : 'Details',
        disclosure: `${place.name} is not a My30A partner. My30A does not book tables.`,
      }
  }
}

export function platformBadge(place) {
  const platform = bookingPlatformOf(place)
  if (!platform) return null
  if (platform === 'phone_only') return 'Call to reserve'
  return PLATFORM_LABEL[platform] ? `Book on ${PLATFORM_LABEL[platform]}` : null
}

export function telHref(phone) {
  if (!phone) return null
  return `tel:${String(phone).replace(/[^\d+]/g, '')}`
}

export function openRestaurantBooking(booking, place) {
  if (booking?.action === 'call' || bookingPlatformOf(place) === 'phone_only') {
    const href = telHref(booking?.phone || place?.phone)
    if (href) window.location.href = href
    return
  }
  const url = booking?.url || bookingUrlOf(place)
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
