/**
 * Interaction test for the host panel.
 *
 * The route test proves pages render; this drives what a host actually does —
 * signing in, saving property information, adding rules and recommendations,
 * managing photos, publishing and pausing, regenerating guest access, and
 * reading Vitoria conversations.
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
import { AuthProvider } from '../src/context/AuthContext'
import { WorkspaceProvider } from '../src/context/WorkspaceContext'
import { setLatency, setFailureMode } from '../src/services/mockClient'
import { resetProperties } from '../src/services/propertyService'
import { resetRecommendations } from '../src/services/recommendationService'
import { resetNotifications } from '../src/services/notificationService'
import { mockHost } from '../src/data/host'

setLatency(0, 0)

const SESSION_KEY = 'my30a.host.v1.session'

const signIn = () =>
  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ host: mockHost, signedInAt: '2026-08-17T09:00:00.000Z', remember: true }),
  )
const signOutStorage = () => window.localStorage.removeItem(SESSION_KEY)

const resetAll = () => {
  resetProperties()
  resetRecommendations()
  resetNotifications()
  // The selected property persists across mounts — clear it so each test
  // starts on the first property rather than inheriting the previous one.
  window.localStorage.removeItem('my30a.host.v1.activeProperty')
  window.localStorage.removeItem('my30a.host.v1.onboarding')
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

async function mount(route, { authed = true } = {}) {
  if (authed) signIn()
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
        <AuthProvider>
          <WorkspaceProvider>
            <App />
          </WorkspaceProvider>
        </AuthProvider>
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

/**
 * Resolve the control for a visible field label. `label.control` handles the
 * `for`/id association without needing CSS.escape — React's generated ids
 * contain colons, which a naive selector cannot handle.
 */
const fieldByLabel = (container, labelText) => {
  const labels = all(container, 'label')
  const label = labels.find((el) => (el.textContent ?? '').trim().startsWith(labelText))
  if (!label) {
    const seen = labels.map((el) => `"${(el.textContent ?? '').trim()}"`).join(', ')
    throw new Error(`no field labelled "${labelText}" (saw: ${seen || 'none'})`)
  }
  const control =
    label.control ?? label.closest('.field')?.querySelector('input, textarea, select')
  if (!control) throw new Error(`field "${labelText}" has no control`)
  return control
}

/* -------------------------------- suite --------------------------------- */

const tests = []
const test = (name, fn) => tests.push([name, fn])

/* ------------------------------ Auth ------------------------------------ */

test('Login rejects an unknown email and accepts the demo account', async () => {
  const page = await mount('/host/login', { authed: false })

  await type(fieldByLabel(page.container, 'Email'), 'nobody@example.com')
  await type(fieldByLabel(page.container, 'Password'), 'whatever1')
  await click(findByText(page.container, 'Sign in', 'button[type="submit"]'))
  await flush(8)
  if (!page.text().includes('No host account matches'))
    throw new Error('an unknown email was accepted')

  await type(fieldByLabel(page.container, 'Email'), 'michael@coastalkey30a.com')
  await click(findByText(page.container, 'Sign in', 'button[type="submit"]'))
  await flush(14)
  if (!page.text().includes('Property setup')) throw new Error('did not land on the dashboard')
  await page.destroy()
})

test('Sign out is reachable from the desktop sidebar', async () => {
  const page = await mount('/host/dashboard')
  const sidebar = page.container.querySelector('.hside')
  if (!sidebar) throw new Error('sidebar not rendered')

  await click(findByText(sidebar, 'Sign out', '.hside__item'))
  await flush(14)
  if (!page.text().includes('Sign in')) throw new Error('sidebar sign out did not reach the login screen')
  await page.destroy()
})

