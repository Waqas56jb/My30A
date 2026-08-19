const trim = (value) => String(value ?? '').replace(/\/+$/, '')
const LIVE_API = 'https://my30a-server.vercel.app'
const BASE = trim(import.meta.env.VITE_API_BASE_URL) || (import.meta.env.DEV ? 'http://localhost:4000' : LIVE_API)
export const SOCKET_URL = trim(import.meta.env.VITE_SOCKET_URL) || BASE
export const isLive = () => true

const TOKEN_KEY = 'my30a.host.token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const auth = token ?? getToken()
  if (auth) headers.Authorization = `Bearer ${auth}`
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) {
    const err = new Error(json.error?.message ?? 'Request failed')
    err.code = json.error?.code
    err.field = json.error?.details?.field
    throw err
  }
  return json.data
}
