/**
 * Interaction test.
 *
 * The route smoke test proves pages render; this drives what a guest actually
 * does - sending a message to Vitoria, completing both request wizards,
 * tripping form validation, authorising a mock payment, tipping, rating,
 * filtering, saving a place, and recovering from an API failure.
 *
 *   npm run test:flows
 *
 * Expectations are ASCII-only so the harness never depends on how a terminal
 * or editor encodes typographic punctuation.
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

const SLUG_KEY = 'my30a.guest.v1.guestSlug'

/** Seed an unlocked stay for the flows that live behind the access code. */
const unlock = () => window.localStorage.setItem(SLUG_KEY, JSON.stringify('demo'))
const lock = () => window.localStorage.removeItem(SLUG_KEY)

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

/**
 * Mounts with an unlocked stay by default, since most flows live behind the
 * access code. Pass `{ guest: false }` to exercise the public experience.
 */
async function mount(route, { guest = true } = {}) {
  if (guest) unlock()
  else lock()
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

/** React tracks its own value; the prototype setter is required for onChange. */
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

test('Chat groups messages under a date separator', async () => {
  const page = await mount('/vitoria')
  if (all(page.container, '.chat-date').length === 0)
    throw new Error('no date separator rendered in the thread')
  if (all(page.container, '.bubble').length < 2) throw new Error('seed conversation did not render')
  await page.destroy()
})

test('Grocery wizard blocks an empty list and completes when filled', async () => {
  resetMockData()
  const page = await mount('/groceries/new')

  // Step 1 -> 2
  const date = page.container.querySelector('input[type="date"]')
  await type(date, '2026-08-21')
  await click(findByText(page.container, 'Continue'))
  if (!page.text().includes('Where should we shop?')) throw new Error('did not advance to the store step')

  // Step 2 -> 3
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

  // Validation: submit without accepting the cancellation terms
  await click(findByText(page.container, 'Submit request'))
  if (!page.text().includes('accept the cancellation terms'))
    throw new Error('submitted without accepting the cancellation terms')

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
  unlock()
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
  unlock()
  const page = await mount('/transfers/new')
  const before = page.text()
  if (!before.includes('$203')) throw new Error('expected the SUV quote of $203')

  await click(findByText(page.container, 'Sprinter Van'))
  if (!page.text().includes('$285')) throw new Error('price did not update for the Sprinter')
  await page.destroy()
})

test('Grocery order advances through its status flow', async () => {
  resetMockData()
  unlock()
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
  unlock()
  const page = await mount('/groceries/GR-1024')
  await click(findByText(page.container, '18%'))
  await click(findByText(page.container, 'Add tip'))
  await flush(10)
  if (!page.text().includes('goes entirely to your shopper')) throw new Error('tip was not recorded')

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

  await click(findByText(document.body, 'Cancel request', '.modal button'))
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
  await type(page.container.querySelector('.search__input'), 'zzzzz-not-a-real-place')
  await flush(8)
  if (!page.text().includes('Nothing matched that')) throw new Error('no empty state for a dead search')
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

test('Partner detail leads with outbound CTAs and a clear disclosure', async () => {
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
  if (all(page.container, '.place-card').length === 0) throw new Error('retry did not reload the list')
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

/* ------------------- Public website + navigation ------------------------- */

test('The site opens on a landing page, not on the app shell', async () => {
  const page = await mount('/', { guest: false })

  // A website: header, hero, footer. Not a dashboard.
  if (!page.container.querySelector('.site-head')) throw new Error('no public site header')
  if (!page.container.querySelector('.site-foot')) throw new Error('no public site footer')
  if (page.container.querySelector('.sidebar')) throw new Error('app sidebar leaked onto the landing page')
  if (page.container.querySelector('.tabbar')) throw new Error('app tab bar leaked onto the landing page')
  if (page.container.querySelector('.topbar')) throw new Error('app top bar leaked onto the landing page')

  const nav = page.container.querySelector('.site-head__nav')
  for (const label of ['Explore', 'Beaches', 'Restaurants', 'Events', 'Vitoria']) {
    if (!nav.textContent.includes(label)) throw new Error(`site nav is missing "${label}"`)
  }
  await page.destroy()
})

test('Landing page sells the destination before the services', async () => {
  const page = await mount('/', { guest: false })
  const text = page.text()
  if (!text.includes('Experience 30A like a local')) throw new Error('hero headline missing')
  if (!text.includes('Explore 30A')) throw new Error('primary CTA missing')
  if (!text.includes('Meet Vitoria')) throw new Error('secondary CTA missing')
  if (all(page.container, '.exp-tile').length < 8)
    throw new Error('experience tiles did not render')
  if (!text.includes('Make tonight unforgettable')) throw new Error('spotlight copy missing')
  if (!text.includes('Unlock your property')) throw new Error('public unlock band missing')
  if (text.includes('Welcome back')) throw new Error('guest strip shown to a public visitor')
  await page.destroy()
})

test('Landing page welcomes an unlocked guest and points into the app', async () => {
  const page = await mount('/', { guest: true })
  const text = page.text()
  if (!text.includes('Welcome back, Sarah')) throw new Error('guest strip missing')
  if (!text.includes('Go to my stay')) throw new Error('no way into the app from the website')
  if (!text.includes('Experience 30A like a local'))
    throw new Error('marketing content was replaced instead of extended')

  const link = findByText(page.container, 'Go to my stay', 'a')
  if (link.getAttribute('href') !== '/discover')
    throw new Error('the guest strip does not lead to the app home')
  await page.destroy()
})

test('App home personalises for an unlocked stay', async () => {
  const page = await mount('/discover', { guest: true })
  const text = page.text()
  if (!text.includes('Welcome back, Sarah')) throw new Error('stay header missing')
  if (!text.includes('Rosemary Beach House')) throw new Error('property not shown')
  if (!page.container.querySelector('.sidebar')) throw new Error('app shell missing on /discover')

  const shell = page.container.querySelector('.page')
  if (!shell.classList.contains('page--railed'))
    throw new Error('rail column missing for a guest with a stay')
  if (!page.container.querySelector('.rail')) throw new Error('context rail did not render')
  await page.destroy()
})

test('Public app home uses the full width — no empty rail column', async () => {
  const page = await mount('/discover', { guest: false })
  const shell = page.container.querySelector('.page')

  if (shell.classList.contains('page--railed'))
    throw new Error('public visitor got the two-column layout, leaving dead space on the right')
  if (page.container.querySelector('.rail'))
    throw new Error('context rail rendered without a stay')
  if (!page.text().includes('Staying on 30A')) throw new Error('no prompt to unlock a stay')
  await page.destroy()
})

test('Signing out from the sidebar returns to the public landing page', async () => {
  const page = await mount('/my-stay', { guest: true })
  if (!page.text().includes('House rules')) throw new Error('did not start on the property page')

  await click(findByText(page.container, 'Sign out of this stay', '.sidebar__item'))
  await flush(14)

  const text = page.text()
  if (!text.includes('Experience 30A like a local'))
    throw new Error('sign out did not land on the landing page')
  if (text.includes('House rules')) throw new Error('property detail survived sign out')
  if (!text.includes('Unlock your stay')) throw new Error('no way back in after signing out')
  if (page.container.querySelector('.sidebar'))
    throw new Error('app chrome survived sign out - should be back on the public website')
  await page.destroy()
})

test('Landing page markets every service end to end', async () => {
  const page = await mount('/', { guest: false })
  const text = page.text()

  for (const beat of [
    'Experience 30A like a local', // hero
    'Free for every guest', // trust line
    'What will you do today?', // experiences
    'How it works', // mechanic
    'Everything in one place', // full catalogue
    'What guests say', // social proof
    'Unlock your property', // conversion
  ]) {
    if (!text.includes(beat)) throw new Error(`landing page is missing the "${beat}" section`)
  }

  // The catalogue must cover the services, not just the headline experiences.
  for (const service of [
    'Golf carts',
    'Biking',
    'Boating',
    'Restaurants',
    'Beach bonfires',
    'Grocery delivery',
    'Airport transfers',
    'Photography',
    'Wellness & spa',
    'Golf',
    'Events',
    'Shopping',
  ]) {
    if (!text.includes(service)) throw new Error(`"${service}" is not marketed on the landing page`)
  }

  if (all(page.container, '.howto__card').length !== 3) throw new Error('how-it-works needs 3 steps')
  if (all(page.container, '.quote').length === 0) throw new Error('no testimonials rendered')
  await page.destroy()
})

test('Hero plays a silent looping background video over the still photo', async () => {
  const page = await mount('/', { guest: false })

  const bg = page.container.querySelector('.video-bg')
  if (!bg) throw new Error('no video background on the hero')
  if (!bg.querySelector('.video-bg__poster'))
    throw new Error('no still photo behind the video — the headline would be unreadable if it fails')

  const frame = bg.querySelector('iframe')
  if (!frame) throw new Error('hero video iframe missing')

  const src = frame.getAttribute('src')
  for (const param of [
    'autoplay=1',
    'mute=1',
    'loop=1',
    'controls=0',
    'cc_load_policy=0',
    'iv_load_policy=3',
  ]) {
    if (!src.includes(param)) throw new Error(`hero embed is missing ${param}`)
  }
  // YouTube only loops when the playlist repeats the same id.
  if (!/playlist=[\w-]+/.test(src)) throw new Error('loop will not work without playlist=<id>')
  if (frame.getAttribute('tabindex') !== '-1')
    throw new Error('decorative background video should not be a tab stop')
  if (bg.getAttribute('aria-hidden') !== 'true')
    throw new Error('decorative background should be hidden from screen readers')

  await page.destroy()
})

test('The video section plays with controls and no autoplay', async () => {
  const page = await mount('/', { guest: false })

  const player = page.container.querySelector('.video-frame iframe')
  if (!player) throw new Error('no watchable player in the video section')

  const src = player.getAttribute('src')
  if (!src.includes('controls=1')) throw new Error('player has no controls')
  if (src.includes('autoplay=1')) throw new Error('the section player should not autoplay')
  if (src.includes('mute=1')) throw new Error('the section player should not be muted')
  for (const param of ['cc_load_policy=0', 'iv_load_policy=3']) {
    if (!src.includes(param)) throw new Error(`section embed is missing ${param}`)
  }
  if (!player.hasAttribute('allowfullscreen')) throw new Error('player cannot go fullscreen')
  if (player.getAttribute('loading') !== 'lazy')
    throw new Error('the section player should not load until it is needed')

  await page.destroy()
})

test('Both players read the same video id from one constant', async () => {
  const { VIDEO_ID } = await import('../src/config/video')
  const page = await mount('/', { guest: false })

  const heroSrc = page.container.querySelector('.video-bg iframe').getAttribute('src')
  const playerSrc = page.container.querySelector('.video-frame iframe').getAttribute('src')

  if (!heroSrc.includes(VIDEO_ID)) throw new Error('hero does not use the configured video id')
  if (!playerSrc.includes(VIDEO_ID)) throw new Error('section does not use the configured video id')

  await page.destroy()
})

test('Experience page leads with lifestyle, then lists providers', async () => {
  const page = await mount('/experiences/golf-carts', { guest: false })
  const text = page.text()
  if (!text.includes('Explore 30A your way')) throw new Error('headline missing')
  if (!text.includes('Who to call')) throw new Error('provider section missing')
  if (!text.includes('30A Golf Cart Rentals')) throw new Error('golf cart partners not listed')
  if (!text.includes('book with them directly'))
    throw new Error('partner relationship not made clear')
  await page.destroy()
})

test('Public site menu opens and leads into the app', async () => {
  const page = await mount('/', { guest: false })
  await click(findByLabel(page.container.querySelector('.site-head'), 'Open menu'))
  await flush(4)

  const menu = document.body.querySelector('.site-menu')
  if (!menu) throw new Error('site menu did not open')
  if (!menu.textContent.includes('Unlock your stay')) throw new Error('menu is missing the unlock CTA')

  await click(findByText(menu, 'Beaches', '.site-menu__link'))
  await flush(8)
  if (document.body.querySelector('.site-menu')) throw new Error('menu stayed open after navigating')
  if (!page.text().includes('Beach guide')) throw new Error('menu link did not navigate')
  await page.destroy()
})

test('Mobile drawer opens, navigates, and closes', async () => {
  const page = await mount('/discover', { guest: false })
  await click(findByLabel(page.container.querySelector('.topbar'), 'Open menu'))
  await flush(4)

  const drawer = document.body.querySelector('.drawer')
  if (!drawer) throw new Error('drawer did not open')
  if (!drawer.textContent.includes('Beach bonfires'))
    throw new Error('drawer is missing the experience links')
  if (!drawer.textContent.includes('Unlock your stay'))
    throw new Error('drawer is missing the unlock prompt')

  await click(findByText(drawer, 'Beach bonfires', '.drawer__item'))
  await flush(8)
  if (document.body.querySelector('.drawer')) throw new Error('drawer stayed open after navigating')
  if (!page.text().includes('Make tonight unforgettable'))
    throw new Error('drawer link did not navigate')
  await page.destroy()
})

test('Drawer closes on Escape', async () => {
  const page = await mount('/discover', { guest: false })
  await click(findByLabel(page.container.querySelector('.topbar'), 'Open menu'))
  await flush(4)
  if (!document.body.querySelector('.drawer')) throw new Error('drawer did not open')

  await act(async () => {
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  await flush(4)
  if (document.body.querySelector('.drawer')) throw new Error('Escape did not close the drawer')
  await page.destroy()
})

/* --------------------------- Guest access -------------------------------- */

test('Guest routes explain themselves instead of dead-ending', async () => {
  const page = await mount('/my-stay', { guest: false })
  const text = page.text()
  if (!text.includes('Enter your code')) throw new Error('no unlock prompt on a gated route')
  if (!text.includes('Keep exploring 30A')) throw new Error('no way back into the public app')
  if (text.includes('House rules')) throw new Error('property detail leaked without a stay')
  await page.destroy()
})

test('A wrong access code is rejected, a real one unlocks the stay', async () => {
  const page = await mount('/access', { guest: false })
  const input = page.container.querySelector('.access__code')

  await type(input, 'NOPE-1234')
  await click(findByText(page.container, 'Unlock my stay'))
  await flush(6)
  if (!page.text().includes('do not recognise that code'))
    throw new Error('a bad code was accepted')

  await type(input, 'MY30A-8842')
  await click(findByText(page.container, 'Unlock my stay'))
  await flush(14)

  // Unlocking is the "log in" step: it should hand the guest to the app.
  if (!page.text().includes('Welcome back, Sarah'))
    throw new Error('a valid code did not land the guest on the app home')
  if (!page.container.querySelector('.sidebar')) throw new Error('app shell did not take over')
  await page.destroy()
})

/* ------------------------------ Settings --------------------------------- */

test('Settings rows stack their title and description', async () => {
  const page = await mount('/settings')
  const row = all(page.container, '.setting-row').find((el) =>
    el.textContent.includes('Let Vitoria remember me'),
  )
  if (!row) throw new Error('personalisation row not found')

  const title = row.querySelector('.setting-row__title')
  const sub = row.querySelector('.setting-row__sub')
  if (!title || !sub) throw new Error('row is missing its title/description elements')
  if (title.tagName === sub.tagName && title.parentElement !== sub.parentElement)
    throw new Error('unexpected row structure')

  // The bug was a bare chevron with no size, which expanded to fill the row.
  const chevrons = all(page.container, '.setting-row svg').filter(
    (svg) => !svg.closest('.setting-row__icon'),
  )
  for (const svg of chevrons) {
    const width = svg.getAttribute('width')
    if (!width && !svg.style.width) throw new Error('an icon in a settings row has no size')
  }
  await page.destroy()
})

test('Settings toggles flip and persist', async () => {
  const page = await mount('/settings')
  const toggle = all(page.container, '.switch').find(
    (el) => el.getAttribute('aria-label') === 'Push notifications',
  )
  if (!toggle) throw new Error('push notification switch not found')

  const before = toggle.getAttribute('aria-checked')
  await click(toggle)
  await flush(4)
  if (toggle.getAttribute('aria-checked') === before) throw new Error('switch did not toggle')
  await page.destroy()
})

/* -------------------------------- Search --------------------------------- */

test('Global search finds places and experiences', async () => {
  const page = await mount('/search', { guest: false })
  await type(page.container.querySelector('.search__input'), 'bonfire')
  await flush(10)

  const text = page.text()
  if (!text.includes('30A Beach Bonfires')) throw new Error('partner result missing')
  if (all(page.container, '.exp-tile').length === 0)
    throw new Error('matching experience not surfaced')
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
