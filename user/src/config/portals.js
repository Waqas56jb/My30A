const trim = (value) => String(value ?? '').replace(/\/+$/, '')

const HOST_FALLBACK = import.meta.env.DEV ? 'http://localhost:5180' : 'https://my30a-host.vercel.app'
const PARTNER_FALLBACK = import.meta.env.DEV ? 'http://localhost:5185' : 'https://my30a-partner.vercel.app'

export const HOST_APP_ORIGIN = trim(import.meta.env.VITE_HOST_APP_URL) || HOST_FALLBACK
export const PARTNER_APP_ORIGIN = trim(import.meta.env.VITE_PARTNER_APP_URL) || PARTNER_FALLBACK

export const hostSignupUrl = `${HOST_APP_ORIGIN}/host/signup`
export const partnerRegisterUrl = `${PARTNER_APP_ORIGIN}/partner/register`
