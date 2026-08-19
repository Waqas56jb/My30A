import { api } from './api'
import { updateProperty } from './propertyService'

export async function listConversations({ propertyId = null, search = '', topic = 'All', onlyUnresolved = false } = {}) {
  const rows = await api('/conversations')
  return rows
    .filter((conv) => !propertyId || conv.property_id === propertyId)
    .filter((conv) => topic === 'All' || conv.topic === topic)
    .filter((conv) => !onlyUnresolved || !conv.resolved)
    .filter((conv) => {
      if (!search) return true
      const needle = search.trim().toLowerCase()
      return [conv.guest_name, conv.topic, conv.summary].join(' ').toLowerCase().includes(needle)
    })
}

export async function getConversation(id) {
  return api(`/conversations/${id}`)
}

export async function getVitoriaSummary(propertyId = null) {
  const list = await listConversations({ propertyId })
  const rated = list.filter((conv) => typeof conv.rating === 'number')
  return {
    total: list.length,
    resolved: list.filter((conv) => conv.resolved).length,
    escalated: list.filter((conv) => conv.escalated).length,
    satisfaction: rated.length
      ? Number((rated.reduce((sum, conv) => sum + conv.rating, 0) / rated.length).toFixed(1))
      : null,
    topQuestions: [],
  }
}

export async function saveVitoriaConfig(propertyId, { branding, vitoria }) {
  return updateProperty(propertyId, { branding, vitoria })
}
