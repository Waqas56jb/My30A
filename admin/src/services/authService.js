import { readStore, writeStore, removeStore, STORAGE_KEYS } from '../utils/storage'
import { DEMO_ADMIN_ACCOUNTS, ROLES } from '../data/adminUsers'

/**
 * Mock admin authentication.
 *
 * No server, no tokens, no hashing. The session is a localStorage record, read
 * synchronously so a refresh on a guarded route does not bounce the operator
 * back to the login screen for a frame.
 *
 * Roles are real enough to demonstrate the permission model, but nothing is
 * enforced — a hidden menu item is a UI convenience, not a security boundary,
 * and this file is where a real provider will land.
 */

let latency = [160, 380]
export const setAuthLatency = (min, max) => {
  latency = [min, max]
}
const wait = () => {
  const [min, max] = latency
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)))
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const validateEmail = (email) => EMAIL_RE.test(String(email ?? '').trim())

const fail = (message, field) => {
  throw Object.assign(new Error(message), { field })
}

export function getSession() {
  const session = readStore(STORAGE_KEYS.session, null)
  if (!session?.email) return null
  const account = DEMO_ADMIN_ACCOUNTS.find((a) => a.email === session.email)
  if (!account) return null
  const { password, ...safe } = account
  return { ...session, user: { ...safe, permissions: ROLES[account.role].permissions } }
}

export async function login({ email, password, role }) {
  await wait()

  if (!String(email ?? '').trim()) fail('Enter your work email.', 'email')
  if (!validateEmail(email)) fail('That does not look like an email address.', 'email')
  if (!password) fail('Enter your password.', 'password')

  const account = DEMO_ADMIN_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === String(email).trim().toLowerCase(),
  )
  if (!account) fail('No admin account matches that email.', 'email')
  if (account.password !== password) fail('That password is not right.', 'password')

  /* The role picker lets one demo account walk through every permission set.
     A real system would take the role from the account, never from the form. */
  const effectiveRole = role && ROLES[role] ? role : account.role

  const session = { email: account.email, role: effectiveRole, signedInAt: new Date().toISOString() }
  writeStore(STORAGE_KEYS.session, session)

  const { password: _pw, ...safe } = account
  return { ...session, user: { ...safe, role: effectiveRole, permissions: ROLES[effectiveRole].permissions } }
}

export async function signOut() {
  removeStore(STORAGE_KEYS.session)
  return { ok: true }
}

export async function requestPasswordReset(email) {
  await wait()
  if (!validateEmail(email)) fail('That does not look like an email address.', 'email')
  // Never confirms whether the address exists.
  return { ok: true, email: String(email).trim().toLowerCase() }
}

/** A role's access level for one area, used to hide what an operator cannot use. */
export const can = (user, area, minimum = 'view') => {
  if (!user) return false
  const order = ['none', 'view', 'edit', 'full']
  const level = user.permissions?.[area] ?? 'none'
  return order.indexOf(level) >= order.indexOf(minimum)
}
