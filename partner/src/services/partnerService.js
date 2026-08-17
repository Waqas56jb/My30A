import { request, clone, notFound, publish } from './mockClient'
import { readStore, writeStore, STORAGE_KEYS } from '../utils/storage'
import { makeId } from '../utils/format'
import { mockPartners } from '../data/partners'
import { PHOTO } from '../assets/images'

/**
 * Partner profile CRUD against a locally persisted copy of the fixtures, so a
 * demo survives a refresh.
 *
 * Note the absence of anything transactional: no orders, no availability, no
 * checkout. A partner manages how their business is presented; the guest
 * connects with them off-platform.
 */

let db = readStore(STORAGE_KEYS.partners) ?? clone(mockPartners)

const persist = () => {
  writeStore(STORAGE_KEYS.partners, db)
  publish('partners', clone(db))
}

export function resetPartners() {
  db = clone(mockPartners)
  writeStore(STORAGE_KEYS.applications, [])
  persist()
}

export const listPartnersSync = () => clone(db)

export async function listPartners() {
  return request(() => clone(db), { label: 'your businesses' })
}

export async function getPartner(id) {
  return request(
    () => {
      const found = db.find((partner) => partner.id === id)
      if (!found) throw notFound('that business')
      return clone(found)
    },
    { label: 'your business profile' },
  )
}

/** Partial update, merged one level deep so nested sections can be patched. */
export async function updatePartner(id, patch) {
  return request(
    () => {
      const index = db.findIndex((partner) => partner.id === id)
      if (index === -1) throw notFound('that business')

      const current = db[index]
      const next = { ...current, updatedAt: new Date().toISOString() }

      Object.entries(patch).forEach(([key, value]) => {
        next[key] =
          value && typeof value === 'object' && !Array.isArray(value)
            ? { ...(current[key] ?? {}), ...value }
            : value
      })

      db[index] = next
      persist()
      return clone(next)
    },
    { label: 'your changes' },
  )
}

/** The public application form. New businesses always start pending review. */
export async function applyAsPartner(input) {
  return request(
    () => {
      const id = makeId('ptr')
      const slug = String(input.businessName ?? 'partner')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const partner = {
        id,
        slug,
        businessName: input.businessName ?? '',
        ownerName: input.ownerName ?? '',
        email: input.email ?? '',
        phone: input.phone ?? '',
        website: input.website ?? '',
        category: input.category ?? 'Other',
        secondaryCategories: [],
        status: 'pending',
        submittedAt: new Date().toISOString(),
        approvedAt: null,
        updatedAt: new Date().toISOString(),

        address: input.address ?? '',
        city: input.city ?? '',
        state: input.state ?? 'FL',
        zip: input.zip ?? '',
        serviceArea: input.city ?? '',

        description: input.description ?? '',
        shortDescription: (input.description ?? '').slice(0, 120),

        startingPrice: input.startingPrice ? Number(input.startingPrice) : null,
        priceLabel: input.priceLabel ?? '',
        showPricing: !!input.startingPrice,

        rating: null,
        reviewCount: 0,

        logo: input.logo ?? null,
        photos: (input.photos ?? []).map((image, i) => ({
          id: makeId('img'),
          image,
          name: `Photo ${i + 1}`,
          category: 'Experience',
          cover: i === 0,
          featured: i === 0,
        })),

        hours: input.hours ?? {},
        instagram: input.instagram ?? '',
        facebook: input.facebook ?? '',
        services: [],
        rejectionReason: null,
      }

      db = [partner, ...db]
      persist()

      const applications = readStore(STORAGE_KEYS.applications, [])
      writeStore(STORAGE_KEYS.applications, [
        { id: partner.id, email: partner.email, businessName: partner.businessName },
        ...applications,
      ])

      return clone(partner)
    },
    { label: 'your application' },
  )
}

/**
 * Status changes. In production an admin reviewer drives these — the partner
 * can only resubmit. `resubmit` is the one transition a partner owns.
 */
export async function setStatus(id, status, extra = {}) {
  return request(
    () => {
      const index = db.findIndex((partner) => partner.id === id)
      if (index === -1) throw notFound('that business')
      const now = new Date().toISOString()

      db[index] = {
        ...db[index],
        status,
        updatedAt: now,
        approvedAt: status === 'approved' ? (db[index].approvedAt ?? now) : db[index].approvedAt,
        rejectionReason: status === 'rejected' ? (extra.reason ?? db[index].rejectionReason) : null,
      }
      persist()
      return clone(db[index])
    },
    { label: 'your listing status' },
  )
}

export async function resubmit(id) {
  return setStatus(id, 'pending')
}

/* ------------------------------- Photos ---------------------------------- */

/** Stand-in for a real uploader: a curated set that sells the experience. */
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

export async function addPhoto(id, { image, name = 'New photo', category = 'Experience' }) {
  return request(
    () => {
      const index = db.findIndex((partner) => partner.id === id)
      if (index === -1) throw notFound('that business')
      const partner = db[index]
      const isFirst = partner.photos.length === 0
      const photo = { id: makeId('img'), image, name, category, cover: isFirst, featured: isFirst }
      db[index] = { ...partner, photos: [...partner.photos, photo], updatedAt: new Date().toISOString() }
      persist()
      return clone(db[index])
    },
    { label: 'that photo' },
  )
}

export async function removePhoto(id, photoId) {
  return request(
    () => {
      const index = db.findIndex((partner) => partner.id === id)
      if (index === -1) throw notFound('that business')
      const photos = db[index].photos.filter((photo) => photo.id !== photoId)
      // Never leave a listing without a cover while photos remain.
      if (photos.length && !photos.some((photo) => photo.cover)) photos[0].cover = true
      db[index] = { ...db[index], photos, updatedAt: new Date().toISOString() }
      persist()
      return clone(db[index])
    },
    { label: 'that photo' },
  )
}

export async function setCoverPhoto(id, photoId) {
  return request(
    () => {
      const index = db.findIndex((partner) => partner.id === id)
      if (index === -1) throw notFound('that business')
      const photos = db[index].photos.map((photo) => ({ ...photo, cover: photo.id === photoId }))
      db[index] = { ...db[index], photos, updatedAt: new Date().toISOString() }
      persist()
      return clone(db[index])
    },
    { label: 'the cover photo' },
  )
}

export async function toggleFeatured(id, photoId) {
  return request(
    () => {
      const index = db.findIndex((partner) => partner.id === id)
      if (index === -1) throw notFound('that business')
      const photos = db[index].photos.map((photo) =>
        photo.id === photoId ? { ...photo, featured: !photo.featured } : photo,
      )
      db[index] = { ...db[index], photos, updatedAt: new Date().toISOString() }
      persist()
      return clone(db[index])
    },
    { label: 'that photo' },
  )
}

export async function movePhoto(id, photoId, direction) {
  return request(
    () => {
      const index = db.findIndex((partner) => partner.id === id)
      if (index === -1) throw notFound('that business')
      const photos = [...db[index].photos]
      const from = photos.findIndex((photo) => photo.id === photoId)
      const to = from + direction
      if (from === -1 || to < 0 || to >= photos.length) return clone(db[index])
      ;[photos[from], photos[to]] = [photos[to], photos[from]]
      db[index] = { ...db[index], photos, updatedAt: new Date().toISOString() }
      persist()
      return clone(db[index])
    },
    { label: 'the photo order' },
  )
}

export async function setLogo(id, image) {
  return updatePartner(id, { logo: image })
}
