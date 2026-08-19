import { readStore, writeStore, removeStore, STORAGE_KEYS } from '../utils/storage'
import { ROLES } from '../data/adminUsers'
import { api, setToken } from './api'

export const setAuthLatency = () => {}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const validateEmail = (email) => EMAIL_RE.test(String(email ?? '').trim())

const fail = (message, field) => {
  throw Object.assign(new Error(message), { field })
}

export function getSession() {
  const session = readStore(STORAGE_KEYS.session, null)
  if (!session?.email) return null
  return session
}

export function updateSessionUser(patch) {
  const session = getSession()
  if (!session) return null
  const next = {
    ...session,
    email: patch.email ?? session.email,
    user: { ...session.user, ...patch },
  }
  writeStore(STORAGE_KEYS.session, next)
  return next
}

export async function login({ email, password }) {
  if (!String(email ?? '').trim()) fail('Enter your work email.', 'email')
  if (!validateEmail(email)) fail('That does not look like an email address.', 'email')
  if (!password) fail('Enter your password.', 'password')
  const data = await api('/auth/login', { method: 'POST', body: { email, password, role: 'ADMIN' } })
  setToken(data.token)
  const effectiveRole = data.account.adminRole
  const session = {
    email: data.account.email,
    role: effectiveRole,
    signedInAt: new Date().toISOString(),
    user: {
      id: data.account.id,
      email: data.account.email,
      name: data.account.name,
      role: effectiveRole,
      permissions: data.account.permissions ?? ROLES[effectiveRole]?.permissions,
      title: data.profile?.title ?? '',
      phone: data.profile?.phone ?? '',
      avatarUrl: data.profile?.avatar_url ?? data.profile?.avatarUrl ?? null,
    },
  }
  writeStore(STORAGE_KEYS.session, session)
  return session
}

export async function signOut() {
  try {
    await api('/auth/logout', { method: 'POST', body: {} })
  } catch {
    /* ignore */
  }
  setToken(null)
  removeStore(STORAGE_KEYS.session)
  return { ok: true }
}

export async function requestPasswordReset(email) {
  if (!validateEmail(email)) fail('That does not look like an email address.', 'email')
  return api('/auth/forgot-password', { method: 'POST', body: { email, role: 'ADMIN' } })
}

export const can = (user, area, minimum = 'view') => {
  if (!user) return false
  const order = ['none', 'view', 'edit', 'full']
  const level = user.permissions?.[area] ?? 'none'
  return order.indexOf(level) >= order.indexOf(minimum)
}
