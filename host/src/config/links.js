/**
 * Where the guest app lives.
 *
 *   VITE_GUEST_APP_URL=https://my30a-user.vercel.app
 */
const FALLBACK_ORIGIN = import.meta.env.DEV ? 'http://localhost:5173' : 'https://my30a-user.vercel.app'

/** Trailing slashes would produce `https://host//guest/x`. */
const trim = (value) => String(value ?? '').replace(/\/+$/, '')

export const GUEST_APP_ORIGIN = trim(import.meta.env?.VITE_GUEST_APP_URL) || FALLBACK_ORIGIN

/**
 * The link a host shares after a booking.
 *
 * The path must match the guest app's route (`/guest/:guestId`) — this is the
 * one string that ties the two deployments together, so it lives in exactly
 * one place.
 */
export function guestLink(slug) {
  return `${GUEST_APP_ORIGIN}/guest/${slug}`
}
