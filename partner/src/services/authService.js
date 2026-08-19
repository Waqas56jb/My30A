import { readStore, writeStore, removeStore, STORAGE_KEYS } from '../utils/storage'
import { api, setToken } from './api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateEmail = (email) => EMAIL_RE.test(String(email ?? '').trim())

export function validatePassword(password) {
  const value = String(password ?? '')
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) return 'Include at least one letter and one number.'
  return null
}

export const getSession = () => readStore(STORAGE_KEYS.session, null)

export async function login({ email, password, remember = true }) {
  if (!validateEmail(email)) throw Object.assign(new Error('That does not look like an email address.'), { field: 'email' })
  if (!password) throw Object.assign(new Error('Enter your password.'), { field: 'password' })
  const data = await api('/auth/login', { method: 'POST', body: { email, password, role: 'PARTNER', remember } })
  setToken(data.token)
  const session = {
    partnerId: data.account.id,
    email: data.account.email,
    ownerName: data.account.name,
    signedInAt: new Date().toISOString(),
    remember,
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
  if (!validateEmail(email)) throw Object.assign(new Error('Enter a valid email address.'), { field: 'email' })
  return api('/auth/forgot-password', { method: 'POST', body: { email, role: 'PARTNER' } })
}

export async function resetPassword({ token, password }) {
  return api('/auth/reset-password', { method: 'POST', body: { role: 'PARTNER', token, password } })
}

export function startSessionFor(partner) {
  const session = {
    partnerId: partner.id,
    email: partner.email,
    ownerName: partner.ownerName ?? partner.owner_name,
    signedInAt: new Date().toISOString(),
    remember: true,
  }
  writeStore(STORAGE_KEYS.session, session)
  return session
}
