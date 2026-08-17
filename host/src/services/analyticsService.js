import { request, clone } from './mockClient'
import { mockAnalytics, mockPartnerClicks, mockSatisfaction } from '../data/analytics'

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

export async function getAnalytics(propertyId, range = '30d') {
  return request(
    () => clone(mockAnalytics[propertyId]?.[range] ?? EMPTY),
    { label: 'your analytics' },
  )
}

export async function getPartnerEngagement(propertyId) {
  return request(() => clone(mockPartnerClicks[propertyId] ?? []), { label: 'partner engagement' })
}

export async function getSatisfaction(propertyId) {
  return request(
    () => clone(mockSatisfaction[propertyId] ?? { average: null, responses: 0, breakdown: [0, 0, 0, 0, 0] }),
    { label: 'guest satisfaction' },
  )
}

/** Dashboard headline numbers, pulled from the property record itself. */
export async function getPropertySnapshot(property) {
  return request(() => clone(property?.stats ?? EMPTY.totals), { label: 'your dashboard' })
}
