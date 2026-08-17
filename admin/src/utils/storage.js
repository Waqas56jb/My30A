/**
 * Namespaced localStorage wrapper. Persisting mock state means an approval or a
 * status change survives a refresh, which makes the prototype demo-able.
 * Every call is guarded — private browsing and SSR must not throw.
 */
const NS = 'my30a.admin.v1'

const key = (k) => `${NS}.${k}`

export function readStore(k, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key(k))
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeStore(k, value) {
  try {
    window.localStorage.setItem(key(k), JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeStore(k) {
  try {
    window.localStorage.removeItem(key(k))
  } catch {
    /* ignore */
  }
}

export function clearAll() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(NS))
      .forEach((k) => window.localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}

export const STORAGE_KEYS = {
  session: 'session',
  partners: 'partners',
  hosts: 'hosts',
  properties: 'properties',
  guests: 'guests',
  orders: 'orders',
  transfers: 'transfers',
  payments: 'payments',
  reviews: 'reviews',
  notifications: 'notifications',
  categories: 'categories',
  knowledge: 'knowledge',
  automation: 'automation',
  media: 'media',
  content: 'content',
  audit: 'audit',
  adminUsers: 'adminUsers',
  settings: 'settings',
  subscriptions: 'subscriptions',
}
