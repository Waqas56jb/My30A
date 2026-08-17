/**
 * Where the guest app lives.
 *
 * The host panel and the guest app are deployed as two separate Vercel
 * projects, so the host panel cannot know the guest domain by itself. It is
 * configurable, with a sensible production default:
 *
 *   VITE_GUEST_APP_URL=https://my30a.com        (Vercel → Settings → Environment Variables)
 *
 * Nothing breaks if it is unset — the default below is used instead.
 */
const FALLBACK_ORIGIN = 'https://my30a.com'

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
