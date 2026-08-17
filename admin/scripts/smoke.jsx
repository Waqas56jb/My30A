/**
 * Route smoke test.
 *
 * Mounts the real application in jsdom, walks every route, waits for the mock
 * API to settle, and asserts each page rendered its actual content — not a
 * skeleton, not an error boundary. Run it twice (mobile + desktop widths) via
 * SMOKE_VIEWPORT so both the card layout and the table layout are covered.
 *
 *   npm run test:routes
 *   SMOKE_VIEWPORT=desktop node --import ./scripts/setup-dom.js .smoke/routes/smoke.js
 *
 * Expectations are ASCII-only so the harness never depends on how a terminal
 * or editor encodes typographic punctuation.
 */
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'
import { AdminProvider } from '../src/context/AdminContext'
import { setLatency } from '../src/services/mockClient'
import { setAuthLatency } from '../src/services/authService'
import { resetAll } from '../src/services/adminApi'

setLatency(0, 0)
setAuthLatency(0, 0)

const viewport = globalThis.__SMOKE_VIEWPORT__ ?? 'mobile'

const key = (k) => `my30a.admin.v1.${k}`

/** 'out' = signed out, otherwise a role from the demo accounts. */
const setSession = (mode) => {
  if (mode === 'out') {
    window.localStorage.removeItem(key('session'))
    return
  }
  const email =
    { finance: 'priya@my30a.com', content: 'tom@my30a.com', support: 'sofia@my30a.com' }[mode] ??
    'alicia@my30a.com'
  window.localStorage.setItem(key('session'), JSON.stringify({ email, role: mode === 'admin' ? 'super_admin' : mode }))
}

/** [route, expected copy, mode] */
const ROUTES = [
  // ---- Auth ----
  ['/admin/login', 'Sign in', 'out'],
  ['/admin/forgot-password', 'Forgot your password', 'out'],
  ['/admin/dashboard', 'Sign in', 'out'], // guarded -> bounced to login

  // ---- Command centres ----
  ['/admin/dashboard', 'Total guests'],
  ['/admin/operations', 'Needs attention'],

  // ---- Users ----
  ['/admin/guests', 'Everyone with a stay on 30A'],
  ['/admin/guests/guest_001', 'Timeline'],
  ['/admin/guests/nope', 'could not find'],
  ['/admin/hosts', 'Property owners and managers'],
  ['/admin/hosts/host_001', 'Subscription'],
  ['/admin/hosts/nope', 'could not find'],
  ['/admin/partners', 'Referral activity only'],
  ['/admin/partners/ptr_glowflow', 'Waiting for review'],
  ['/admin/partners/ptr_golfcarts', 'Referral activity'],
  ['/admin/partners/nope', 'could not find'],
  ['/admin/admin-users', 'Permission matrix'],

  // ---- Properties ----
  ['/admin/properties', 'Every home on the platform'],
  ['/admin/properties/prop_001', 'Arrival and departure'],
  ['/admin/properties/nope', 'could not find'],

  // ---- Local Guide ----
  ['/admin/local-guide', 'Categories'],
  ['/admin/local-guide/categories', 'The buckets guests browse by'],
  ['/admin/local-guide/listings', 'What guests actually see'],
  ['/admin/local-guide/featured', 'Currently featured'],

  // ---- Services ----
  ['/admin/grocery', 'Guests send a list'],
  ['/admin/grocery/GR-1000', 'Workflow'],
  ['/admin/grocery/nope', 'could not find'],
  ['/admin/transfers', 'A My30A-managed service from ECP'],
  ['/admin/transfers/TR-2000', 'Journey'],
  ['/admin/transfers/nope', 'could not find'],
  ['/admin/service-requests', 'Grocery deliveries and airport transfers in one queue'],

  // ---- Vitoria ----
  ['/admin/vitoria', 'Handled automatically'],
  ['/admin/vitoria/conversations', 'Every exchange between a guest and Vitoria'],
  ['/admin/vitoria/conversations/conv_0001', 'Conversation'],
  ['/admin/vitoria/conversations/nope', 'could not find'],
  ['/admin/vitoria/activity', 'Response time'],
  ['/admin/vitoria/knowledge', 'Management interface only'],
  ['/admin/vitoria/automation', 'Nothing runs in this build'],

  // ---- Payments ----
  ['/admin/payments', 'Every payment My30A takes'],
  ['/admin/payments/refunds', 'Cancellation rules'],
  ['/admin/payments/tips', 'Tip rates chosen'],
  ['/admin/subscriptions', 'Monthly recurring'],

  // ---- Analytics ----
  ['/admin/analytics', 'Go deeper'],
  ['/admin/analytics/guests', 'Discovery funnel'],
  ['/admin/analytics/partners', 'What is not tracked'],
  ['/admin/analytics/services', 'Completion rate'],
  ['/admin/analytics/revenue', 'Net revenue'],

  // ---- The rest ----
  ['/admin/reviews', 'Distribution'],
  ['/admin/notifications', 'Nothing sends in this build'],
  ['/admin/content', 'Content blocks'],
  ['/admin/media', 'Mock uploads'],
  ['/admin/reports', 'Choose a report'],
  ['/admin/audit', 'Every change made in this panel'],
  ['/admin/settings', 'Platform configuration'],
  ['/admin/nope', 'cannot find that page'],

  // ---- Role-limited navigation ----
  ['/admin/dashboard', 'Total guests', 'finance'],
  ['/admin/dashboard', 'Total guests', 'content_manager'],
  ['/admin/dashboard', 'Total guests', 'support'],

  // ---- Aliases ----
  ['/', 'Total guests'],
  ['/admin', 'Total guests'],
  ['/login', 'Sign in', 'out'],
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

/* React's own complaints are failures — key warnings and invalid DOM nesting
   are real bugs, not noise. */
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

  for (const [route, expected, mode = 'admin'] of ROUTES) {
    resetAll()
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
            <AdminProvider>
              <App />
            </AdminProvider>
          </MemoryRouter>,
        )
      })
      // eslint-disable-next-line no-await-in-loop
      await flush()

      const text = container.textContent ?? ''

      if (text.includes('This screen crashed')) throw new Error('error boundary caught a render error')
      if (!text.includes(expected)) {
        throw new Error(`expected copy not found: "${expected}" | rendered: ${text.slice(0, 200)}`)
      }

      const newWarnings = consoleErrors.slice(before)
      if (newWarnings.length > 0) throw new Error(`react warning: ${newWarnings[0]}`)

      console.log(`  ok   ${route.padEnd(44)} ${mode.padEnd(15)} ${text.length} chars`)
    } catch (error) {
      failures += 1
      console.log(`  FAIL ${route.padEnd(44)} ${mode.padEnd(15)} ${error.message}`)
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
