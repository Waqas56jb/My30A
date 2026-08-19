import { api } from './api'

export function resetRecommendations() {}
export const countForProperty = () => 0

function shape(rec) {
  return {
    id: rec.id,
    propertyId: rec.property_id ?? rec.propertyId,
    name: rec.name,
    category: rec.category,
    description: rec.note ?? rec.description,
    hostNote: rec.note,
    featured: rec.featured,
    placeRef: rec.place_ref,
    createdAt: rec.created_at,
  }
}

export async function listRecommendations({ propertyId = null, search = '', category = 'All' } = {}) {
  const q = new URLSearchParams()
  if (propertyId) q.set('propertyId', propertyId)
  const rows = await api(`/hosts/me/recommendations?${q}`)
  return rows
    .map(shape)
    .filter((rec) => !propertyId || rec.propertyId === propertyId)
    .filter((rec) => category === 'All' || rec.category === category)
    .filter((rec) => {
      if (!search) return true
      const needle = search.trim().toLowerCase()
      return [rec.name, rec.category, rec.description, rec.hostNote].join(' ').toLowerCase().includes(needle)
    })
}

export async function getRecommendation(id) {
  return shape(await api(`/hosts/me/recommendations/${id}`))
}

export async function saveRecommendation(input) {
  if (input.id) {
    return shape(await api(`/hosts/me/recommendations/${input.id}`, { method: 'PATCH', body: input }))
  }
  return shape(await api('/hosts/me/recommendations', { method: 'POST', body: input }))
}

export async function deleteRecommendation(id) {
  return api(`/hosts/me/recommendations/${id}`, { method: 'DELETE' })
}
