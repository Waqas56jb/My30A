import { request, clone, notFound, publish } from './mockClient'
import { readStore, writeStore, STORAGE_KEYS } from '../utils/storage'
import { makeId } from '../utils/format'
import { mockProperties, PROPERTY_TYPES } from '../data/properties'
import { PHOTO } from '../assets/images'
import { guestLink } from '../config/links'

/**
 * Property CRUD against a locally persisted copy of the fixtures, so anything
 * a host changes in a demo survives a refresh. `resetProperties()` puts the
 * shipped data back.
 */

let db = readStore(STORAGE_KEYS.properties) ?? clone(mockProperties)

const persist = () => {
  writeStore(STORAGE_KEYS.properties, db)
  publish('properties', clone(db))
}

export function resetProperties() {
  db = clone(mockProperties)
  persist()
}

export const listPropertiesSync = () => clone(db)

export async function listProperties() {
  return request(() => clone(db), { label: 'your properties' })
}

export async function getProperty(id) {
  return request(
    () => {
      const found = db.find((p) => p.id === id)
      if (!found) throw notFound('that property')
      return clone(found)
    },
    { label: 'this property' },
  )
}

/** Partial update, merged one level deep so nested sections can be patched. */
export async function updateProperty(id, patch) {
  return request(
    () => {
      const index = db.findIndex((p) => p.id === id)
      if (index === -1) throw notFound('that property')

      const current = db[index]
      const next = { ...current, updatedAt: new Date().toISOString() }

      Object.entries(patch).forEach(([key, value]) => {
        next[key] =
          value && typeof value === 'object' && !Array.isArray(value)
            ? { ...(current[key] ?? {}), ...value }
            : value
      })

      // Keep the two representations of check-in/out times in step.
      if (patch.checkIn?.time) next.checkInTime = patch.checkIn.time
      if (patch.checkOut?.time) next.checkOutTime = patch.checkOut.time

      db[index] = next
      persist()
      return clone(next)
    },
    { label: 'your changes' },
  )
}

export async function createProperty(input) {
  return request(
    () => {
      const id = makeId('prop')
      const slug = `${(input.name ?? 'property')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${db.length + 1}`

      const property = {
        id,
        slug,
        name: input.name ?? 'Untitled property',
        type: PROPERTY_TYPES.includes(input.type) ? input.type : 'Vacation Home',
        status: 'draft',
        createdAt: new Date().toISOString(),
        publishedAt: null,
        updatedAt: new Date().toISOString(),

        address: input.address ?? '',
        city: input.city ?? '',
        state: input.state ?? 'FL',
        zip: input.zip ?? '',
        community: input.city ?? '',
        coordinates: { lat: 30.2758, lng: -86.0083 },

        bedrooms: Number(input.bedrooms) || 1,
        bathrooms: Number(input.bathrooms) || 1,
        maxGuests: Number(input.maxGuests) || 2,
        description: input.description ?? '',
        phone: input.phone ?? '',
        email: input.email ?? '',

        checkInTime: input.checkInTime ?? '4:00 PM',
        checkOutTime: input.checkOutTime ?? '10:00 AM',

        coverImage: input.coverImage ?? PHOTO.houseModern,
        photos: input.coverImage
          ? [{ id: makeId('ph'), image: input.coverImage, category: 'Exterior', caption: '', cover: true }]
          : [],

        wifi: { network: '', password: '', notes: '' },
        checkIn: {
          time: input.checkInTime ?? '4:00 PM',
          earlyCheckIn: '',
          arrival: '',
          entrance: '',
          lockType: 'Smart lock keypad',
          doorCode: '',
          keypadInstructions: '',
          lockbox: '',
          onArrival: '',
        },
        checkOut: {
          time: input.checkOutTime ?? '10:00 AM',
          lockUp: '',
          trash: '',
          dishwasher: '',
          laundry: '',
          keys: '',
          thermostat: '',
          notes: '',
        },
        rules: [],
        parking: {
          available: true,
          spaces: 2,
          location: '',
          passRequired: false,
          passInstructions: '',
          garage: '',
          street: '',
          notes: '',
        },
        emergency: {
          contactName: '',
          contactPhone: '',
          managerPhone: '',
          maintenancePhone: '',
          securityPhone: '',
          hospital: '',
          fireExtinguisher: '',
          firstAid: '',
          utilityShutoff: '',
          notes: '',
        },
        branding: { welcomeMessage: '', accent: 'sea', showHostContact: true },
        vitoria: { enabled: true, specialNotes: '', preferredRecommendations: true, escalateAfter: 2 },
        guestAccess: {
          enabled: false,
          link: guestLink(slug),
          code: `MY30A-${Math.floor(1000 + Math.random() * 8999)}`,
          generatedAt: null,
          activeGuests: 0,
          totalGuests: 0,
        },
        stats: {
          activeGuests: 0,
          guestSessions: 0,
          conversations: 0,
          satisfaction: null,
          propertyViews: 0,
          experienceClicks: 0,
        },
      }

      db = [property, ...db]
      persist()
      return clone(property)
    },
    { label: 'your new property' },
  )
}

