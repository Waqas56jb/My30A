const NEAR_MILES = 80

export function coordsOf(entity) {
  if (!entity) return null
  const source = entity.coordinates ?? entity
  const lat = Number(source.lat ?? source.latitude)
  const lng = Number(source.lng ?? source.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

export function haversineMiles(a, b) {
  const from = coordsOf(a)
  const to = coordsOf(b)
  if (!from || !to) return null
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h =
    sinLat * sinLat +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * sinLng * sinLng
  return 7917.5 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function isNearby(from, to, miles = NEAR_MILES) {
  const distance = haversineMiles(from, to)
  return distance != null && distance <= miles
}

export function googleEmbedUrl(point) {
  const coords = coordsOf(point)
  if (coords) {
    const q = point?.name ? `${coords.lat},${coords.lng} ${point.name}` : `${coords.lat},${coords.lng}`
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&hl=en&output=embed`
  }
  const q = [point?.name, point?.address, point?.location, '30A Florida'].filter(Boolean).join(' ')
  return `https://www.google.com/maps?q=${encodeURIComponent(q || 'Scenic Highway 30A Florida')}&z=13&hl=en&output=embed`
}

export function googlePlaceUrl(point) {
  const coords = coordsOf(point)
  if (coords) {
    return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
  }
  const q = [point?.name, point?.address, point?.location, '30A Florida'].filter(Boolean).join(' ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function googleDirectionsUrl(point) {
  const coords = coordsOf(point)
  const destination = coords
    ? `${coords.lat},${coords.lng}`
    : [point?.name, point?.address, point?.location].filter(Boolean).join(' ')
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}
