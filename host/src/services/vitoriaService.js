import { request, clone, notFound } from './mockClient'
import { mockConversations, mockTopQuestions } from '../data/conversations'
import { updateProperty } from './propertyService'

/**
 * Host-side view of Vitoria. There is no model here — the host reads what
 * guests asked and configures how she introduces the property.
 */

export async function listConversations({ propertyId = null, search = '', topic = 'All', onlyUnresolved = false } = {}) {
  return request(
    () =>
      clone(mockConversations)
        .filter((conv) => !propertyId || conv.propertyId === propertyId)
        .filter((conv) => topic === 'All' || conv.topic === topic)
        .filter((conv) => !onlyUnresolved || !conv.resolved)
        .filter((conv) => {
          if (!search) return true
          const needle = search.trim().toLowerCase()
          return [conv.guestName, conv.topic, conv.summary]
            .join(' ')
            .toLowerCase()
            .includes(needle)
        })
        .sort((a, b) => String(b.at).localeCompare(String(a.at))),
    { label: 'your conversations' },
  )
}

export async function getConversation(id) {
  return request(
    () => {
      const found = mockConversations.find((conv) => conv.id === id)
      if (!found) throw notFound('that conversation')
      return clone(found)
    },
    { label: 'this conversation' },
  )
}

export async function getVitoriaSummary(propertyId = null) {
  return request(() => {
    const list = mockConversations.filter((conv) => !propertyId || conv.propertyId === propertyId)
    const rated = list.filter((conv) => typeof conv.rating === 'number')
    return {
      total: list.length,
      resolved: list.filter((conv) => conv.resolved).length,
      escalated: list.filter((conv) => conv.escalated).length,
      satisfaction: rated.length
        ? Number((rated.reduce((sum, conv) => sum + conv.rating, 0) / rated.length).toFixed(1))
        : null,
      topQuestions: clone(mockTopQuestions),
    }
  }, { label: 'Vitoria activity' })
}

/** Vitoria's per-property configuration lives on the property record. */
export async function saveVitoriaConfig(propertyId, { branding, vitoria }) {
  return updateProperty(propertyId, { branding, vitoria })
}