export async function deleteProperty(id) {
  return request(
    () => {
      db = db.filter((p) => p.id !== id)
      persist()
      return { ok: true }
    },
    { label: 'that property' },
  )
}

/** draft | published | paused. Publishing also switches guest access on. */
export async function setPropertyStatus(id, status) {
  return request(
    () => {
      const index = db.findIndex((p) => p.id === id)
      if (index === -1) throw notFound('that property')
      const now = new Date().toISOString()
      const property = db[index]

      db[index] = {
        ...property,
        status,
        updatedAt: now,
        publishedAt: status === 'published' ? (property.publishedAt ?? now) : property.publishedAt,
        guestAccess: {
          ...property.guestAccess,
          enabled: status === 'published',
          generatedAt:
            status === 'published' ? (property.guestAccess.generatedAt ?? now) : property.guestAccess.generatedAt,
        },
      }
      persist()
      return clone(db[index])
    },
    { label: 'the property status' },
  )
}

/** Invalidates the previous link — the confirmation dialog says so. */
export async function regenerateGuestAccess(id) {
  return request(
    () => {
      const index = db.findIndex((p) => p.id === id)
      if (index === -1) throw notFound('that property')
      const property = db[index]
      const suffix = Math.floor(10 + Math.random() * 89)
      const slug = `${property.slug.replace(/-\d+$/, '')}-${suffix}`

      db[index] = {
        ...property,
        slug,
        guestAccess: {
          ...property.guestAccess,
          link: guestLink(slug),
          code: `MY30A-${Math.floor(1000 + Math.random() * 8999)}`,
          generatedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      }
      persist()
      return clone(db[index])
    },
    { label: 'a new guest link' },
  )
}

/* ------------------------------- Photos ---------------------------------- */

export async function addPhoto(id, { image, category = 'Other', caption = '' }) {
  return request(
    () => {
      const index = db.findIndex((p) => p.id === id)
      if (index === -1) throw notFound('that property')
      const property = db[index]
      const photo = { id: makeId('ph'), image, category, caption, cover: property.photos.length === 0 }
      db[index] = {
        ...property,
        photos: [...property.photos, photo],
        coverImage: photo.cover ? image : property.coverImage,
        updatedAt: new Date().toISOString(),
      }
      persist()
      return clone(db[index])
    },
    { label: 'that photo' },
  )
}

export async function removePhoto(id, photoId) {
  return request(
    () => {
      const index = db.findIndex((p) => p.id === id)
      if (index === -1) throw notFound('that property')
      const property = db[index]
      const photos = property.photos.filter((photo) => photo.id !== photoId)
      // Never leave a property without a cover if photos remain.
      if (photos.length && !photos.some((photo) => photo.cover)) photos[0].cover = true
      db[index] = {
        ...property,
        photos,
        coverImage: photos.find((photo) => photo.cover)?.image ?? property.coverImage,
        updatedAt: new Date().toISOString(),
      }
      persist()
      return clone(db[index])
    },
    { label: 'that photo' },
  )
}

export async function setCoverPhoto(id, photoId) {
  return request(
    () => {
      const index = db.findIndex((p) => p.id === id)
      if (index === -1) throw notFound('that property')
      const property = db[index]
      const photos = property.photos.map((photo) => ({ ...photo, cover: photo.id === photoId }))
      db[index] = {
        ...property,
        photos,
        coverImage: photos.find((photo) => photo.cover)?.image ?? property.coverImage,
        updatedAt: new Date().toISOString(),
      }
      persist()
      return clone(db[index])
    },
    { label: 'the cover photo' },
  )
}

export async function movePhoto(id, photoId, direction) {
  return request(
    () => {
      const index = db.findIndex((p) => p.id === id)
      if (index === -1) throw notFound('that property')
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

export async function updatePhoto(id, photoId, patch) {
  return request(
    () => {
      const index = db.findIndex((p) => p.id === id)
      if (index === -1) throw notFound('that property')
      const photos = db[index].photos.map((photo) =>
        photo.id === photoId ? { ...photo, ...patch } : photo,
      )
      db[index] = { ...db[index], photos, updatedAt: new Date().toISOString() }
      persist()
      return clone(db[index])
    },
    { label: 'that photo' },
  )
}

/* ------------------------------- Rules ----------------------------------- */

export async function saveRule(id, rule) {
  return request(
    () => {
      const index = db.findIndex((p) => p.id === id)
      if (index === -1) throw notFound('that property')
      const rules = [...db[index].rules]
      const existing = rules.findIndex((r) => r.id === rule.id)
      if (existing === -1) rules.push({ ...rule, id: rule.id ?? makeId('rule') })
      else rules[existing] = { ...rules[existing], ...rule }
      db[index] = { ...db[index], rules, updatedAt: new Date().toISOString() }
      persist()
      return clone(db[index])
    },
    { label: 'that rule' },
  )
}

export async function removeRule(id, ruleId) {
  return request(
    () => {
      const index = db.findIndex((p) => p.id === id)
      if (index === -1) throw notFound('that property')
      db[index] = {
        ...db[index],
        rules: db[index].rules.filter((rule) => rule.id !== ruleId),
        updatedAt: new Date().toISOString(),
      }
      persist()
      return clone(db[index])
    },
    { label: 'that rule' },
  )
}
