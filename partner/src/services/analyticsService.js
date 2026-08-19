import { api } from './api'
import { METRICS, TRACKED, NOT_TRACKED } from '../data/analytics'

export async function getAnalytics(_partnerId, range = '30d') {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
  const data = await api(`/partners/me/analytics?days=${days}`)
  return {
    totals: data.totals ?? {},
    series: data.series ?? [],
    tracked: data.tracked ?? TRACKED,
    notTracked: data.notTracked ?? NOT_TRACKED,
    interest: data.interest ?? [],
    referrers: data.referrers ?? [],
  }
}

export async function getInterest() {
  return []
}

export async function getReferrers() {
  return []
}

export const trackingPolicy = () => ({ tracked: [...TRACKED], notTracked: [...NOT_TRACKED] })

export const metricDefinitions = () => [...METRICS]

export const totalEngagement = (totals = {}) =>
  Number(totals.website ?? 0) + Number(totals.phone ?? 0) + Number(totals.directions ?? 0)

export function connectRate(totals = {}) {
  const views = Number(totals.views ?? 0)
  if (!views) return null
  return Math.round((totalEngagement(totals) / views) * 1000) / 10
}
