/**
 * Interaction test for the partner portal.
 *
 * The route test proves pages render; this drives what a partner actually
 * does — applying, signing in, editing the listing, managing photos, reading
 * their analytics, and confirming the portal never offers a booking or a
 * payment anywhere.
 *
 *   npm run test:flows
 *
 * Expectations are ASCII-only so the harness never depends on how a terminal
 * encodes typographic punctuation.
 */
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'
import { PartnerProvider } from '../src/context/PartnerContext'
import { setLatency, setFailureMode } from '../src/services/mockClient'
import { resetPartners } from '../src/services/partnerService'
import { resetNotifications } from '../src/services/notificationService'

setLatency(0, 0)

const SESSION_KEY = 'my30a.partner.v1.session'

const signIn = (partnerId = 'ptr_glowflow') =>
  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ partnerId, email: 'demo@example.com', signedInAt: '2026-08-17T09:00:00.000Z' }),
  )
const signOutStorage = () => window.localStorage.removeItem(SESSION_KEY)

const resetAll = () => {
  resetPartners()
  resetNotifications()
  window.localStorage.removeItem('my30a.partner.v1.settings')
}

/* ------------------------------- helpers -------------------------------- */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const flush = async (times = 10) => {
  for (let i = 0; i < times; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      await sleep(25)
    })
  }
}

async function mount(route, { partnerId = 'ptr_glowflow' } = {}) {
  if (partnerId) signIn(partnerId)
  else signOutStorage()

  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
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
  await flush()
  return {
    container,
    text: () => container.textContent ?? '',
    async destroy() {
      await act(async () => root.unmount())
      container.remove()
    },
  }
}

const all = (container, selector) => Array.from(container.querySelectorAll(selector))

function findByText(container, label, selector = 'button, a, label') {
  const hit = all(container, selector).find((el) => (el.textContent ?? '').includes(label))
  if (!hit) throw new Error(`no element matching "${label}"`)
  return hit
}

function findByLabel(container, label) {
  const hit = all(container, '[aria-label]').find((el) =>
    (el.getAttribute('aria-label') ?? '').includes(label),
  )
  if (!hit) throw new Error(`no element labelled "${label}"`)
  return hit
}

const fieldByLabel = (container, labelText) => {
  const labels = all(container, 'label')
  const label = labels.find((el) => (el.textContent ?? '').trim().startsWith(labelText))
  if (!label) {
    const seen = labels.map((el) => `"${(el.textContent ?? '').trim()}"`).join(', ')
    throw new Error(`no field labelled "${labelText}" (saw: ${seen || 'none'})`)
  }
  const control = label.control ?? label.closest('.field')?.querySelector('input, textarea, select')
  if (!control) throw new Error(`field "${labelText}" has no control`)
  return control
}

async function click(el) {
  await act(async () => {
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }))
  })
  await flush(4)
}

async function type(el, value) {
  const proto =
    el instanceof window.HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
  await act(async () => {
    setter.call(el, value)
    el.dispatchEvent(new window.Event('input', { bubbles: true }))
  })
  await flush(2)
}

/* -------------------------------- suite --------------------------------- */

const tests = []
const test = (name, fn) => tests.push([name, fn])

/* --------------------------------- Auth --------------------------------- */

test('Login rejects an unknown email and accepts a partner account', async () => {
  resetAll()
  const page = await mount('/partner/login', { partnerId: null })

  await type(fieldByLabel(page.container, 'Email'), 'nobody@example.com')
  await type(fieldByLabel(page.container, 'Password'), 'whatever1')
  await click(findByText(page.container, 'Sign in', 'button[type="submit"]'))
  await flush(8)
  if (!page.text().includes('No partner account matches'))
    throw new Error('an unknown email was accepted')

  await type(fieldByLabel(page.container, 'Email'), 'hello@glowandflow30a.com')
  await click(findByText(page.container, 'Sign in', 'button[type="submit"]'))
  await flush(14)
  if (!page.text().includes('Profile performance')) throw new Error('did not land on the dashboard')
  await page.destroy()
})

test('Demo accounts cover every listing status', async () => {
  const page = await mount('/partner/login', { partnerId: null })
  await click(findByText(page.container, 'Show demo accounts'))
  await flush(4)

  const text = page.text()
  for (const status of ['Approved', 'Pending review', 'Needs changes', 'Suspended']) {
    if (!text.includes(status)) throw new Error(`no demo account in the "${status}" state`)
  }
  await page.destroy()
})

