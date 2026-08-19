import { readStore, writeStore, removeStore, STORAGE_KEYS } from '../utils/storage'
import { api, setToken } from './api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const setAuthLatency = () => {}

export const validateEmail = (email) => EMAIL_RE.test(String(email ?? '').trim())

export function validatePassword(password) {
  const value = String(password ?? '')
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[a-zA-Z]/.test(value)) return 'Include at least one letter.'
  if (!/\d/.test(value)) return 'Include at least one number.'
  return null
}

export function passwordStrength(password) {
  const value = String(password ?? '')
  if (!value) return { score: 0, label: '' }
  let score = 0
  if (value.length >= 8) score += 1
  if (value.length >= 12) score += 1
  if (/[a-zA-Z]/.test(value) && /\d/.test(value)) score += 1
  if (/[^a-zA-Z0-9]/.test(value)) score += 1
  const capped = Math.min(3, score)
  return { score: capped, label: ['Too short', 'Weak', 'Good', 'Strong'][capped] }
}

const fail = (message, field) => {
  throw Object.assign(new Error(message), { field })
}

const publicAccount = (account) => {
  if (!account) return null
  const { password, ...rest } = account
  return rest
}

export function getSession() {
  const session = readStore(STORAGE_KEYS.session, null)
  if (!session?.accountId) return null
  return { ...session, account: publicAccount(session.account) }
}

function startSession(account, { remember = true } = {}) {
  const session = {
    accountId: account.id,
    signedInAt: new Date().toISOString(),
    remember,
    account: publicAccount(account),
  }
  writeStore(STORAGE_KEYS.session, session)
  return { ...session, account: publicAccount(account) }
}

function accountFromAuth(data, fallback = {}) {
  const profile = data.profile ?? {}
  return {
    id: data.account.id,
    firstName: profile.first_name ?? data.account.name?.split(' ')[0] ?? fallback.firstName,
    lastName: profile.last_name ?? fallback.lastName ?? '',
    email: data.account.email,
    phone: profile.phone ?? fallback.phone ?? '',
    avatar: profile.avatar_url ?? null,
    emailVerified: Boolean(profile.email_verified),
    guestSlug: profile.access_slug ?? fallback.guestSlug ?? null,
  }
}

export async function login({ email, password, remember = true }) {
  if (!String(email ?? '').trim()) fail('Enter your email address.', 'email')
  if (!validateEmail(email)) fail('That does not look like an email address.', 'email')
  if (!password) fail('Enter your password.', 'password')
  const data = await api('/auth/login', { method: 'POST', body: { email, password, role: 'GUEST', remember } })
  setToken(data.token)
  return startSession(accountFromAuth(data), { remember })
}

export async function signUp({ firstName, lastName, email, phone = '', password }) {
  if (!String(firstName ?? '').trim()) fail('We need a first name.', 'firstName')
  if (!String(lastName ?? '').trim()) fail('We need a last name.', 'lastName')
  if (!validateEmail(email)) fail('That does not look like an email address.', 'email')
  const problem = validatePassword(password)
  if (problem) fail(problem, 'password')
  const data = await api('/auth/register', {
    method: 'POST',
    body: { role: 'GUEST', firstName, lastName, email, phone, password },
  })
  setToken(data.token)
  return startSession(accountFromAuth(data, { firstName, lastName, phone }))
}

export async function signOut() {
  try {
    await api('/auth/logout', { method: 'POST', body: {} })
  } catch {
    /* still clear local session */
  }
  setToken(null)
  removeStore(STORAGE_KEYS.session)
  return { ok: true }
}

export async function requestPasswordReset(email) {
  if (!validateEmail(email)) fail('That does not look like an email address.', 'email')
  return api('/auth/forgot-password', { method: 'POST', body: { email, role: 'GUEST' } })
}

export async function resetPassword({ token, password, confirmPassword }) {
  const problem = validatePassword(password)
  if (problem) fail(problem, 'password')
  if (password !== confirmPassword) fail('Both passwords need to match.', 'confirmPassword')
  return api('/auth/reset-password', { method: 'POST', body: { role: 'GUEST', token, password } })
}

export async function linkStayToAccount(_accountId, guestSlug) {
  const session = readStore(STORAGE_KEYS.session, null)
  if (!session?.account) return null
  const account = { ...session.account, guestSlug }
  writeStore(STORAGE_KEYS.session, { ...session, account })
  return account
}

export async function updateAccount(patch) {
  const next = await api('/guests/me', { method: 'PATCH', body: patch })
  const session = readStore(STORAGE_KEYS.session, null)
  const account = {
    ...(session?.account ?? {}),
    firstName: next.first_name ?? patch.firstName,
    lastName: next.last_name ?? patch.lastName,
    phone: next.phone ?? patch.phone,
    email: next.email,
    id: next.id,
  }
  if (session) writeStore(STORAGE_KEYS.session, { ...session, account })
  return account
}

export function resetAccounts() {
  removeStore(STORAGE_KEYS.accounts)
  removeStore(STORAGE_KEYS.resetTokens)
}
