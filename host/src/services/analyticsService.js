import { api } from './api'

const EMPTY = {
  totals: {
    guestSessions: { value: 0, delta: 0 },
    conversations: { value: 0, delta: 0 },
    propertyViews: { value: 0, delta: 0 },
    experienceClicks: { value: 0, delta: 0 },
    partnerClicks: { value: 0, delta: 0 },
    satisfaction: { value: null, delta: 0 },
  },
  sessions: [],
  conversations: [],
  propertyViews: [],
  experiences: [],
}

export async function getAnalytics() {
  const data = await api('/hosts/me/analytics')
  return {
    ...EMPTY,
    totals: {
      ...EMPTY.totals,
      guestSessions: { value: data.guests ?? 0, delta: 0 },
      propertyViews: { value: data.properties ?? 0, delta: 0 },
      conversations: { value: data.conversations ?? 0, delta: 0 },
    },
  }
}

export async function getPartnerEngagement() {
  return []
}

export async function getSatisfaction() {
  return { average: null, responses: 0, breakdown: [0, 0, 0, 0, 0] }
}

export async function getPropertySnapshot(property) {
  return property?.stats ?? EMPTY.totals
}
