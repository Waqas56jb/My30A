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

/** route -> a string that only appears once the page has really rendered. */
const ROUTES = [
  ['/', 'personal concierge'],
  ['/guest/demo', 'Welcome to 30A'],
  ['/guest/daniel', 'Welcome to 30A'],
  ['/guest/nope', 'This link is not active'],
  ['/home', 'Vitoria is here to make your stay effortless'],
  ['/vitoria', 'Your 30A local concierge'],
  ['/explore', 'Browse by category'],
  ['/map', 'place'],
  ['/restaurants', 'restaurant'],
  ['/restaurants/rest_great_southern', 'Great Southern Cafe'],
  ['/restaurants/nope', 'open this listing'],
  ['/partners', 'Local partners'],
  ['/partners/partner_bike_beachside', 'Beachside Bike Rentals'],
  ['/partners/nope', 'open this listing'],
  ['/beaches', 'Beach guide'],
  ['/beaches/beach_inlet', 'Inlet Beach Regional Access'],
  ['/beaches/nope', 'open this beach'],
  ['/events', 'By day'],
  ['/events/event_seaside_concert', 'Seaside Summer Concert Series'],
  ['/events/nope', 'open this event'],
  ['/services', 'Arrange something'],
  ['/groceries', 'Arrive to a full kitchen'],
  ['/groceries/new', 'When would you like it?'],
  ['/groceries/GR-1024', 'Grocery request GR-1024'],
  ['/groceries/nope', 'find that request'],
  ['/transfers', 'Met at baggage claim'],
  ['/transfers/new', 'Estimated price'],
  ['/transfers/TR-2048', 'Transfer TR-2048'],
  ['/transfers/nope', 'find that transfer'],
  ['/my-stay', 'House rules'],
  ['/my-trip', 'Saved places'],
  ['/notifications', 'Notifications'],
  ['/profile', 'Preferences'],
  ['/settings', 'Prototype tools'],
  ['/orders', 'Arrange something'],
  ['/property', 'House rules'],
  ['/nope', 'find that page'],
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

  for (const [route, expected] of ROUTES) {
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

      console.log(`  ok   ${route.padEnd(38)} ${text.length} chars`)
    } catch (error) {
      failures += 1
      console.log(`  FAIL ${route.padEnd(38)} ${error.message}`)
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
