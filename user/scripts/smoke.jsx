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

setLatency(0, 0)

const viewport = globalThis.__SMOKE_VIEWPORT__ ?? 'mobile'

const SLUG_KEY = 'my30a.guest.v1.guestSlug'

/** Public browsing has no stay attached; guest routes need an unlocked one. */
const setSession = (unlocked) => {
  if (unlocked) window.localStorage.setItem(SLUG_KEY, JSON.stringify('demo'))
  else window.localStorage.removeItem(SLUG_KEY)
}

/**
 * [route, expected copy, mode]
 * mode: 'public' (default), 'guest' (seed a stay), or 'gated' (guest route
 * visited without a stay, which must explain itself rather than dead-end).
 */
const ROUTES = [
  // ---- The public website ----
  ['/', 'Experience 30A like a local'],
  ['/', 'Experience 30A like a local', 'guest'],

  // ---- Public destination experience (inside the app shell) ----
  ['/discover', 'Staying on 30A'],
  ['/explore', 'Browse by category'],
  ['/experiences/bonfires', 'Make tonight unforgettable'],
  ['/experiences/golf-carts', 'Explore 30A your way'],
  ['/experiences/biking', 'Ride through 30A'],
  ['/experiences/boating', 'Out on the water'],
  ['/experiences/wellness', 'Start slow'],
  ['/experiences/family', 'Everyone happy'],
  ['/experiences/photography', 'Golden hour'],
  ['/experiences/golf', 'An early tee time'],
  ['/experiences/shopping', 'An afternoon off the sand'],
  ['/experiences/outdoor', 'Get properly outside'],
  ['/map', 'place'],
  ['/search', 'Try one of these'],
  ['/favorites', 'Saved places'],
  ['/help', 'Common questions'],
  ['/vitoria', 'Your 30A local concierge'],
  ['/restaurants', 'restaurant'],
  ['/restaurants/rest_great_southern', 'Great Southern Cafe'],
  ['/restaurants/nope', 'open this listing'],
  ['/partners', 'Local partners'],
  ['/partners/partner_golfcart_30a', '30A Golf Cart Rentals'],
  ['/partners/nope', 'open this listing'],
  ['/beaches', 'Beach guide'],
  ['/beaches/beach_inlet', 'Inlet Beach Regional Access'],
  ['/beaches/nope', 'open this beach'],
  ['/events', 'By day'],
  ['/events/event_seaside_concert', 'Seaside Summer Concert Series'],
  ['/events/nope', 'open this event'],
  ['/notifications', 'Notifications'],
  ['/settings', 'Prototype tools'],
  ['/nope', 'find that page'],

  // ---- Access ----
  ['/access', 'Unlock your stay'],
  ['/guest/demo', 'House rules', 'public'],
  ['/guest/nope', 'This link is not active'],
  ['/stay/demo', 'House rules', 'public'],

  // ---- Guest routes without a stay: must explain, never dead-end ----
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
  ['/discover', 'Welcome back', 'guest'],

  // ---- Redirect aliases ----
  ['/home', 'Staying on 30A'],
  ['/orders', 'Enter your code', 'gated'],
  ['/property', 'Enter your code', 'gated'],
  ['/login', 'Unlock your stay'],
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
    setSession(mode === 'guest')
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
