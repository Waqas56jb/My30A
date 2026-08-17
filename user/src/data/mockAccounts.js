import { PHOTO } from '../assets/images'

/**
 * Guest accounts.
 *
 * There are two separate ideas in this product and it is worth keeping them
 * apart:
 *
 *   ACCOUNT — who you are. Email + password. Owns your profile, saved places,
 *             preferences and past trips. Survives between holidays.
 *   STAY    — which house you are in this week. Unlocked with the access code
 *             your host sends (see `mockGuests.js`). Changes every booking.
 *
 * You log into an account; the account may or may not have a stay attached to
 * it yet. `guestSlug` below is that link.
 *
 * Passwords are stored in plain text here because this is mock data with no
 * server. That is obviously not how the real thing works — when a backend
 * lands, `services/authService.js` is the only file that changes.
 */
export const mockAccounts = [
  {
    id: 'acc_sarah',
    firstName: 'Sarah',
    lastName: 'Whitmore',
    email: 'sarah@my30a.com',
    password: 'demo1234',
    phone: '(404) 555-0188',
    avatar: PHOTO.guestSarah,
    emailVerified: true,
    createdAt: '2024-06-11T09:20:00.000Z',
    guestSlug: 'demo', // Rosemary Beach House, checking in 20 Aug
  },
  {
    id: 'acc_daniel',
    firstName: 'Daniel',
    lastName: 'Okafor',
    email: 'daniel@my30a.com',
    password: 'demo1234',
    phone: '(312) 555-0110',
    avatar: null,
    emailVerified: true,
    createdAt: '2026-07-02T15:05:00.000Z',
    guestSlug: 'daniel', // Watercolor Dune Cottage, checking in 4 Sep
  },
  {
    id: 'acc_alex',
    firstName: 'Alex',
    lastName: 'Rivera',
    email: 'alex@my30a.com',
    password: 'demo1234',
    phone: '(850) 555-0164',
    avatar: null,
    emailVerified: false,
    createdAt: '2026-08-09T18:40:00.000Z',
    guestSlug: null, // signed up before booking — no stay yet
  },
]

/**
 * Shown on the login screen so the prototype can be opened by anyone without a
 * password reset dance. Delete this block when real auth lands.
 */
export const DEMO_ACCOUNTS = [
  {
    email: 'sarah@my30a.com',
    password: 'demo1234',
    label: 'Sarah Whitmore',
    detail: 'Checked in · Rosemary Beach House',
  },
  {
    email: 'alex@my30a.com',
    password: 'demo1234',
    label: 'Alex Rivera',
    detail: 'Account with no stay linked yet',
  },
]

export const findAccountByEmail = (list, email) => {
  const key = String(email ?? '').trim().toLowerCase()
  if (!key) return null
  return list.find((a) => a.email.toLowerCase() === key) ?? null
}
