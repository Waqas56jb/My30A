import { api } from './api'

export function resetProperties() {}
export const listPropertiesSync = () => []

export async function listProperties() {
  return api('/hosts/me/properties')
}

export async function getProperty(id) {
  return api(`/hosts/me/properties/${id}`)
}

export async function updateProperty(id, patch) {
  return api(`/hosts/me/properties/${id}`, { method: 'PATCH', body: patch })
}

export async function createProperty(input) {
  return api('/hosts/me/properties', { method: 'POST', body: input })
}

export async function deleteProperty() {
  throw new Error('Properties are archived by the My30A team.')
}

export async function setPropertyStatus(id, status) {
  return api(`/hosts/me/properties/${id}/status`, { method: 'POST', body: { status } })
}

export async function regenerateGuestAccess(id) {
  return api(`/hosts/me/properties/${id}/access`, { method: 'POST', body: {} })
}

async function withPhotos(id, mutate) {
  const property = await getProperty(id)
  const photos = mutate([...(property.photos ?? [])])
  return updateProperty(id, { photos })
}

export async function addPhoto(id, { image, category = 'Other', caption = '' }) {
  return withPhotos(id, (photos) => [
    ...photos,
    { id: `ph_${Date.now()}`, image, category, caption, cover: photos.length === 0 },
  ])
}

export async function removePhoto(id, photoId) {
  return withPhotos(id, (photos) => {
    const next = photos.filter((photo) => photo.id !== photoId)
    if (next.length && !next.some((photo) => photo.cover)) next[0].cover = true
    return next
  })
}

export async function setCoverPhoto(id, photoId) {
  return withPhotos(id, (photos) => photos.map((photo) => ({ ...photo, cover: photo.id === photoId })))
}

export async function movePhoto(id, photoId, direction) {
  return withPhotos(id, (photos) => {
    const from = photos.findIndex((photo) => photo.id === photoId)
    const to = from + direction
    if (from === -1 || to < 0 || to >= photos.length) return photos
    ;[photos[from], photos[to]] = [photos[to], photos[from]]
    return photos
  })
}

export async function updatePhoto(id, photoId, patch) {
  return withPhotos(id, (photos) => photos.map((photo) => (photo.id === photoId ? { ...photo, ...patch } : photo)))
}

export async function saveRule(id, rule) {
  const property = await getProperty(id)
  const rules = [...(property.rules ?? [])]
  const existing = rules.findIndex((r) => r.id === rule.id)
  if (existing === -1) rules.push({ ...rule, id: rule.id ?? `rule_${Date.now()}` })
  else rules[existing] = { ...rules[existing], ...rule }
  return updateProperty(id, { rules })
}

export async function removeRule(id, ruleId) {
  const property = await getProperty(id)
  return updateProperty(id, { rules: (property.rules ?? []).filter((rule) => rule.id !== ruleId) })
}