test('Signing out returns to login and protects the dashboard', async () => {
  const page = await mount('/partner/settings')
  await click(findByText(page.container, 'Sign out', '.setting-row'))
  await flush(4)
  if (!document.body.textContent.includes('Sign out?')) throw new Error('no confirmation dialog')

  await click(findByText(document.body, 'Sign out', '.modal button'))
  await flush(12)
  if (!page.text().includes('Sign in')) throw new Error('did not return to the login screen')
  await page.destroy()
})

/* ------------------------------ Registration ----------------------------- */

test('Application validates each step and submits to pending review', async () => {
  resetAll()
  const page = await mount('/partner/register', { partnerId: null })

  // Step 1
  await click(findByText(page.container, 'Continue'))
  if (!page.text().includes('what to search for')) throw new Error('empty business name was accepted')
  await type(fieldByLabel(page.container, 'Business name'), 'Seagrove Paddle Co.')
  await type(fieldByLabel(page.container, 'Owner or contact name'), 'Alex Rivera')
  await click(findByText(page.container, 'Continue'))

  // Step 2
  if (!page.text().includes('Contact & location')) throw new Error('did not reach contact step')
  await click(findByText(page.container, 'Continue'))
  if (!page.text().includes('valid email address')) throw new Error('missing email was accepted')
  await type(fieldByLabel(page.container, 'Email'), 'hello@seagrovepaddle.com')
  await type(fieldByLabel(page.container, 'Phone'), '(850) 555-0400')
  await type(fieldByLabel(page.container, 'City'), 'Seagrove Beach')
  await click(findByText(page.container, 'Continue'))

  // Step 3
  if (!page.text().includes('Your story')) throw new Error('did not reach the story step')
  await click(findByText(page.container, 'Continue'))
  if (!page.text().includes('couple of sentences')) throw new Error('short description was accepted')
  await type(
    fieldByLabel(page.container, 'Description'),
    'Paddleboards delivered to the dune lakes at sunrise, when the water is glass and nobody else is out there yet.',
  )
  await click(findByText(page.container, 'Continue'))

  // Step 4 — photos are required
  if (!page.text().includes('Photos')) throw new Error('did not reach the photos step')
  await click(findByText(page.container, 'Continue'))
  if (!page.text().includes('at least one photo')) throw new Error('no photos was accepted')
  await click(all(page.container, '.gal-tile')[0])
  await click(findByText(page.container, 'Continue'))

  // Step 5 — terms
  if (!page.text().includes('Review and submit')) throw new Error('did not reach review')
  await click(findByText(page.container, 'Submit for Approval'))
  if (!page.text().includes('accept the partner terms')) throw new Error('terms were not required')
  await click(page.container.querySelector('.checkbox input'))
  await click(findByText(page.container, 'Submit for Approval'))
  await flush(16)

  const text = page.text()
  if (!text.includes('has been submitted')) throw new Error('no success state after submitting')
  if (!text.includes('Pending review')) throw new Error('new listing did not start as pending')
  await page.destroy()
})

test('The application preview updates as the partner types', async () => {
  resetAll()
  const page = await mount('/partner/register', { partnerId: null })
  const preview = page.container.querySelector('.reg__preview')
  if (!preview) throw new Error('no live preview beside the form')

  await type(fieldByLabel(page.container, 'Business name'), 'Seagrove Paddle Co.')
  await flush(4)
  if (!preview.textContent.includes('Seagrove Paddle Co.'))
    throw new Error('preview did not follow the business name')

  // With no price entered, the listing must say so rather than invent one.
  if (!preview.textContent.includes('Contact for pricing'))
    throw new Error('preview should fall back to "Contact for pricing"')
  await page.destroy()
})

/* ------------------------------- Profile --------------------------------- */

test('Profile validates, saves, and the preview follows the draft', async () => {
  resetAll()
  const page = await mount('/partner/profile')

  await type(fieldByLabel(page.container, 'Business name'), '')
  await click(findByText(page.container, 'Save changes'))
  await flush(6)
  if (!page.text().includes('what to search for')) throw new Error('empty business name was accepted')

  await type(fieldByLabel(page.container, 'Business name'), 'Glow & Flow 30A Bonfires')
  await flush(4)
  const preview = page.container.querySelector('.listing')
  if (!preview.textContent.includes('Glow & Flow 30A Bonfires'))
    throw new Error('preview did not follow the draft')

  await click(findByText(page.container, 'Save changes'))
  await flush(12)
  if (!page.text().includes('All changes saved')) throw new Error('save bar did not settle')
  await page.destroy()
})

