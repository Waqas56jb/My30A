import { request, clone } from './mockClient'
import { readStore, writeStore, removeStore, STORAGE_KEYS } from '../utils/storage'
import { mockHost, DEMO_CREDENTIALS } from '../data/host'

/**
 * Mock authentication.
 *
 * No provider, no tokens, no password checking beyond shape. The session is a
 * localStorage record so a refresh keeps you signed in. Everything here is the
 * seam where a real auth SDK will land.
 */

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
  return request(
    () => {
      if (!validateEmail(email)) {
        throw Object.assign(new Error('Enter a valid email address.'), { field: 'email' })
      }
      if (!password) {
        throw Object.assign(new Error('Enter your password.'), { field: 'password' })
      }
      // The prototype accepts any password for the demo account, and any
      // well-formed credentials for an account created in this session.
      const created = readStore(STORAGE_KEYS.profile, null)
      const known =
        email.trim().toLowerCase() === DEMO_CREDENTIALS.email ||
        (created && email.trim().toLowerCase() === created.email?.toLowerCase())

      if (!known) {
        throw Object.assign(
          new Error('No host account matches that email. Check it, or create an account.'),
          { field: 'email' },
        )
      }

      const host = created ?? clone(mockHost)
      const session = { host, signedInAt: new Date().toISOString(), remember }
      writeStore(STORAGE_KEYS.session, session)
      return clone(session)
    },
    { label: 'your account' },
  )
}

export async function signUp({ firstName, lastName, email, phone, password }) {
  return request(
    () => {
      const host = {
        ...clone(mockHost),
        id: 'host_new',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        avatar: null,
        company: '',
        emailVerified: false,
        createdAt: new Date().toISOString(),
      }
      writeStore(STORAGE_KEYS.profile, host)
      const session = { host, signedInAt: new Date().toISOString(), remember: true }
      writeStore(STORAGE_KEYS.session, session)
      return clone(session)
    },
    { label: 'your new account' },
  )
}

export async function signOut() {
  removeStore(STORAGE_KEYS.session)
  return { ok: true }
}

export async function requestPasswordReset(email) {
  return request(
    () => {
      if (!validateEmail(email)) {
        throw Object.assign(new Error('Enter a valid email address.'), { field: 'email' })
      }
      // Deliberately does not reveal whether the account exists.
      return { ok: true, email: email.trim().toLowerCase() }
    },
    { label: 'the reset email' },
  )
}

export async function resetPassword({ token, password }) {
  return request(
    () => {
      if (!token) throw new Error('This reset link is no longer valid. Request a new one.')
      const problem = validatePassword(password)
      if (problem) throw Object.assign(new Error(problem), { field: 'password' })
      return { ok: true }
    },
    { label: 'your new password' },
  )
}

export async function verifyEmail(code) {
  return request(
    () => {
      if (String(code ?? '').replace(/\s/g, '').length !== 6) {
        throw Object.assign(new Error('Enter the 6-digit code from your email.'), { field: 'code' })
      }
      const session = getSession()
      if (session) {
        session.host.emailVerified = true
        writeStore(STORAGE_KEYS.session, session)
      }
      const profile = readStore(STORAGE_KEYS.profile, null)
      if (profile) writeStore(STORAGE_KEYS.profile, { ...profile, emailVerified: true })
      return { ok: true }
    },
    { label: 'your verification code' },
  )
}

export async function updateProfile(patch) {
  return request(
    () => {
      const session = getSession()
      if (!session) throw new Error('You are signed out.')
      const host = { ...session.host, ...patch }
      writeStore(STORAGE_KEYS.session, { ...session, host })
      writeStore(STORAGE_KEYS.profile, host)
      return clone(host)
    },
    { label: 'your profile' },
  )
}

export async function updateSettings(patch) {
  return request(
    () => {
      const session = getSession()
      if (!session) throw new Error('You are signed out.')
      const host = { ...session.host, settings: { ...session.host.settings, ...patch } }
      writeStore(STORAGE_KEYS.session, { ...session, host })
      writeStore(STORAGE_KEYS.profile, host)
      return clone(host)
    },
    { label: 'your settings' },
  )
}
