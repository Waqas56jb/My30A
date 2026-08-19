/**
 * Route smoke test.
 *
 * Mounts the real application in jsdom, walks every route, waits for the mock
 * API to settle, and asserts that each page rendered its actual content - not
 * a skeleton, not an error boundary. Run it twice (mobile + desktop widths)
 * via SMOKE_VIEWPORT so both layouts are covered.
 *
 *   npm run test:routes
 *   SMOKE_VIEWPORT=desktop node --import ./scripts/setup-dom.js .smoke/routes/smoke.js
 *
 * Expectations are kept ASCII-only so the harness never depends on how a
 * terminal or editor encodes typographic punctuation.
 */
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'
import { AppProvider } from '../src/context/AppContext'
import { setLatency } from '../src/services/mockApi'
import { setAuthLatency } from '../src/services/authService'

setLatency(0, 0)
setAuthLatency(0, 0)

const viewport = globalThis.__SMOKE_VIEWPORT__ ?? 'mobile'

const key = (k) => `my30a.guest.v1.${k}`

/**
 * Three states matter, and they are not the same thing:
 *   public — no account at all
 *   authed — logged in, but no stay linked to the account yet
 *   guest  — logged in with a stay
 */
const setSession = (mode) => {
  window.localStorage.removeItem(key('session'))
  window.localStorage.removeItem(key('guestSlug'))

  if (mode === 'guest') {
    window.localStorage.setItem(key('session'), JSON.stringify({ accountId: 'acc_sarah' }))
    window.localStorage.setItem(key('guestSlug'), JSON.stringify('demo'))
  } else if (mode === 'authed' || mode === 'gated') {
    // acc_alex ships with guestSlug: null — an account without a booking.
    window.localStorage.setItem(key('session'), JSON.stringify({ accountId: 'acc_alex' }))
  }
}

/**
 * [route, expected copy, mode]
 * mode: 'public' (default), 'authed', 'guest', or 'gated' (a stay-only route
 * opened by someone logged in without a stay, which must explain itself).
 */