test('Pricing is optional and falls back to "Contact for pricing"', async () => {
  resetAll()
  const page = await mount('/partner/profile')
  if (!page.text().includes('Starting from')) throw new Error('expected a published price to start')

  await click(findByText(page.container, 'Show a starting price', 'label'))
  await flush(6)
  const preview = page.container.querySelector('.listing')
  if (!preview.textContent.includes('Contact for pricing'))
    throw new Error('turning pricing off did not fall back correctly')
  await page.destroy()
})

/* -------------------------------- Photos --------------------------------- */

test('Photos can be added, featured, re-covered and deleted', async () => {
  resetAll()
  const page = await mount('/partner/photos')
  const before = all(page.container, '.gal-tile').length
  if (before === 0) throw new Error('fixture photos did not render')

  await click(findByText(page.container, 'Upload image'))
  await flush(4)
  await click(findByText(document.body, 'Add photo', '.modal__foot button'))
  await flush(14)
  if (all(page.container, '.gal-tile').length <= before) throw new Error('photo was not added')

  // Make the last photo the cover.
  const setCover = all(page.container, '[aria-label^="Set "]')[0]
  await click(setCover)
  await flush(10)
  if (!page.text().includes('Cover')) throw new Error('cover badge missing after change')

  // Delete one, with a confirmation first.
  const count = all(page.container, '.gal-tile').length
  await click(all(page.container, '[aria-label^="Delete "]')[0])
  await flush(4)
  if (!document.body.textContent.includes('Delete this photo?')) throw new Error('no confirmation')
  await click(findByText(document.body, 'Delete photo', '.modal button'))
  await flush(12)
  if (all(page.container, '.gal-tile').length !== count - 1) throw new Error('photo was not deleted')
  await page.destroy()
})

test('Emptying the gallery shows the photography empty state', async () => {
  resetAll()
  const page = await mount('/partner/photos', { partnerId: 'ptr_wellness' })

  // This fixture ships with a single photo — remove it.
  await click(all(page.container, '[aria-label^="Delete "]')[0])
  await flush(4)
  await click(findByText(document.body, 'Delete photo', '.modal button'))
  await flush(14)

  const text = page.text()
  if (!text.includes('deserves great photography')) throw new Error('no empty state for an empty gallery')
  if (!text.includes('Upload your first photo')) throw new Error('empty state has no way forward')
  await page.destroy()
})

/* -------------------------------- Preview -------------------------------- */

test('Preview records an outbound event instead of taking a booking', async () => {
  resetAll()
  const page = await mount('/partner/preview')

  await click(findByText(page.container, 'Website', '.listing__ctas button'))
  await flush(6)

  const text = page.text()
  if (!text.includes('Website click recorded')) throw new Error('outbound event was not recorded')
  if (!text.includes('website_click')) throw new Error('the logged event shape is not shown')

  await click(findByText(page.container, 'Call', '.listing__ctas button'))
  await flush(6)
  if (!page.text().includes('Phone click recorded')) throw new Error('phone event was not recorded')
  await page.destroy()
})

test('Nothing anywhere offers a booking, checkout or payment', async () => {
  resetAll()
  const banned = [
    'Book now',
    'Add to cart',
    'Checkout',
    'Pay now',
    'Payment',
    'Commission',
    'Payout',
    'Order',
    'Invoice',
  ]

  for (const route of [
    '/partner/dashboard',
    '/partner/profile',
    '/partner/photos',
    '/partner/preview',
    '/partner/analytics',
    '/partner/settings',
    '/partner/help',
  ]) {
    // eslint-disable-next-line no-await-in-loop
    const page = await mount(route)
    const text = page.text()
    for (const word of banned) {
      if (text.includes(word)) throw new Error(`"${word}" appears on ${route} — this is a referral portal`)
    }
    // eslint-disable-next-line no-await-in-loop
    await page.destroy()
  }
})

test('The tracking policy is stated on the pages that show numbers', async () => {
  for (const route of ['/partner/dashboard', '/partner/analytics', '/partner/preview']) {
    // eslint-disable-next-line no-await-in-loop
    const page = await mount(route)
    const text = page.text()
    if (!text.includes('We track')) throw new Error(`${route} does not say what is tracked`)
    if (!text.includes('We do not track')) throw new Error(`${route} does not say what is not tracked`)
    if (!text.includes('Purchases made on your website'))
      throw new Error(`${route} does not disclaim off-platform purchases`)
    // eslint-disable-next-line no-await-in-loop
    await page.destroy()
  }
})

/* ------------------------------- Analytics ------------------------------- */

