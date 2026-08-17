import { request, clone } from './mockClient'
import { readStore, writeStore, removeStore, STORAGE_KEYS } from '../utils/storage'
import { mockPartners } from '../data/partners'

/**
 * Mock authentication. No provider, no tokens, no password checking beyond
 * shape — the email decides which business you manage. This whole file is the
 * seam a real auth SDK will replace.
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

      const needle = email.trim().toLowerCase()
      const applied = readStore(STORAGE_KEYS.applications, [])
      const partner =
        mockPartners.find((item) => item.email.toLowerCase() === needle) ??
        applied.find((item) => item.email?.toLowerCase() === needle)

      if (!partner) {
        throw Object.assign(
          new Error('No partner account matches that email. Check it, or apply to become a partner.'),
          { field: 'email' },
        )
      }

      const session = {
        partnerId: partner.id,
        email: partner.email,
        ownerName: partner.ownerName,
        signedInAt: new Date().toISOString(),
        remember,
      }
      writeStore(STORAGE_KEYS.session, session)
      return clone(session)
    },
    { label: 'your account' },
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
      // Deliberately does not reveal whether an account exists.
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

/** Signs the session straight in after a successful application. */
export function startSessionFor(partner) {
  const session = {
    partnerId: partner.id,
    email: partner.email,
    ownerName: partner.ownerName,
    signedInAt: new Date().toISOString(),
    remember: true,
  }
  writeStore(STORAGE_KEYS.session, session)
  return session
}
