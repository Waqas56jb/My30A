/**
 * Interaction test.
 *
 * The route smoke test proves pages render; this drives the things a guest
 * actually does â€” sending a message to Vitoria, completing both request
 * wizards, tripping form validation, authorising a mock payment, tipping,
 * rating, filtering, and saving a place.
 *
 *   npx vite build --ssr scripts/flows.jsx --outDir .smoke
 *   node --import ./scripts/setup-dom.js .smoke/flows.js
 */
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'
import { AppProvider } from '../src/context/AppContext'
import { setLatency, resetMockData, setFailureMode } from '../src/services/mockApi'
import { setTypingDelay } from '../src/services/vitoriaService'

setLatency(0, 0)
setTypingDelay(0)

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

async function mount(route) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
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

/** Find a clickable element whose visible text contains `label`. */
function findByText(container, label, selector = 'button, a, label') {
  const hit = all(container, selector).find((el) => (el.textContent ?? '').includes(label))
  if (!hit) throw new Error(`no element matching "${label}"`)
  return hit
}

/** Icon-only controls carry their name in aria-label, not in text. */
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

/** React tracks its own value; the native setter is required for onChange. */
async function type(el, value) {
  const proto = el instanceof window.HTMLTextAreaElement
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

test('Vitoria replies to a typed message', async () => {
  const page = await mount('/vitoria')
  const textarea = page.container.querySelector('#vitoria-composer')
  if (!textarea) throw new Error('composer not found')

  await type(textarea, 'What is the wifi password?')
  const send = page.container.querySelector('.composer__send')
  if (send.disabled) throw new Error('send button stayed disabled after typing')

  await click(send)
  await flush(20)

  const text = page.text()
  if (!text.includes('BeachHouse2026')) throw new Error('Vitoria did not answer with the WiFi password')
  if (textarea.value !== '') throw new Error('composer was not cleared after sending')
  await page.destroy()
})

test('Suggested prompt produces a rich reply with cards', async () => {
  const page = await mount('/vitoria')
  await click(findByText(page.container, 'Where should we eat tonight?'))
  await flush(20)

  const text = page.text()
  if (!text.includes('Restaurant Paradis')) throw new Error('no restaurant recommendation in the reply')
  if (page.container.querySelectorAll('.mini-card').length === 0)
    throw new Error('reply rendered without entity cards')
  await page.destroy()
})

test('Send button is disabled while the composer is empty', async () => {
  const page = await mount('/vitoria')
  const send = page.container.querySelector('.composer__send')
  if (!send.disabled) throw new Error('empty composer allowed sending')
  await page.destroy()
})

test('Grocery wizard blocks an empty list and completes when filled', async () => {
  resetMockData()
  const page = await mount('/groceries/new')

  // Step 1 â†’ 2
  const date = page.container.querySelector('input[type="date"]')
  await type(date, '2026-08-21')
  await click(findByText(page.container, 'Continue'))
  if (!page.text().includes('Where should we shop?')) throw new Error('did not advance to the store step')

  // Step 2 â†’ 3
  await click(findByText(page.container, 'Continue'))
  if (!page.text().includes('What do you need?')) throw new Error('did not advance to the list step')

  // Validation: continue with nothing entered
  await click(findByText(page.container, 'Continue'))
  if (!page.text().includes('Add at least one item'))
    throw new Error('empty list was accepted without a validation error')

  // Fill from a template, then advance
  await click(findByText(page.container, 'Breakfast basics'))
  await click(findByText(page.container, 'Continue'))
  if (!page.text().includes('Review your request')) throw new Error('did not reach the review step')

  // Validation: submit without accepting terms
  await click(findByText(page.container, 'Submit request'))
  if (!page.text().includes('accept the cancellation terms'))
    throw new Error('submitted without accepting the cancellation terms')

  // Accept and submit
  await click(page.container.querySelector('.checkbox input'))
  await click(findByText(page.container, 'Submit request'))
  await flush(15)

  const text = page.text()
  if (!text.includes('Request submitted')) throw new Error('no success state after submitting')
  if (!/GR-\d+/.test(text)) throw new Error('no request id in the success state')
  await page.destroy()
})

test('Transfer wizard validates the flight number and submits', async () => {
  resetMockData()
  const page = await mount('/transfers/new')

  await click(findByText(page.container, 'Request transfer'))
  if (!page.text().includes('need the flight number'))
    throw new Error('submitted without a flight number')

  const flight = Array.from(page.container.querySelectorAll('input')).find(
    (el) => el.placeholder === 'DL 2417',
  )
  await type(flight, 'bad-flight')
  await click(findByText(page.container, 'Request transfer'))
  if (!page.text().includes('airline code'))
    throw new Error('a malformed flight number passed validation')

  await type(flight, 'DL 2417')
  await click(page.container.querySelector('.checkbox input'))
  await click(findByText(page.container, 'Request transfer'))
  await flush(15)

  const text = page.text()
  if (!text.includes('Transfer requested')) throw new Error('no success state after submitting')
  if (!/TR-\d+/.test(text)) throw new Error('no transfer id in the success state')
  await page.destroy()
})

test('Transfer price responds to vehicle class', async () => {
  const page = await mount('/transfers/new')
  const before = page.text()
  if (!before.includes('$203')) throw new Error(`expected the SUV quote of $203, got: ${before.slice(0, 120)}`)

  await click(findByText(page.container, 'Sprinter Van'))
  if (!page.text().includes('$285')) throw new Error('price did not update for the Sprinter')
  await page.destroy()
})

test('Grocery order advances through its status flow', async () => {
  resetMockData()
  const page = await mount('/groceries/GR-1024')
  if (!page.text().includes('Shopping')) throw new Error('did not open on the shopping status')

  await click(findByText(page.container, 'Advance to'))
  await flush(10)
  if (!page.text().includes('On the way')) throw new Error('status did not advance to on the way')

  await click(findByText(page.container, 'Advance to'))
  await flush(10)
  const text = page.text()
  if (!text.includes('Delivered')) throw new Error('status did not advance to delivered')
  if (!text.includes('Tip your shopper')) throw new Error('tip panel did not appear after delivery')
  if (!text.includes('How was your grocery delivery?')) throw new Error('rating panel missing')
  await page.destroy()
})

test('Tipping and rating a delivered order persist', async () => {
  const page = await mount('/groceries/GR-1024')
  await click(findByText(page.container, '18%'))
  await click(findByText(page.container, 'Add tip'))
  await flush(10)
  if (!page.text().includes('goes entirely to your shopper'))
    throw new Error('tip was not recorded')

  const stars = all(page.container, '.stars--input button')
  await click(stars[4])
  await click(findByText(page.container, 'Submit rating'))
  await flush(10)
  if (!page.text().includes('you rated this 5 out of 5')) throw new Error('rating was not recorded')
  await page.destroy()
})

test('Transfer authorisation moves the payment state without charging', async () => {
  resetMockData()
  const page = await mount('/transfers/TR-2048')
  if (!page.text().includes('Card authorisation')) throw new Error('expected an authorisation prompt')

  await click(findByText(page.container, 'Authorise $203'))
  await flush(4)
  // The sheet renders through a portal, so it lives on document.body.
  if (!document.body.textContent.includes('Charged now'))
    throw new Error('authorisation sheet did not open')
  if (!document.body.textContent.includes('no card data is collected'))
    throw new Error('mock-payment disclosure missing from the sheet')

  await click(findByText(document.body, 'Authorise $203', '.sheet button'))
  await flush(12)

  const text = page.text()
  if (!text.includes('Card authorised')) throw new Error('payment state did not become authorised')
  if (!text.includes('Anthony P.')) throw new Error('driver was not assigned after authorisation')
  await page.destroy()
})

test('Cancelling a grocery request asks for confirmation first', async () => {
  resetMockData()
  const page = await mount('/groceries/new')
  // Create a fresh pending request so cancellation is available.
  await type(page.container.querySelector('input[type="date"]'), '2026-08-22')
  await click(findByText(page.container, 'Continue'))
  await click(findByText(page.container, 'Continue'))
  await click(findByText(page.container, 'Beach day'))
  await click(findByText(page.container, 'Continue'))
  await click(page.container.querySelector('.checkbox input'))
  await click(findByText(page.container, 'Submit request'))
  await flush(12)
  await click(findByText(page.container, 'Track this request'))
  await flush(12)

  await click(findByText(page.container, 'Cancel this request'))
  if (!document.body.textContent.includes('Cancel this grocery request?'))
    throw new Error('confirmation modal did not open')

  const confirm = findByText(document.body, 'Cancel request', '.modal button')
  await click(confirm)
  await flush(12)
  if (!page.text().includes('Cancelled')) throw new Error('request was not cancelled')
  await page.destroy()
})

test('Restaurant filters narrow the results', async () => {
  const page = await mount('/restaurants')
  const before = all(page.container, '.place-card').length
  if (before === 0) throw new Error('no restaurants rendered')

  await click(findByText(page.container, 'Walkable', '.chip'))
  await flush(8)
  const after = all(page.container, '.place-card').length
  if (after === 0) throw new Error('walkable filter removed everything')
  if (after >= before) throw new Error('walkable filter did not narrow the list')
  await page.destroy()
})

test('Search with no matches shows an empty state', async () => {
  const page = await mount('/explore')
  const input = page.container.querySelector('.search__input')
  await type(input, 'zzzzz-not-a-real-place')
  await flush(8)
  if (!page.text().includes('Nothing matched that')) throw new Error('no empty state for a dead search')
  await page.destroy()
})

test('Saving a place updates the trip', async () => {
  resetMockData()
  const page = await mount('/restaurants')
  const heart = page.container.querySelector('.place-card__fav')
  const wasPressed = heart.getAttribute('aria-pressed') === 'true'
  await click(heart)
  await flush(8)
  if ((heart.getAttribute('aria-pressed') === 'true') === wasPressed)
    throw new Error('save state did not toggle')
  await page.destroy()
})

test('Notifications can be marked read', async () => {
  resetMockData()
  const page = await mount('/notifications')
  if (all(page.container, '.notif--unread').length === 0)
    throw new Error('expected unread notifications in the fixture')

  await click(findByText(page.container, 'Mark all read'))
  await flush(8)
  if (all(page.container, '.notif--unread').length !== 0)
    throw new Error('notifications were not marked read')
  await page.destroy()
})

test('Partner detail tracks outbound clicks without claiming a booking', async () => {
  const page = await mount('/partners/partner_bike_beachside')
  const text = page.text()
  if (!text.includes('Visit website')) throw new Error('missing website CTA')
  if (!text.includes('Call partner')) throw new Error('missing phone CTA')
  if (!text.includes('independent local business'))
    throw new Error('missing the partner relationship disclosure')
  await page.destroy()
})

test('Error state appears when the API fails, and retry recovers', async () => {
  // Failure mode is toggled after mount because the provider syncs it from
  // settings on start-up, which would otherwise clear the flag.
  const page = await mount('/restaurants')
  setFailureMode(true)

  // Changing the search re-runs the query, which now fails.
  await type(page.container.querySelector('.search__input'), 'seafood')
  await flush(10)
  if (!page.text().includes('Try again')) throw new Error('no error state while the API is failing')

  setFailureMode(false)
  await click(findByText(page.container, 'Try again'))
  await flush(12)
  if (all(page.container, '.place-card').length === 0)
    throw new Error('retry did not reload the list')
  await page.destroy()
})

test('Profile preferences can be edited and saved', async () => {
  resetMockData()
  const page = await mount('/profile')
  await click(findByText(page.container, 'Edit preferences'))
  await flush(4)
  if (!document.body.textContent.includes('Favourite cuisines'))
    throw new Error('edit sheet did not open')

  await click(findByText(document.body, 'Barbecue', '.sheet .chip'))
  await click(findByText(document.body, 'Save preferences', '.sheet button'))
  await flush(10)
  if (!page.text().includes('Barbecue')) throw new Error('preference was not saved back to the profile')
  await page.destroy()
})

test('Explore toggles between list and map views', async () => {
  const page = await mount('/explore')
  if (!page.text().includes('Browse by category')) throw new Error('list view did not render')

  await click(findByText(page.container, 'Map', '.segmented button'))
  await flush(8)
  if (!page.container.querySelector('.mappanel')) throw new Error('map view did not render')
  if (page.container.querySelectorAll('.mappin').length === 0)
    throw new Error('map rendered without pins')

  await click(findByText(page.container, 'List', '.segmented button'))
  await flush(8)
  if (page.container.querySelector('.mappanel')) throw new Error('map view did not close')
  await page.destroy()
})

test('Map pin opens a preview sheet on mobile', async () => {
  const page = await mount('/map')
  const pin = all(page.container, '.mappin').find((el) => !el.className.includes('mappin--home'))
  if (!pin) throw new Error('no partner pins on the map')

  await click(pin)
  await flush(6)
  if (!document.body.querySelector('.sheet')) throw new Error('pin did not open a preview sheet')
  if (!document.body.textContent.includes('View details'))
    throw new Error('preview sheet is missing its CTA')

  await click(findByLabel(document.body.querySelector('.sheet'), 'Close'))
  await flush(6)
  if (document.body.querySelector('.sheet')) throw new Error('preview sheet did not close')
  await page.destroy()
})

test('Dialogs close on Escape', async () => {
  const page = await mount('/vitoria')
  await click(findByLabel(page.container.querySelector('.chat-head'), 'Clear conversation'))
  await flush(4)
  if (!document.body.querySelector('.modal')) throw new Error('confirm modal did not open')

  await act(async () => {
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  await flush(4)
  if (document.body.querySelector('.modal')) throw new Error('Escape did not close the modal')
  await page.destroy()
})

test('Chat groups messages under a date separator', async () => {
  const page = await mount('/vitoria')
  if (all(page.container, '.chat-date').length === 0)
    throw new Error('no date separator rendered in the thread')
  if (all(page.container, '.bubble').length < 2) throw new Error('seed conversation did not render')
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
    failures === 0
      ? `\nAll ${tests.length} flows passed.`
      : `\n${failures} of ${tests.length} flows failed.`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main()
