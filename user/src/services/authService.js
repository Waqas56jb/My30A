import { readStore, writeStore, removeStore, STORAGE_KEYS } from '../utils/storage'
import { mockAccounts, findAccountByEmail } from '../data/mockAccounts'

/**
 * Mock authentication for the guest app.
 *
 * No server, no tokens, no hashing — a localStorage record stands in for a
 * session so a refresh keeps you signed in. Every function here is a seam: when
 * a real auth provider lands, this file is the only one that changes, and the
 * shapes it returns stay the same.
 *
 * Latency is deliberately simulated so loading states are real, not decorative.
 */

const LATENCY = [180, 420]
let latency = LATENCY

/** Tests set this to zero so they are not waiting on artificial delay. */
export const setAuthLatency = (min, max) => {
  latency = [min, max]
}

const wait = () => {
  const [min, max] = latency
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)))
}

const clone = (value) => JSON.parse(JSON.stringify(value))

const fail = (message, field) => {
  throw Object.assign(new Error(message), { field })
}

/* ------------------------------ Validation ------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateEmail = (email) => EMAIL_RE.test(String(email ?? '').trim())

export function validatePassword(password) {
  const value = String(password ?? '')
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[a-zA-Z]/.test(value)) return 'Include at least one letter.'
  if (!/\d/.test(value)) return 'Include at least one number.'
  return null
}

/** Rough strength meter for the signup field. 0-3. */
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

/* ------------------------------- Accounts -------------------------------- */

/** Shipped fixtures plus anything created or edited on this device. */
function allAccounts() {
  const local = readStore(STORAGE_KEYS.accounts, []) ?? []
  const merged = mockAccounts.map((base) => {
    const override = local.find((a) => a.id === base.id)
    return override ? { ...base, ...override } : base
  })
  const extras = local.filter((a) => !mockAccounts.some((b) => b.id === a.id))
  return [...merged, ...extras]
}

function saveAccount(account) {
  const local = readStore(STORAGE_KEYS.accounts, []) ?? []
  const next = [...local.filter((a) => a.id !== account.id), account]
  writeStore(STORAGE_KEYS.accounts, next)
  return account
}

/** Never hand a password back to the UI, not even a fake one. */
const publicAccount = (account) => {
  if (!account) return null
  const { password, ...rest } = account
  return clone(rest)
}

/* ------------------------------- Session --------------------------------- */

/**
 * Read synchronously, on purpose.
 *
 * If the session were resolved in an effect, every guarded route would render
 * once as "signed out" and bounce the guest to /login on each refresh. Reading
 * localStorage up front makes a refresh a no-op.
 */
export function getSession() {
  const session = readStore(STORAGE_KEYS.session, null)
  if (!session?.accountId) return null
  const account = allAccounts().find((a) => a.id === session.accountId)
  if (!account) return null
  return { ...session, account: publicAccount(account) }
}

function startSession(account, { remember = true } = {}) {
  const session = {
    accountId: account.id,
    signedInAt: new Date().toISOString(),
    remember,
  }
  writeStore(STORAGE_KEYS.session, session)
  return { ...session, account: publicAccount(account) }
}

/* -------------------------------- Actions -------------------------------- */

export async function login({ email, password, remember = true }) {
  await wait()

  if (!String(email ?? '').trim()) fail('Enter your email address.', 'email')
  if (!validateEmail(email)) fail('That does not look like an email address.', 'email')
  if (!password) fail('Enter your password.', 'password')

  const account = findAccountByEmail(allAccounts(), email)
  if (!account) {
    fail('No account matches that email. Check it, or create one.', 'email')
  }
  if (account.password !== password) {
    fail('That password is not right. Try again, or reset it.', 'password')
  }

  return startSession(account, { remember })
}

export async function signUp({ firstName, lastName, email, phone = '', password }) {
  await wait()

  if (!String(firstName ?? '').trim()) fail('We need a first name.', 'firstName')
  if (!String(lastName ?? '').trim()) fail('We need a last name.', 'lastName')
  if (!validateEmail(email)) fail('That does not look like an email address.', 'email')

  if (findAccountByEmail(allAccounts(), email)) {
    fail('An account already uses that email. Log in instead.', 'email')
  }

  const problem = validatePassword(password)
  if (problem) fail(problem, 'password')

  const account = {
    id: `acc_${Date.now().toString(36)}`,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone).trim(),
    password,
    avatar: null,
    emailVerified: false,
    createdAt: new Date().toISOString(),
    // A new account has no stay until a code is entered. That is the normal
    // path: people sign up before, or instead of, having a booking.
    guestSlug: null,
  }

  saveAccount(account)
  return startSession(account)
}

export async function signOut() {
  removeStore(STORAGE_KEYS.session)
  return { ok: true }
}

/**
 * Password reset, step one.
 *
 * Deliberately reports success whether or not the address exists — telling a
 * stranger which emails are registered is an account-enumeration hole. The
 * token comes back only because there is no inbox in a prototype; a real
 * implementation emails it and returns nothing.
 */
export async function requestPasswordReset(email) {
  await wait()
  if (!validateEmail(email)) fail('That does not look like an email address.', 'email')

  const normalised = String(email).trim().toLowerCase()
  const account = findAccountByEmail(allAccounts(), normalised)
  const token = `rst_${Math.random().toString(36).slice(2, 10)}`

  if (account) {
    const tokens = readStore(STORAGE_KEYS.resetTokens, {}) ?? {}
    tokens[token] = { accountId: account.id, issuedAt: Date.now() }
    writeStore(STORAGE_KEYS.resetTokens, tokens)
  }

  return { ok: true, email: normalised, token: account ? token : null }
}

/** Password reset, step two. */
export async function resetPassword({ token, password, confirmPassword }) {
  await wait()

  if (!token) fail('This reset link is missing its code. Request a new one.', 'token')

  const tokens = readStore(STORAGE_KEYS.resetTokens, {}) ?? {}
  const record = tokens[token]
  if (!record) fail('This reset link has already been used, or it expired.', 'token')

  const problem = validatePassword(password)
  if (problem) fail(problem, 'password')
  if (password !== confirmPassword) fail('Both passwords need to match.', 'confirmPassword')

  const account = allAccounts().find((a) => a.id === record.accountId)
  if (!account) fail('We could not find that account any more.', 'token')

  saveAccount({ ...account, password })

  // One use per link.
  delete tokens[token]
  writeStore(STORAGE_KEYS.resetTokens, tokens)

  return { ok: true, email: account.email }
}

/** Used when a guest enters an access code, to remember the stay next time. */
export async function linkStayToAccount(accountId, guestSlug) {
  const account = allAccounts().find((a) => a.id === accountId)
  if (!account) return null
  saveAccount({ ...account, guestSlug })
  return publicAccount({ ...account, guestSlug })
}

export async function updateAccount(patch) {
  await wait()
  const session = readStore(STORAGE_KEYS.session, null)
  if (!session?.accountId) fail('You are signed out.')
  const account = allAccounts().find((a) => a.id === session.accountId)
  if (!account) fail('You are signed out.')
  const next = { ...account, ...patch, id: account.id }
  saveAccount(next)
  return publicAccount(next)
}

/** Prototype tool — wipes locally created accounts and reset links. */
export function resetAccounts() {
  removeStore(STORAGE_KEYS.accounts)
  removeStore(STORAGE_KEYS.resetTokens)
}
