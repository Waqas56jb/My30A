import { request, clone, notFound, publish } from './mockClient'
import { readStore, writeStore, STORAGE_KEYS } from '../utils/storage'
import { makeId } from '../utils/format'
import { mockRecommendations } from '../data/recommendations'

let db = readStore(STORAGE_KEYS.recommendations) ?? clone(mockRecommendations)

const persist = () => {
  writeStore(STORAGE_KEYS.recommendations, db)
  publish('recommendations', clone(db))
}

export function resetRecommendations() {
  db = clone(mockRecommendations)
  persist()
}

export const countForProperty = (propertyId) =>
  db.filter((rec) => rec.propertyId === propertyId).length

export async function listRecommendations({ propertyId = null, search = '', category = 'All' } = {}) {
  return request(
    () =>
      clone(db)
        .filter((rec) => !propertyId || rec.propertyId === propertyId)
        .filter((rec) => category === 'All' || rec.category === category)
        .filter((rec) => {
          if (!search) return true
          const needle = search.trim().toLowerCase()
          return [rec.name, rec.category, rec.description, rec.hostNote]
            .join(' ')
            .toLowerCase()
            .includes(needle)
        })
        .sort((a, b) => Number(b.featured) - Number(a.featured)),
    { label: 'your recommendations' },
  )
}

export async function getRecommendation(id) {
  return request(
    () => {
      const found = db.find((rec) => rec.id === id)
      if (!found) throw notFound('that recommendation')
      return clone(found)
    },
    { label: 'this recommendation' },
  )
}

export async function saveRecommendation(input) {
  return request(
    () => {
      if (input.id) {
        const index = db.findIndex((rec) => rec.id === input.id)
        if (index === -1) throw notFound('that recommendation')
        db[index] = { ...db[index], ...input }
        persist()
        return clone(db[index])
      }
      const rec = {
        ...input,
        id: makeId('rec'),
        featured: !!input.featured,
        createdAt: new Date().toISOString(),
      }
      db = [rec, ...db]
      persist()
      return clone(rec)
    },
    { label: 'your recommendation' },
  )
}

export async function deleteRecommendation(id) {
  return request(
    () => {
      db = db.filter((rec) => rec.id !== id)
      persist()
      return { ok: true }
    },
    { label: 'that recommendation' },
  )
}
