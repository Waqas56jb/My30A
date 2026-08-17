/**
 * Shared transport for every mock service.
 *
 * Each service talks to `request()` the way it would eventually talk to fetch:
 * async, JSON-in / JSON-out, able to fail. Swapping these for real endpoints
 * should not require touching a single component.
 */

let latency = [180, 460]
let failureMode = false
let failNext = false

export const setLatency = (min, max) => {
  latency = [min, max]
}
export const setFailureMode = (on) => {
  failureMode = !!on
}
export const getFailureMode = () => failureMode
export const failOnce = () => {
  failNext = true
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const clone = (value) => (value === undefined ? value : JSON.parse(JSON.stringify(value)))

export async function request(factory, { label = 'that', fail = false } = {}) {
  const [min, max] = latency
  await wait(min + Math.random() * (max - min))

  if (failNext || failureMode || fail) {
    failNext = false
    const error = new Error(`We could not load ${label}. Check your connection and try again.`)
    error.code = 'MOCK_NETWORK_ERROR'
    throw error
  }

  return typeof factory === 'function' ? factory() : factory
}

export function notFound(what) {
  const error = new Error(`We could not find ${what}.`)
  error.code = 'NOT_FOUND'
  return error
}

/* --------------------------------------------------------------------------
   Tiny pub/sub so the services can tell React something changed without the
   pages having to re-poll.
   -------------------------------------------------------------------------- */
const listeners = new Map()

export function publish(topic, payload) {
  ;(listeners.get(topic) ?? new Set()).forEach((fn) => fn(payload))
}

export function subscribe(topic, fn) {
  if (!listeners.has(topic)) listeners.set(topic, new Set())
  listeners.get(topic).add(fn)
  return () => listeners.get(topic)?.delete(fn)
}
