import { request, clone } from './mockClient'
import { mockAnalyticsFor, EMPTY_ANALYTICS, METRICS, TRACKED, NOT_TRACKED } from '../data/analytics'

/**
 * Engagement, not revenue.
 *
 * Everything returned here is an event My30A can actually observe on its own
 * surfaces. There is no conversion or booking figure because a guest who taps
 * "Website" leaves for the partner's own site, and what happens there is not
 * visible to us. The UI states that plainly rather than inventing a number.
 */

export async function getAnalytics(partnerId, range = '30d') {
  return request(() => clone(mockAnalyticsFor(partnerId, range) ?? EMPTY_ANALYTICS), {
    label: 'your analytics',
  })
}

export async function getInterest(partnerId) {
  return request(() => clone(mockAnalyticsFor(partnerId, '30d').interest ?? []), {
    label: 'guest interest',
  })
}

export async function getReferrers(partnerId) {
  return request(() => clone(mockAnalyticsFor(partnerId, '30d').referrers ?? []), {
    label: 'where guests came from',
  })
}

export const trackingPolicy = () => ({ tracked: [...TRACKED], notTracked: [...NOT_TRACKED] })

export const metricDefinitions = () => clone(METRICS)

/** Total engagement = every outbound action, views excluded. */
export const totalEngagement = (totals = {}) =>
  Number(totals.website ?? 0) + Number(totals.phone ?? 0) + Number(totals.directions ?? 0)

/** Share of viewers who did something. The one derived figure we can defend. */
export function connectRate(totals = {}) {
  const views = Number(totals.views ?? 0)
  if (!views) return null
  return Math.round((totalEngagement(totals) / views) * 1000) / 10
}