test('Analytics renders charts and switches range and metric', async () => {
  const page = await mount('/partner/analytics')
  if (all(page.container, 'svg.chart__svg').length === 0) throw new Error('no charts rendered')
  if (!page.text().includes('1,284')) throw new Error('30-day profile views missing')

  await click(findByText(page.container, '7 days', '.segmented button'))
  await flush(10)
  if (!page.text().includes('312')) throw new Error('range switch did not change the totals')

  await click(findByText(page.container, 'Phone', '.segmented button'))
  await flush(8)
  if (all(page.container, 'svg.chart__svg').length === 0)
    throw new Error('charts disappeared after switching metric')
  await page.destroy()
})

test('A partner with no activity gets an empty state, not an empty chart', async () => {
  const page = await mount('/partner/analytics', { partnerId: 'ptr_wellness' })
  if (!page.text().includes('Not enough activity yet')) throw new Error('empty analytics state missing')
  if (all(page.container, 'svg.chart__svg').length > 0) throw new Error('rendered a chart with no data')
  await page.destroy()
})

/* --------------------------- Status behaviour ---------------------------- */

test('A rejected listing shows the reason and can be resubmitted', async () => {
  resetAll()
  const page = await mount('/partner/dashboard', { partnerId: 'ptr_wellness' })

  const text = page.text()
  if (!text.includes('need a few changes')) throw new Error('rejected banner missing')
  if (!text.includes('could not verify a working website')) throw new Error('rejection reason missing')

  await click(findByText(page.container, 'Resubmit for review'))
  await flush(14)
  if (!page.text().includes('waiting for review')) throw new Error('resubmit did not move to pending')
  await page.destroy()
})

test('A suspended listing explains why and points at the fix', async () => {
  const page = await mount('/partner/dashboard', { partnerId: 'ptr_boating' })
  const text = page.text()
  if (!text.includes('temporarily unavailable')) throw new Error('suspended banner missing')
  if (!text.includes('unreachable for eleven days')) throw new Error('suspension reason missing')
  if (!text.includes('Update your details')) throw new Error('no route to fixing it')
  await page.destroy()
})

/* ----------------------------- Shell behaviour --------------------------- */

test('Mobile drawer opens, navigates and closes', async () => {
  const page = await mount('/partner/dashboard')
  await click(findByLabel(page.container.querySelector('.ptop'), 'Open menu'))
  await flush(4)

  const drawer = document.body.querySelector('.pdrawer')
  if (!drawer) throw new Error('drawer did not open')
  if (!drawer.textContent.includes('How My30A works')) throw new Error('drawer is missing nav links')

  await click(findByText(drawer, 'Analytics', '.pside__item'))
  await flush(10)
  if (document.body.querySelector('.pdrawer')) throw new Error('drawer stayed open after navigating')
  if (!page.text().includes('Guest interest')) throw new Error('navigation failed')
  await page.destroy()
})

test('Notifications can be marked read', async () => {
  resetAll()
  const page = await mount('/partner/notifications')
  if (all(page.container, '.notif--unread').length === 0)
    throw new Error('expected unread notifications')

  await click(findByText(page.container, 'Mark all read'))
  await flush(10)
  if (all(page.container, '.notif--unread').length !== 0)
    throw new Error('notifications were not marked read')
  await page.destroy()
})

test('Settings toggles flip and account visibility is honoured', async () => {
  resetAll()
  const page = await mount('/partner/settings')
  const toggle = all(page.container, '.switch').find(
    (el) => el.getAttribute('aria-label') === 'Account visibility',
  )
  if (!toggle) throw new Error('visibility switch not found')

  const before = toggle.getAttribute('aria-checked')
  await click(toggle)
  await flush(6)
  if (toggle.getAttribute('aria-checked') === before) throw new Error('switch did not toggle')
  await page.destroy()
})

test('Error state appears when a service fails, and retry recovers', async () => {
  resetAll()
  const page = await mount('/partner/analytics')
  setFailureMode(true)

  await click(findByText(page.container, '90 days', '.segmented button'))
  await flush(10)
  if (!page.text().includes('Try again')) throw new Error('no error state while failing')

  setFailureMode(false)
  await click(findByText(page.container, 'Try again'))
  await flush(12)
  if (page.text().includes('Try again')) throw new Error('retry did not recover')
  await page.destroy()
})

/* -------------------------------- runner -------------------------------- */

async function main() {
  let failures = 0
  for (const [name, fn] of tests) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await fn()
      console.log(`  ok   ${name}`)
    } catch (error) {
      failures += 1
      console.log(`  FAIL ${name}\n       ${error.message}`)
    }
  }
  console.log(
    failures === 0 ? `\nAll ${tests.length} flows passed.` : `\n${failures} of ${tests.length} flows failed.`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main()