test('Signing out returns to login and protects the dashboard', async () => {
  const page = await mount('/host/settings')
  await click(findByText(page.container, 'Sign out', '.setting-row'))
  await flush(4)
  if (!document.body.textContent.includes('Sign out?')) throw new Error('no confirmation dialog')

  await click(findByText(document.body, 'Sign out', '.modal button'))
  await flush(12)
  if (!page.text().includes('Sign in')) throw new Error('did not return to the login screen')
  await page.destroy()
})

test('Signup validates password confirmation', async () => {
  const page = await mount('/host/signup', { authed: false })

  await type(fieldByLabel(page.container, 'First name'), 'Dana')
  await type(fieldByLabel(page.container, 'Last name'), 'Ellis')
  await type(fieldByLabel(page.container, 'Email'), 'dana@example.com')
  await type(fieldByLabel(page.container, 'Phone'), '(850) 555-0123')
  await type(fieldByLabel(page.container, 'Password'), 'seaside99')
  await type(fieldByLabel(page.container, 'Confirm password'), 'different99')
  await click(findByText(page.container, 'Create account', 'button[type="submit"]'))
  await flush(6)

  const text = page.text()
  if (!text.includes('Passwords do not match')) throw new Error('mismatched passwords were accepted')
  if (!text.includes('accept the terms')) throw new Error('terms were not required')
  await page.destroy()
})

/* ---------------------------- Property setup ---------------------------- */

test('Saving WiFi persists and shows in the guest preview', async () => {
  resetAll()
  const page = await mount('/host/properties/prop_rosemary/wifi')

  const network = fieldByLabel(page.container, 'Network name')
  await type(network, 'RosemaryGuest-5G')

  const save = findByText(page.container, 'Save changes')
  if (save.disabled) throw new Error('save stayed disabled after editing')
  await click(save)
  await flush(12)

  if (!page.text().includes('All changes saved')) throw new Error('save bar did not settle')
  await page.destroy()

  const preview = await mount('/host/properties/prop_rosemary/preview')
  if (!preview.text().includes('RosemaryGuest-5G'))
    throw new Error('the new network did not reach the guest preview')
  await preview.destroy()
})

test('WiFi password is masked until revealed', async () => {
  const page = await mount('/host/properties/prop_rosemary/wifi')
  const input = fieldByLabel(page.container, 'Password')
  if (input.getAttribute('type') !== 'password') throw new Error('password was visible by default')

  await click(findByLabel(page.container, 'Show password'))
  if (input.getAttribute('type') !== 'text') throw new Error('reveal did not work')
  await page.destroy()
})

test('Property information validates required fields', async () => {
  resetAll()
  const page = await mount('/host/properties/prop_rosemary/information')

  await type(fieldByLabel(page.container, 'Property name'), '')
  await click(findByText(page.container, 'Save changes'))
  await flush(6)
  if (!page.text().includes('which house they are in'))
    throw new Error('an empty property name was accepted')
  await page.destroy()
})

test('House rules can be added, toggled and deleted', async () => {
  resetAll()
  const page = await mount('/host/properties/prop_rosemary/rules')

  const before = all(page.container, '.rule-row').length
  if (before === 0) throw new Error('fixture rules did not render')

  await click(findByText(page.container, 'Add rule'))
  await flush(4)
  if (!document.body.querySelector('.modal')) throw new Error('rule dialog did not open')

  await type(fieldByLabel(document.body.querySelector('.modal'), 'Rule'), 'No glass by the pool')
  await click(findByText(document.body, 'Add rule', '.modal button'))
  await flush(12)

  if (!page.text().includes('No glass by the pool')) throw new Error('rule was not added')
  if (all(page.container, '.rule-row').length !== before + 1) throw new Error('rule count did not grow')

  // Toggling hides it from guests without deleting it.
  const toggle = all(page.container, '.switch')[0]
  const wasOn = toggle.getAttribute('aria-checked')
  await click(toggle)
  await flush(8)
  if (all(page.container, '.switch')[0].getAttribute('aria-checked') === wasOn)
    throw new Error('rule toggle did not change')

  await click(findByLabel(page.container, 'Delete No glass by the pool'))
  await flush(4)
  await click(findByText(document.body, 'Delete rule', '.modal button'))
  await flush(12)
  if (page.text().includes('No glass by the pool')) throw new Error('rule was not deleted')
  await page.destroy()
})

