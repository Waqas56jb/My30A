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
  if (!validateEmail(email)) throw Object.assign(new Error('Enter a valid email address.'), { field: 'email' })
  if (!password) throw Object.assign(new Error('Enter your password.'), { field: 'password' })
  const data = await api('/auth/login', { method: 'POST', body: { email, password, role: 'HOST', remember } })
  setToken(data.token)
  const p = data.profile ?? {}
  const host = {
    id: data.account.id,
    firstName: p.first_name,
    lastName: p.last_name,
    email: data.account.email,
    phone: p.phone,
    company: p.company,
    emailVerified: Boolean(p.email_verified),
  }
  const session = { host, signedInAt: new Date().toISOString(), remember }
  writeStore(STORAGE_KEYS.session, session)
  return session
}

export async function signUp({ firstName, lastName, email, phone, password }) {
  const data = await api('/auth/register', {
    method: 'POST',
    body: { role: 'HOST', firstName, lastName, email, phone, password },
  })
  setToken(data.token)
  const p = data.profile ?? {}
  const host = {
    id: data.account.id,
    firstName: p.first_name ?? firstName,
    lastName: p.last_name ?? lastName,
    email: data.account.email,
    phone: p.phone ?? phone,
    company: '',
    emailVerified: false,
  }
  const session = { host, signedInAt: new Date().toISOString(), remember: true }
  writeStore(STORAGE_KEYS.session, session)
  writeStore(STORAGE_KEYS.profile, host)
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
  return api('/auth/forgot-password', { method: 'POST', body: { email, role: 'HOST' } })
}

export async function resetPassword({ token, password }) {
  return api('/auth/reset-password', { method: 'POST', body: { role: 'HOST', token, password } })
}

export async function verifyEmail() {
  throw new Error('Email verification is sent from the My30A team.')
}

export async function updateProfile(patch) {
  const next = await api('/hosts/me', { method: 'PATCH', body: patch })
  const session = getSession()
  const host = {
    ...(session?.host ?? {}),
    firstName: next.first_name,
    lastName: next.last_name,
    phone: next.phone,
    company: next.company,
    email: next.email,
    id: next.id,
  }
  writeStore(STORAGE_KEYS.session, { ...session, host })
  return host
}

export async function updateSettings(patch) {
  const session = getSession()
  if (!session) throw new Error('You are signed out.')
  const host = { ...session.host, settings: { ...session.host.settings, ...patch } }
  writeStore(STORAGE_KEYS.session, { ...session, host })
  return host
}
