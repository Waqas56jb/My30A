/**
 * Route smoke test for the partner portal.
 *
 * Mounts the real app in jsdom, walks every route signed in and signed out,
 * and asserts each page rendered its actual content — not a skeleton, not the
 * error boundary, and not the login screen when it should have been
 * authenticated. Runs at mobile and desktop widths.
 *
 *   npm run test:routes
 *   SMOKE_VIEWPORT=desktop node --import ./scripts/setup-dom.js .smoke/routes/smoke.js
 */
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'
import { PartnerProvider } from '../src/context/PartnerContext'
import { setLatency } from '../src/services/mockClient'

setLatency(0, 0)

const viewport = globalThis.__SMOKE_VIEWPORT__ ?? 'mobile'
const SESSION_KEY = 'my30a.partner.v1.session'

const setSession = (partnerId) => {
  if (partnerId) {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ partnerId, email: 'demo@example.com', signedInAt: '2026-08-17T09:00:00.000Z' }),
    )
  } else {
    window.localStorage.removeItem(SESSION_KEY)
  }
}

/** [route, expected copy, sessionPartnerId | null] */
const ROUTES = [
  // Public
  ['/partner/login', 'Sign in', null],
  ['/partner/register', 'Bring your business to 30A', null],
  ['/partner/forgot-password', 'Reset your password', null],
  ['/partner/reset-password?token=demo', 'Choose a new password', null],
  ['/partner/dashboard', 'Sign in', null], // guarded

  // Approved partner
  ['/partner/dashboard', 'Profile performance', 'ptr_glowflow'],
  ['/partner/profile', 'Business information', 'ptr_glowflow'],
  ['/partner/photos', 'Sell the experience', 'ptr_glowflow'],
  ['/partner/preview', 'Listing preview', 'ptr_glowflow'],
  ['/partner/analytics', 'Guest interest', 'ptr_glowflow'],
  ['/partner/notifications', 'Notifications', 'ptr_glowflow'],
  ['/partner/settings', 'Danger zone', 'ptr_glowflow'],
  ['/partner/help', 'How My30A works', 'ptr_glowflow'],
  ['/partner/nope', 'find that page', 'ptr_glowflow'],
  ['/', 'Profile performance', 'ptr_glowflow'],
  ['/partner', 'Profile performance', 'ptr_glowflow'],

  // Every listing status has to be reachable and legible
  ['/partner/dashboard', 'waiting for review', 'ptr_photo'],
  ['/partner/dashboard', 'need a few changes', 'ptr_wellness'],
  ['/partner/dashboard', 'temporarily unavailable', 'ptr_boating'],
  ['/partner/analytics', 'Not enough activity yet', 'ptr_wellness'],
  ['/partner/preview', 'still being reviewed', 'ptr_photo'],
  // The empty-gallery state is exercised in the flow suite, by deleting the
  // last photo — no fixture ships with zero.
  ['/partner/photos', 'Sell the experience', 'ptr_photo'],
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

  for (const [route, expected, partnerId] of ROUTES) {
    setSession(partnerId)
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
            <PartnerProvider>
              <App />
            </PartnerProvider>
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

      console.log(`  ok   ${route.padEnd(38)} ${(partnerId ?? 'public').padEnd(13)} ${text.length} chars`)
    } catch (error) {
      failures += 1
      console.log(`  FAIL ${route.padEnd(38)} ${(partnerId ?? 'public').padEnd(13)} ${error.message}`)
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