/* ------------------------- Status and guest access ---------------------- */

test('Publishing a draft asks for confirmation and turns on guest access', async () => {
  resetAll()
  const page = await mount('/host/properties/prop_watercolor')
  if (!page.text().includes('Draft')) throw new Error('property did not start as a draft')

  await click(findByText(page.container, 'Publish'))
  await flush(4)
  if (!document.body.textContent.includes('Publish this property?'))
    throw new Error('no confirmation before publishing')

  await click(findByText(document.body, 'Publish', '.modal button'))
  await flush(14)
  if (!page.text().includes('Published')) throw new Error('status did not change to published')
  await page.destroy()
})

test('Pausing a published property warns that links stop working', async () => {
  resetAll()
  const page = await mount('/host/properties/prop_rosemary')

  await click(findByText(page.container, 'Pause access'))
  await flush(4)
  if (!document.body.textContent.includes('Existing links stop opening'))
    throw new Error('pause dialog did not explain the consequence')

  await click(findByText(document.body, 'Pause access', '.modal button'))
  await flush(14)
  if (!page.text().includes('Paused')) throw new Error('status did not change to paused')
  await page.destroy()
})

test('Regenerating guest access replaces the link', async () => {
  resetAll()
  const page = await mount('/host/properties/prop_rosemary/guest-access')

  const linkBefore = page.container.querySelector('.linkbox__value').textContent
  await click(findByText(page.container, 'Regenerate link'))
  await flush(4)
  if (!document.body.textContent.includes('stop working immediately'))
    throw new Error('regenerate dialog did not warn about existing guests')

  await click(findByText(document.body, 'Regenerate link', '.modal button'))
  await flush(14)

  const linkAfter = page.container.querySelector('.linkbox__value').textContent
  if (linkAfter === linkBefore) throw new Error('the guest link did not change')
  await page.destroy()
})

test('Guest access separates private property data from public 30A content', async () => {
  const page = await mount('/host/properties/prop_rosemary/guest-access')
  const text = page.text()
  if (!text.includes('Private to your guests')) throw new Error('missing the private list')
  if (!text.includes('Public to everyone')) throw new Error('missing the public list')
  if (!page.container.querySelector('.qr svg')) throw new Error('no QR rendered')
  if (!text.includes('Placeholder pattern'))
    throw new Error('the QR placeholder is not labelled as such')
  await page.destroy()
})

test('The guest preview hides private data from a public visitor', async () => {
  resetAll()
  const page = await mount('/host/properties/prop_rosemary/preview')
  if (!page.text().includes('RosemaryGuest')) throw new Error('guest view did not show the WiFi')

  await click(findByText(page.container, 'Public visitor', '.segmented button'))
  await flush(6)
  const text = page.text()
  if (text.includes('RosemaryGuest')) throw new Error('WiFi leaked into the public view')
  if (!text.includes('Unlock your stay')) throw new Error('public view is missing the unlock prompt')
  await page.destroy()
})

/* ---------------------------- Recommendations --------------------------- */

test('A recommendation can be added and removed', async () => {
  resetAll()
  const page = await mount('/host/properties/prop_rosemary/recommendations')

  await click(findByText(page.container, 'Add place'))
  await flush(4)
  const modal = document.body.querySelector('.modal')
  if (!modal) throw new Error('recommendation dialog did not open')

  await click(findByText(document.body, 'Add recommendation', '.modal button'))
  await flush(6)
  if (!document.body.textContent.includes('Give it a name'))
    throw new Error('an unnamed recommendation was accepted')

  await type(fieldByLabel(modal, 'Name'), 'The Surf Hut')
  await type(fieldByLabel(modal, 'Your note'), 'Great for families and sunset dinner.')
  await click(findByText(document.body, 'Add recommendation', '.modal button'))
  await flush(14)

  if (!page.text().includes('The Surf Hut')) throw new Error('recommendation was not added')

  await click(findByLabel(page.container, 'Delete The Surf Hut'))
  await flush(4)
  await click(findByText(document.body, 'Remove', '.modal button'))
  await flush(14)
  if (page.text().includes('The Surf Hut')) throw new Error('recommendation was not removed')
  await page.destroy()
})