const ROUTES = [
  // ---- The public website ----
  ['/', 'Experience 30A like a local'],
  ['/', 'Experience 30A like a local', 'guest'],

  // ---- Accounts ----
  ['/login', 'Log in'],
  ['/signup', 'Create your account'],
  ['/forgot-password', 'Forgot your password'],
  ['/reset-password', 'This link is not complete'],
  ['/reset-password?token=rst_demo', 'Set a new password'],
  ['/login', 'Welcome back', 'guest'], // already signed in -> straight to the app

  // ---- App home: needs an account ----
  ['/discover', 'Log in'], // no account -> bounced to the login screen
  ['/discover', 'no stay linked yet', 'authed'],
  ['/discover', 'Welcome back', 'guest'],

  // ---- App pages: no account -> login first ----
  ['/explore', 'Log in'],
  ['/vitoria', 'Log in'],
  ['/restaurants', 'Log in'],
  ['/beaches', 'Log in'],
  ['/partners', 'Log in'],
  ['/events', 'Log in'],
  ['/map', 'Log in'],
  ['/area', 'Log in'],

  ['/help', 'Common questions'],

  // ---- Destination pages after login ----
  ['/explore', 'Browse by category', 'guest'],
  ['/experiences/bonfires', 'Make tonight unforgettable', 'guest'],
  ['/experiences/golf-carts', 'Explore 30A your way', 'guest'],
  ['/experiences/biking', 'Ride through 30A', 'guest'],
  ['/experiences/boating', 'Out on the water', 'guest'],
  ['/experiences/wellness', 'Start slow', 'guest'],
  ['/experiences/family', 'Everyone happy', 'guest'],
  ['/experiences/photography', 'Golden hour', 'guest'],
  ['/experiences/golf', 'An early tee time', 'guest'],
  ['/experiences/shopping', 'An afternoon off the sand', 'guest'],
  ['/experiences/outdoor', 'Get properly outside', 'guest'],
  ['/map', 'place', 'guest'],
  ['/area', '30A - Santa Rosa Beach Area', 'guest'],
  ['/search', 'Try one of these', 'guest'],
  ['/vitoria', 'Your 30A local concierge', 'guest'],
  ['/restaurants', 'restaurant', 'guest'],
  ['/restaurants/rest_great_southern', 'Great Southern Cafe', 'guest'],
  ['/restaurants/nope', 'open this listing', 'guest'],
  ['/partners', 'Local partners', 'guest'],
  ['/partners/partner_golfcart_30a', '30A Golf Cart Rentals', 'guest'],
  ['/partners/nope', 'open this listing', 'guest'],
  ['/beaches', 'Beach guide', 'guest'],
  ['/beaches/beach_inlet', 'Inlet Beach Regional Access', 'guest'],
  ['/beaches/nope', 'open this beach', 'guest'],
  ['/events', 'By day', 'guest'],
  ['/events/event_seaside_concert', 'Seaside Summer Concert Series', 'guest'],
  ['/events/nope', 'open this event', 'guest'],
  ['/nope', 'find that page', 'guest'],

  // ---- Personal screens: an account is required ----
  ['/favorites', 'Log in'],
  ['/notifications', 'Log in'],
  ['/settings', 'Log in'],
  ['/favorites', 'Saved places', 'authed'],
  ['/notifications', 'Notifications', 'authed'],
  ['/settings', 'Prototype tools', 'authed'],

  // ---- Access ----
  ['/access', 'Log in'], // linking a stay needs an account first
  ['/access', 'Unlock your stay', 'authed'],
  ['/guest/demo', 'Log in', 'public'], // link accepted, then asked to sign in
  ['/guest/demo', 'House rules', 'authed'],
  ['/guest/nope', 'This link is not active'],
  ['/stay/demo', 'House rules', 'authed'],

  // ---- Stay routes without a stay: must explain, never dead-end ----
  ['/my-stay', 'Enter your code', 'gated'],
  ['/services', 'Enter your code', 'gated'],
  ['/groceries', 'Enter your code', 'gated'],
  ['/transfers/new', 'Enter your code', 'gated'],
  ['/profile', 'Enter your code', 'gated'],

  // ---- Guest routes with an unlocked stay ----
  ['/my-stay', 'House rules', 'guest'],
  ['/my-trip', 'Saved places', 'guest'],
  ['/profile', 'Preferences', 'guest'],
  ['/services', 'Arrange something', 'guest'],
  ['/groceries', 'Arrive to a full kitchen', 'guest'],
  ['/groceries/new', 'When would you like it?', 'guest'],
  ['/groceries/GR-1024', 'Grocery request GR-1024', 'guest'],
  ['/groceries/nope', 'find that request', 'guest'],
  ['/transfers', 'Met at baggage claim', 'guest'],
  ['/transfers/new', 'Estimated price', 'guest'],
  ['/transfers/TR-2048', 'Transfer TR-2048', 'guest'],
  ['/transfers/nope', 'find that transfer', 'guest'],

  // ---- Redirect aliases ----
  ['/home', 'no stay linked yet', 'authed'],
  ['/orders', 'Enter your code', 'gated'],
  ['/property', 'Enter your code', 'gated'],
  ['/register', 'Create your account'],
  ['/sign-up', 'Create your account'],
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

/* Treat React's own complaints as failures - key warnings and invalid DOM
   nesting are real bugs, not noise. */
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

  for (const [route, expected, mode = 'public'] of ROUTES) {
    setSession(mode)
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
            <AppProvider>
              <App />
            </AppProvider>
          </MemoryRouter>,
        )
      })
      // eslint-disable-next-line no-await-in-loop
      await flush()

      const text = container.textContent ?? ''

      if (text.includes('Something went wrong')) throw new Error('error boundary caught a render error')
      if (text.includes('We could not open your stay')) throw new Error('session failed to resolve')
      if (!text.includes(expected)) {
        throw new Error(`expected copy not found: "${expected}" | rendered: ${text.slice(0, 180)}`)
      }

      const newWarnings = consoleErrors.slice(before)
      if (newWarnings.length > 0) throw new Error(`react warning: ${newWarnings[0]}`)

      console.log(`  ok   ${route.padEnd(34)} ${mode.padEnd(6)} ${text.length} chars`)
    } catch (error) {
      failures += 1
      console.log(`  FAIL ${route.padEnd(34)} ${mode.padEnd(6)} ${error.message}`)
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
