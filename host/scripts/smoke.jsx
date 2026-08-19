/**
 * Route smoke test for the host panel.
 *
 * Mounts the real app in jsdom, walks every route, waits for the mock services
 * to settle, and asserts each page rendered its actual content — not a
 * skeleton, not the error boundary, and not the login screen when it should
 * have been authenticated. Runs at mobile and desktop widths.
 *
 *   npm run test:routes
 *   SMOKE_VIEWPORT=desktop node --import ./scripts/setup-dom.js .smoke/routes/smoke.js
 */
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'
import { AuthProvider } from '../src/context/AuthContext'
import { WorkspaceProvider } from '../src/context/WorkspaceContext'
import { setLatency } from '../src/services/mockClient'
import { mockHost } from '../src/data/host'

setLatency(0, 0)

const viewport = globalThis.__SMOKE_VIEWPORT__ ?? 'mobile'
const SESSION_KEY = 'my30a.host.v1.session'

const setSession = (signedIn) => {
  if (signedIn) {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ host: mockHost, signedInAt: '2026-08-17T09:00:00.000Z', remember: true }),
    )
  } else {
    window.localStorage.removeItem(SESSION_KEY)
  }
}

/** [route, expected copy, mode] — 'auth' signs a host in, 'guest' does not. */
const ROUTES = [
  // Unauthenticated
  ['/host/login', 'Sign in', 'guest'],
  ['/host/signup', 'Create your host account', 'guest'],
  ['/host/forgot-password', 'Reset your password', 'guest'],
  ['/host/reset-password?token=demo', 'Choose a new password', 'guest'],
  ['/host/dashboard', 'Sign in', 'guest'], // guarded: bounced to login

  // Authenticated
  ['/host/dashboard', 'Property setup', 'auth'],
  ['/host/onboarding', 'complete', 'auth'],
  ['/host/verify-email', 'Verify your email', 'auth'],
  ['/host/properties', 'My properties', 'auth'],
  ['/host/properties/new', 'Add a property', 'auth'],
  ['/host/properties/prop_rosemary', 'Property details', 'auth'],
  ['/host/properties/prop_rosemary/information', 'Property information', 'auth'],
  ['/host/properties/prop_rosemary/wifi', 'Network name', 'auth'],
  ['/host/properties/prop_rosemary/check-in', 'Arrival instructions', 'auth'],
  ['/host/properties/prop_rosemary/check-out', 'Lock-up instructions', 'auth'],
  ['/host/properties/prop_rosemary/rules', 'House rules', 'auth'],
  ['/host/properties/prop_rosemary/parking', 'Parking', 'auth'],
  ['/host/properties/prop_rosemary/emergency', 'Emergency information', 'auth'],
  ['/host/properties/prop_rosemary/recommendations', 'Local recommendations', 'auth'],
  ['/host/properties/prop_rosemary/photos', 'Photos', 'auth'],
  ['/host/properties/prop_rosemary/guest-access', 'Guest access', 'auth'],
  ['/host/properties/prop_rosemary/vitoria', 'Welcome message', 'auth'],
  ['/host/properties/prop_rosemary/preview', 'Preview', 'auth'],
  ['/host/properties/prop_watercolor', 'Property details', 'auth'],
  ['/host/properties/nope', 'could not find that property', 'auth'],
  ['/host/guests', 'Guests', 'auth'],
  ['/host/guests/guest_sarah', 'Sarah Whitmore', 'auth'],
  ['/host/guests/nope', 'could not find that guest', 'auth'],
  ['/host/vitoria', 'Most common questions', 'auth'],
  ['/host/activity', 'Guest activity', 'auth'],
  ['/host/analytics', 'Analytics', 'auth'],
  ['/host/notifications', 'Notifications', 'auth'],
  ['/host/profile', 'Profile', 'auth'],
  ['/host/settings', 'Prototype tools', 'auth'],
  ['/host/help', 'Help centre', 'auth'],
  ['/host/area', '30A - Santa Rosa Beach Area', 'auth'],
  ['/host/nope', 'find that page', 'auth'],
  ['/', 'Property setup', 'auth'],
  ['/host', 'Property setup', 'auth'],
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const flush = async (times = 8) => {
  for (let i = 0; i < times; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      await sleep(20)
    })
  }
}

/* React's own complaints are treated as failures. */
const consoleErrors = []
const originalError = console.error
console.error = (...args) => {
  const text = args.map(String).join(' ')
  if (
    text.includes('unique "key"') ||
    text.includes('same key') ||
    text.includes('Keys should be unique') ||
    text.includes('Each child in a list') ||
    text.includes('validateDOMNesting') ||
    text.includes('cannot appear as a descendant') ||
    text.includes('React does not recognize') ||
    text.includes('Invalid DOM property') ||
    text.includes('Received `true` for a non-boolean') ||
    text.includes('Unhandled UI error') ||
    text.includes('not wrapped in act')
  ) {
    consoleErrors.push(text.split('\n')[0])
  }
  originalError(...args)
}

async function main() {
  let failures = 0

  for (const [route, expected, mode] of ROUTES) {
    setSession(mode === 'auth')
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const before = consoleErrors.length

    try {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        root.render(
          <MemoryRouter
            initialEntries={[route]}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <AuthProvider>
              <WorkspaceProvider>
                <App />
              </WorkspaceProvider>
            </AuthProvider>
          </MemoryRouter>,
        )
      })
      // eslint-disable-next-line no-await-in-loop
      await flush()

      const text = container.textContent ?? ''

      if (text.includes('Something went wrong')) throw new Error('error boundary caught a render error')
      if (!text.includes(expected)) {
        throw new Error(`expected copy not found: "${expected}" | rendered: ${text.slice(0, 180)}`)
      }

      const newWarnings = consoleErrors.slice(before)
      if (newWarnings.length > 0) throw new Error(`react warning: ${newWarnings[0]}`)

      console.log(`  ok   ${route.padEnd(46)} ${mode.padEnd(5)} ${text.length} chars`)
    } catch (error) {
      failures += 1
      console.log(`  FAIL ${route.padEnd(46)} ${mode.padEnd(5)} ${error.message}`)
    } finally {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        root.unmount()
      })
      container.remove()
    }
  }

  console.log(
    failures === 0
      ? `\n[${viewport}] all ${ROUTES.length} routes rendered content.`
      : `\n[${viewport}] ${failures} of ${ROUTES.length} routes failed.`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main()