/* -------------------------------- Photos -------------------------------- */

test('Photos can be added and the cover changed', async () => {
  resetAll()
  const page = await mount('/host/properties/prop_rosemary/photos')
  const before = all(page.container, '.photo-tile').length

  await click(findByText(page.container, 'Add photo'))
  await flush(4)
  await click(findByText(document.body, 'Add photo', '.modal__foot button'))
  await flush(14)

  if (all(page.container, '.photo-tile').length <= before) throw new Error('photo was not added')
  await page.destroy()
})

/* ------------------------------- Properties ----------------------------- */

test('Creating a property lands on it as a draft', async () => {
  resetAll()
  const page = await mount('/host/properties/new')

  await click(findByText(page.container, 'Create property', 'button[type="submit"]'))
  await flush(6)
  if (!page.text().includes('name your guests will recognise'))
    throw new Error('an unnamed property was accepted')

  await type(fieldByLabel(page.container, 'Property name'), 'Alys Courtyard Cottage')
  await type(fieldByLabel(page.container, 'Street address'), '12 Charles Street')
  await type(fieldByLabel(page.container, 'City'), 'Alys Beach')
  await click(findByText(page.container, 'Create property', 'button[type="submit"]'))
  await flush(16)

  const text = page.text()
  if (!text.includes('Alys Courtyard Cottage')) throw new Error('did not open the new property')
  if (!text.includes('Draft')) throw new Error('new property was not a draft')
  await page.destroy()
})

test('Property search narrows the list', async () => {
  resetAll()
  const page = await mount('/host/properties')
  const before = all(page.container, '.panel').length

  await type(page.container.querySelector('.search__input'), 'seaside')
  await flush(8)
  const after = all(page.container, '.panel').length
  if (after >= before) throw new Error('search did not narrow the list')
  if (!page.text().includes('Seaside Condo')) throw new Error('expected result missing')
  await page.destroy()
})

/* -------------------------------- Guests -------------------------------- */

test('Guests can be filtered and opened', async () => {
  const page = await mount('/host/guests')
  if (!page.text().includes('Sarah Whitmore')) throw new Error('guest list did not render')

  await click(findByText(page.container, 'Past stays', '.chip'))
  await flush(8)
  if (page.text().includes('Sarah Whitmore')) throw new Error('filter did not apply')

  await click(findByText(page.container, 'All', '.chip'))
  await flush(8)
  await click(findByText(page.container, 'Sarah Whitmore', '.dtable__card, .dtable__table tr'))
  await flush(14)
  if (!page.text().includes('Vitoria conversations')) throw new Error('guest detail did not open')
  await page.destroy()
})

/* ------------------------------- Vitoria -------------------------------- */

test('A Vitoria conversation opens its transcript', async () => {
  const page = await mount('/host/vitoria')
  if (!page.text().includes('Most common questions')) throw new Error('summary did not render')

  await click(findByText(page.container, 'family dinner recommendation', '.activity-row'))
  await flush(6)
  const modal = document.body.querySelector('.modal')
  if (!modal) throw new Error('transcript did not open')
  if (modal.querySelectorAll('.convo__msg').length < 2)
    throw new Error('transcript messages did not render')
  await page.destroy()
})

