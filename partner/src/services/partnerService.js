import { api, setToken } from './api'
import { PHOTO } from '../assets/images'

export function resetPartners() {}
export const listPartnersSync = () => []

export async function listPartners() {
  const me = await getPartner()
  return me ? [me] : []
}

export async function getPartner() {
  return api('/partners/me')
}

export async function updatePartner(_id, patch) {
  return api('/partners/me', { method: 'PATCH', body: patch })
}

export async function applyAsPartner(input) {
  const cover = Array.isArray(input.photos) ? input.photos[0] : input.coverUrl ?? input.logo
  const data = await api('/partners/apply', {
    method: 'POST',
    body: {
      email: input.email,
      password: input.password,
      name: input.businessName ?? input.name,
      ownerName: input.ownerName,
      categoryId: input.categoryId,
      category: input.category,
      description: input.description,
      phone: input.phone,
      website: input.website,
      address: input.address,
      town: input.city ?? input.town,
      city: input.city,
      state: input.state,
      startingPrice: input.startingPrice,
      priceLabel: input.priceLabel,
      hours: input.hours,
      photos: input.photos,
      coverUrl: typeof cover === 'string' ? cover : cover?.image ?? null,
    },
  })
  if (data?.token) setToken(data.token)
  return data
}

export async function setStatus() {
  throw new Error('Listing status is managed by the My30A team.')
}

export async function resubmit() {
  throw new Error('Resubmit your listing from the application review email, or contact My30A.')
}

export const PHOTO_LIBRARY = [
  { image: PHOTO.bonfirePeople, name: 'Bonfire at sunset', category: 'Experience' },
  { image: PHOTO.bonfireGroup, name: 'Around the fire', category: 'Experience' },
  { image: PHOTO.golfCartOcean, name: 'Cart above the Gulf', category: 'Experience' },
  { image: PHOTO.golfCartRow, name: 'The fleet', category: 'Fleet' },
  { image: PHOTO.bikeRide, name: 'Riding the coast path', category: 'Experience' },
  { image: PHOTO.bikeBoardwalk, name: 'Boardwalk ride', category: 'Experience' },
  { image: PHOTO.boatSunset, name: 'Out at sunset', category: 'Experience' },
  { image: PHOTO.boatDay, name: 'A day on the water', category: 'Experience' },
  { image: PHOTO.paddleCouple, name: 'Paddleboarding together', category: 'Experience' },
  { image: PHOTO.familyWalk, name: 'Family on the shore', category: 'Experience' },
  { image: PHOTO.yogaSunset, name: 'Sunrise flow', category: 'Experience' },
  { image: PHOTO.patioLights, name: 'Evening on the patio', category: 'Atmosphere' },
  { image: PHOTO.duneWalkover, name: 'Down to the sand', category: 'Atmosphere' },
  { image: PHOTO.beachSunset, name: 'Golden hour', category: 'Atmosphere' },
]

async function withPhotos(id, mutate) {
  const partner = await getPartner(id)
  const photos = mutate([...(partner.photos ?? [])])
  return updatePartner(id, { photos })
}

export async function addPhoto(id, { image, name = 'New photo', category = 'Experience' }) {
  return withPhotos(id, (photos) => {
    const isFirst = photos.length === 0
    return [...photos, { id: `img_${Date.now()}`, image, name, category, cover: isFirst, featured: isFirst }]
  })
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

export async function toggleFeatured(id, photoId) {
  return withPhotos(id, (photos) =>
    photos.map((photo) => (photo.id === photoId ? { ...photo, featured: !photo.featured } : photo)),
  )
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

export async function setLogo(id, image) {
  return updatePartner(id, { logo: image })
}