test('Unanswered questions can be isolated', async () => {
  const page = await mount('/host/vitoria')
  await click(findByText(page.container, 'Unanswered only', 'label'))
  await flush(10)
  const rows = all(page.container, '.activity-row')
  if (rows.length === 0) throw new Error('no unanswered conversations found')
  if (!page.text().includes('unanswered')) throw new Error('rows are not marked unanswered')
  await page.destroy()
})

/* ------------------------------ Analytics ------------------------------- */

test('Analytics renders charts and switches range', async () => {
  const page = await mount('/host/analytics')
  if (all(page.container, 'svg.chart__svg').length === 0) throw new Error('no charts rendered')

  await click(findByText(page.container, 'Last 7 days', '.segmented button'))
  await flush(10)
  if (all(page.container, 'svg.chart__svg').length === 0)
    throw new Error('charts disappeared after switching range')
  await page.destroy()
})

test('A property with no data gets an empty state, not an empty chart', async () => {
  resetAll()
  const page = await mount('/host/properties/prop_watercolor')
  await flush(6)
  await page.destroy()

  const analytics = await mount('/host/analytics')
  // Switch the workspace to the draft property via the switcher.
  await click(analytics.container.querySelector('.pswitch__trigger'))
  await flush(4)
  await click(findByText(document.body, 'WaterColor Villa', '.pswitch__option'))
  await flush(12)
  if (!analytics.text().includes('No data for this property yet'))
    throw new Error('empty analytics state missing')
  await analytics.destroy()
})

/* ---------------------------- Shell behaviour --------------------------- */

test('Mobile drawer opens, navigates and closes', async () => {
  const page = await mount('/host/dashboard')
  await click(findByLabel(page.container.querySelector('.htop'), 'Open menu'))
  await flush(4)

  const drawer = document.body.querySelector('.hdrawer')
  if (!drawer) throw new Error('drawer did not open')
  if (!drawer.textContent.includes('Guest activity')) throw new Error('drawer is missing nav links')

  await click(findByText(drawer, 'Guest activity', '.hside__item'))
  await flush(10)
  if (document.body.querySelector('.hdrawer')) throw new Error('drawer stayed open after navigating')
  if (!page.text().includes('How guests are actually using')) throw new Error('navigation failed')
  await page.destroy()
})

test('Property switcher changes the whole workspace', async () => {
  resetAll()
  const page = await mount('/host/dashboard')
  if (!page.text().includes('Rosemary Beach House')) throw new Error('default property missing')

  await click(page.container.querySelector('.pswitch__trigger'))
  await flush(4)
  await click(findByText(document.body, 'Seaside Condo', '.pswitch__option'))
  await flush(12)
  if (!page.text().includes('Seaside Condo')) throw new Error('switcher did not change property')
  await page.destroy()
})

test('Notifications can be marked read', async () => {
  resetAll()
  const page = await mount('/host/notifications')
  if (!page.text().includes('unread')) throw new Error('expected unread notifications')

  await click(findByText(page.container, 'Mark all read'))
  await flush(10)
  if (!page.text().includes('all caught up')) throw new Error('notifications were not marked read')
  await page.destroy()
})

test('Error state appears when a service fails, and retry recovers', async () => {
  resetAll()
  const page = await mount('/host/vitoria')
  setFailureMode(true)

  await type(page.container.querySelector('.search__input'), 'parking')
  await flush(10)
  if (!page.text().includes('Try again')) throw new Error('no error state while failing')

  setFailureMode(false)
  await click(findByText(page.container, 'Try again'))
  await flush(12)
  if (page.text().includes('Try again')) throw new Error('retry did not recover')
  await page.destroy()
})

test('Setup checklist links straight to the missing section', async () => {
  resetAll()
  const page = await mount('/host/properties/prop_watercolor')
  const link = findByText(page.container, 'WiFi', '.setup__item')
  await click(link)
  await flush(12)
  if (!page.text().includes('Network name')) throw new Error('checklist did not navigate to WiFi')
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
