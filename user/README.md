# My30A — Guest Experience (`/user`)

The public, guest-facing application for **My30A Host** and its AI concierge, **Vitoria**.

A guest books a vacation rental on 30A, the host shares a unique link, and this app becomes their
concierge for the whole stay: the house itself (WiFi, door code, check-out), the coast around it
(restaurants, beaches, events, local partners), and the services My30A fulfils (grocery delivery and
airport transfers).

**This is frontend only.** There is no backend, no database, no authentication, no Stripe, and no AI
provider. Everything runs on mock data behind a service layer designed to be swapped for real
endpoints without touching the UI.

---

## Running it

```bash
cd user
npm install
npm run dev          # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (exposed on the LAN, so you can open it on a real phone) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Route smoke test + interaction tests (see [Testing](#testing)) |
| `npm run test:images` | Checks every remote image URL still resolves |

**Two layers, one app.** `/` is the public destination experience — anyone can browse the beaches,
bonfires, golf carts, partners, map, and Vitoria without an account. The property layer (My Stay,
groceries, transfers, trip) unlocks with the access code a host sends: try **`MY30A-8842`** on
[`/access`](http://localhost:5173/access), or open the link form directly at **`/guest/demo`**
(Sarah at Rosemary Beach House, 20–27 August 2026). `/guest/daniel` resolves a different guest and
property so you can see the app adapt.

---

## 1. Folder structure

```
user/
├── index.html
├── vite.config.js
├── public/favicon.svg
├── scripts/                    # test harness (not shipped)
│   ├── setup-dom.js            # jsdom preload
│   ├── smoke.jsx               # every route renders real content
│   ├── flows.jsx               # interaction / flow tests
│   └── check-images.mjs        # remote image verification
└── src/
    ├── assets/images.js        # central photo registry (remote, no binaries in repo)
    ├── components/
    │   ├── cards/              # PlaceCard, CategoryCard, EventCard, ServiceCard, …
    │   ├── chat/               # ChatBubble, ChatComposer, TypingIndicator
    │   ├── map/MapPanel.jsx
    │   ├── nav/Navigation.jsx  # Sidebar, TopBar, MobileBottomNav (app shell)
    │   ├── nav/SiteHeader.jsx  # public website header + full-screen menu
    │   ├── SiteFooter.jsx      # public website footer
    │   ├── service/PaymentPanel.jsx
    │   ├── ui/                 # design-system primitives
    │   ├── ContextRail.jsx
    │   └── ErrorBoundary.jsx
    ├── context/AppContext.jsx  # guest session, notifications, saved places, toasts
    ├── data/                   # all mock data, one file per entity
    ├── hooks/                  # useAsync, useVisualViewport, useMediaQuery, …
    ├── layouts/
    │   ├── MarketingLayout.jsx # public website shell: header + page + footer
    │   └── AppLayout.jsx       # app shell: sidebar / top bar / tab bar
    ├── pages/                  # one file per route
    ├── services/               # mockApi, vitoriaService, analytics
    ├── styles/                 # tokens, base, layout, components, chat, pages
    ├── types/index.js          # JSDoc typedefs mirroring future API contracts
    ├── utils/                  # format helpers, localStorage wrapper
    ├── App.jsx
    └── main.jsx
```

---

## 2. Routes

All routes are implemented and tested — none are placeholders.

There are **two shells**, and the split matters:

- **`MarketingLayout`** — the public website. Site header floating over the video
  hero, content, site footer. No sidebar, no tab bar. This is `/`.
- **`AuthLayout`** — log in, sign up, password reset. No navigation at all, so
  nobody wanders off half-way through signing in.
- **`AppLayout`** — the product. Sidebar on desktop, top bar + bottom tabs on
  mobile. Everything from `/discover` onwards.

The journey: land on the website → create an account or log in → arrive at
`/discover` → add the stay with the host's code at `/access`. Signing out
returns to `/`.

### Account vs stay

Two different ideas, kept apart on purpose:

|  | What it is | How you get it | What it unlocks |
| --- | --- | --- | --- |
| **Account** | Who you are — email and password | `/signup` or `/login` | The app itself: `/discover`, saved places, preferences, notifications, settings |
| **Stay** | Which house you are in this week | The access code your host sends, at `/access` (or a `/guest/:id` link) | WiFi, door code, house rules, grocery delivery, airport transfers |

An account can exist with no stay attached — people find 30A before they find a
house — so `/discover` works either way and prompts for the code. When a code is
entered it is remembered on the account, so the next login goes straight in.

**The public website.**

| Route | Page |
| --- | --- |
| `/` | Landing page: full-bleed auto-playing video hero, experience grid, spotlights, watchable video section, how it works, Vitoria band, restaurants, events, service catalogue, testimonials, conversion band |

**Accounts.** No account required to reach these, obviously.

| Route | Page |
| --- | --- |
| `/login` | Email + password, reveal toggle, "keep me logged in", demo accounts. Returns to wherever the guest was originally heading |
| `/signup` | Name, email, optional mobile, password with a strength meter, terms |
| `/forgot-password` | Request a reset link. Never reveals whether an account exists |
| `/reset-password?token=…` | Set a new password. Missing or spent tokens explain themselves |
| `/logout` | Clears the session and returns to `/` (deliberately unguarded — see below) |

**Browsing the destination.** Open to everyone, no account needed — the site has
to sell 30A to people who have not booked.

| Route | Page |
| --- | --- |
| `/explore` | Explore 30A (categories, search, list/map) |
| `/experiences/:slug` | Lifestyle pages — bonfires, golf-carts, biking, boating, wellness, family, photography, golf, shopping, outdoor |
| `/map` | Map experience with layer filters |
| `/search` | Global search across places and experiences |
| `/help` | FAQs and contact |
| `/vitoria` | AI concierge conversation |
| `/restaurants` · `/restaurants/:id` | Restaurant list and detail |
| `/partners` · `/partners/:id` | Partner directory and detail (`?category=` supported) |
| `/beaches` · `/beaches/:id` | Beach guide and detail |
| `/events` · `/events/:id` | Events by day and detail |
| `*` | Not-found page |

**Needs an account** (`RequireAuth`) — redirects to `/login`, carrying the
intended destination so the guest continues where they were going.

| Route | Page |
| --- | --- |
| `/discover` | App home: stay header when a stay is linked, Vitoria prompt, quick actions, in-progress services, personal picks, nearby restaurants, events |
| `/favorites` | Saved places |
| `/notifications` · `/settings` | Notification centre, settings + prototype tools |
| `/access` | Enter the access code that links a stay to the account |

**Needs an account and a stay** (`RequireAuth` + `RequireGuest`) — an account
without a stay gets an explanation and a way in, never a dead end.

| Route | Page |
| --- | --- |
| `/guest/:guestId` | Resolves a host link, attaches the stay, then asks for a login if there is none |
| `/my-stay` | Property information |
| `/services` | Service catalogue + My Services |
| `/groceries` · `/groceries/new` · `/groceries/:id` | Grocery list, request wizard, tracking |
| `/transfers` · `/transfers/new` · `/transfers/:id` | Transfer list, request form, tracking |
| `/my-trip` · `/profile` | Trip overview, saved places, preferences, stay rating |

Aliases: `/home` → `/discover`, `/register` and `/sign-up` → `/signup`, `/orders`
→ `/services`, `/property` → `/my-stay`, `/stay/:id` → `/guest/:id`.

### Two details worth keeping

**The session is read synchronously.** `AppProvider` initialises from
localStorage in `useState`, not in an effect. Resolving it asynchronously would
render every guarded route as "signed out" for one frame and bounce the guest to
`/login` on every single refresh.

**Signing out is a route, not a click handler.** `/logout` is deliberately
unguarded. Clearing the account while still standing on a guarded screen is a
race: React Router defers navigation inside a transition, so the urgent state
update lands first, `RequireAuth` re-renders, and the guest ends up on `/login`
instead of the website. Stepping onto an open route first has no such ordering
problem.

### Demo accounts

| Email | Password | State |
| --- | --- | --- |
| `sarah@my30a.com` | `demo1234` | Signed in with a stay — Rosemary Beach House |
| `daniel@my30a.com` | `demo1234` | Signed in with a stay — Watercolor Dune Cottage |
| `alex@my30a.com` | `demo1234` | An account with no stay linked yet |

Passwords sit in plain text in [`src/data/mockAccounts.js`](src/data/mockAccounts.js)
because there is no server. [`src/services/authService.js`](src/services/authService.js)
is the only file a real auth provider needs to replace.

---

## 3. Major components

**Layout & navigation** — `AppLayout`, `Sidebar`, `TopBar`, `MobileBottomNav`, `MobileDrawer`,
`PageHeader`, `Breadcrumbs`, `StickyBar`, `ContextRail`, `SiteFooter`, `RequireGuest`,
`ErrorBoundary`

**UI primitives** (`components/ui`) — `Button` (+`PrimaryButton`/`SecondaryButton`/`GhostButton`/
`IconButton`), `SmartImage`, `Modal`, `ConfirmModal`, `BottomSheet`, `Lightbox`, `Toaster`,
`EmptyState`, `ErrorState`, `SuccessState`, `Skeleton`/`SkeletonGrid`/`SkeletonList`/`SkeletonPage`,
`StatusBadge`, `PaymentBadge`, `Badge`, `SearchBar`, `FilterChips`, `Segmented`, `OptionGrid`,
`Stepper`, `Checkbox`, `Switch`, `Field`/`Input`/`Textarea`/`Select`, `RatingInput`, `RatingStars`,
`PriceDisplay`, `MetaRow`, `Avatar`, `CopyField`, `DefinitionList`, `Timeline`, `Section`, `Callout`,
`ScrollRow`, `ImageGallery`, `Icon`

**Cards** — `ExperienceTile`, `PlaceCard` (+ `RestaurantCard`, `PartnerCard`, `BeachCard`),
`CategoryCard`, `EventCard`, `ServiceCard`, `OrderCard`, `NotificationItem`, `RecommendationCard`

**Chat** — `ChatBubble` (with entity mini-cards and inline actions), `TypingIndicator`,
`DateSeparator`, `ChatComposer`, `SuggestedPrompts`

**Service** — `PaymentSheet`, `PaymentStateRow`, `TipPanel`, `RatingPanel`

**Map** — `MapPanel` (stylised coastal plan, real coordinates projected into it — no API key)

---

## 4. Mock data structure

`src/data/` — one file per entity, re-exported from `data/index.js`. Nothing is duplicated in
components.

| Export | Contents |
| --- | --- |
| `experiences` | 13 lifestyle categories: hero photo, invitation copy, highlights, and which partner categories to list |
| `mockGuests` | Guests, stay window, preferences, **Vitoria memories**, saved places, access codes |
| `mockProperties` | Property, WiFi, access codes, check-in/out steps, rules, host, emergency |
| `mockRestaurants` | 14 restaurants with cuisine, hours, price level, distance |
| `mockPartners` | 23 partners across Golf Carts, Bike Rentals, Bonfires, Boating, Golf, Photography, Wellness & Spa, Family Services, Babysitters, Activities, Transportation, Shopping |
| `mockBeaches` | 6 accesses with parking, amenities, walk time |
| `mockEvents` | 8 events inside the demo stay window |
| `mockGroceryOrders` / `mockTransfers` | Requests with timelines and payment state |
| `mockPartnerBookings` | Partner referrals recorded for the trip timeline |
| `mockNotifications` | Notification feed |
| `mockMessages` / `suggestedPrompts` | Seed conversation and prompt sets |
| `mockRecommendations` / `mockLocalConditions` | Personalised picks, weather, flags, tides |
| `exploreCategories`, `quickActions`, `conciergeServices`, `AIRPORTS`, `VEHICLE_CLASSES`, `GROCERY_STORES`, `GROCERY_TEMPLATES` | Catalogue configuration |
| `statusConfig` | Grocery / transfer status vocabularies and payment states |

A partner record:

```js
{ id, type, name, category, tags, shortDescription, description, image, gallery,
  rating, reviewCount, startingPrice, priceUnit, phone, website, location, address,
  coordinates, distance, hours, services, vitoriaNote, featured }
```

---

## 5. Mock API / service structure

Components never import mock data directly for anything dynamic — they call `services/mockApi.js`.
Every function is async, adds realistic latency, and can fail on demand.

```
getGuest()              getProperty()           resolveGuestLink()
getRestaurants()        getRestaurant()         getPartners()        getPartner()
getBeaches()            getBeach()              getEvents()          getEvent()
getMapEntities()        getRecommendations()    getAirports()        getVehicleClasses()
getOrders()             getGroceryOrders()      getGroceryOrder()    createGroceryRequest()
getTransfers()          getTransfer()           createTransferRequest()
updateMockOrderStatus() cancelOrder()
authorizePayment()      payNow()                addTip()
submitRating()          submitStayRating()
getNotifications()      markNotificationRead()  markAllNotificationsRead()
subscribeToNotifications()
getMessages()           appendMessage()         clearMessages()
updatePreferences()     toggleSavedPlace()      resolveEntity()
trackPartnerView()      trackPartnerClick()
setFailureMode()        setLatency()            resetMockData()
```

`services/vitoriaService.js` is the mock conversational layer. `sendMessage(text, context)` resolves
to an assistant message in exactly the shape a Claude/OpenAI-backed endpoint would return:

```js
{ id, role: 'assistant', at, text, cards: [{ kind, refId }], actions: [{ label, to, icon }] }
```

Intent matching covers ~25 topics (WiFi, check-in, check-out, restaurants, kids, beaches, transfers,
groceries, bonfires, bikes, spa, photography, golf, boating, sitters, weather, sunset, parking, house
rules, emergencies, host contact…) and falls back gracefully.

`services/analytics.js` logs to the console and an in-memory buffer readable from **Settings →
Analytics log**. Events include `guest_opened_app`, `vitoria_message_sent`,
`vitoria_suggestion_clicked`, `partner_viewed`, `partner_website_clicked`, `partner_phone_clicked`,
`restaurant_viewed`, `event_viewed`, `grocery_request_started/submitted`,
`transfer_request_started/submitted`, `tip_selected`, `rating_submitted`, and more.

State created during a session (requests, messages, notifications, saved places, preferences)
persists to `localStorage` so a refresh does not reset the demo. **Settings → Reset demo data**
restores the shipped fixtures.

---

## 6. What is ready for backend integration

| Concern | Where it plugs in |
| --- | --- |
| **REST/GraphQL API** | Reimplement `services/mockApi.js` against HTTP. Function names, arguments, and return shapes are the contract; no component changes required. |
| **Supabase / PostgreSQL** | Entity shapes are documented in `src/types/index.js` and mirrored by the mock data files. |
| **Vitoria (Claude/OpenAI)** | Replace `sendMessage` in `services/vitoriaService.js`. Streaming fits the existing `onTyping` callback; `cards`/`actions` are already the tool-output surface. |
| **AI memory / personalisation** | `guest.preferences` + `guest.memories` are read by Home, Profile, My Trip, and the chat rail; writes go through `updatePreferences()`. |
| **Stripe** | Authorisation, payment, capture, and refund are already distinct states (`statusConfig.PAYMENT_STATES`). `authorizePayment()` and `payNow()` are the two call sites. No card data is ever collected by the UI. |
| **Notifications (FCM / Resend)** | `subscribeToNotifications()` is a live subscription today; point it at a socket or push handler. Delivery preferences already exist in Settings. |
| **Admin / operations** | Status transitions go through `updateMockOrderStatus(kind, id, status)`. The "Advance to…" buttons on tracking pages stand in for the ops console and should be deleted when it exists. |
| **Analytics** | Swap the body of `track()` for your provider. Event names are already fixed. |
| **Auth** | `/guest/:guestId` is the single place a link is exchanged for a session (`AppContext.loadSession`). |

---

## 7. Testing

Two harnesses run the real application in jsdom.

```bash
npm test                                  # 73 routes + 50 interaction flows
SMOKE_VIEWPORT=desktop npm run test:routes # same routes at desktop widths
```

**Routes** (`scripts/smoke.jsx`) — mounts every route, waits for the mock API, and asserts each page
rendered real content rather than a skeleton or an error boundary. React key warnings and invalid DOM
nesting are treated as failures.

**Flows** (`scripts/flows.jsx`) — covers sending a message to Vitoria and getting a grounded answer,
suggested prompts with entity cards, both request wizards including every validation branch, status
progression, mock card authorisation, tipping, rating, cancellation with confirmation, filters,
search empty states, map list/map toggle, map pin sheets, Escape-to-close dialogs, saving places,
marking notifications read, editing preferences, and API-failure/retry recovery. It also guards the
website/app split: `/` must render the site header and footer and must *not* leak the sidebar, top
bar or tab bar; unlocking a code must hand the guest to `/discover` inside the app shell; and signing
out must return them to the public landing page with the app chrome gone.

**Images** (`scripts/check-images.mjs`) — verifies all 67 registry URLs still return an image.

Auth is covered end to end: empty-form validation, unknown email vs wrong password, a protected
route bouncing to `/login` and continuing to the original destination afterwards, the reveal toggle,
signup rejecting weak passwords and duplicate emails, a new account arriving with no stay, and the
full reset run — request a link, mismatch the confirmation, fix it, then log in with the new
password. Requesting a reset for an unknown address must still report success without issuing a link.

Current status: **73/73 routes (mobile and desktop), 50/50 flows, 88/88 images**, clean console,
production build succeeds.

---

## 8. Responsive & mobile notes

- **Mobile** — top bar with a **slide-in drawer** for everything the five bottom tabs cannot hold,
  full-width cards, bottom sheets, ≥44px touch targets, safe-area insets on every fixed surface.
  The drawer traps focus, closes on Escape, on backdrop tap, and on navigation.
- **Tablet** — the mobile shell (drawer included) with multi-column grids. iPad portrait uses the
  drawer; landscape crosses 1024px and gets the sidebar.
- **Desktop (≥1024px)** — persistent sidebar, scrollable main column, sticky detail asides. Not a
  stretched mobile layout.
- **Wide (≥1360px)** — a contextual right rail on Discover and Vitoria (conditions, stay,
  in-progress services, remembered preferences).

Icons emit explicit `width`/`height` attributes, so a glyph dropped into a container without a
sizing rule renders at 20px rather than expanding to fill the row — CSS rules and the `size` prop
still override it.

The chat deserves specific mention. `useVisualViewport` publishes the *visual* viewport height and
offset to CSS, and the chat screen is pinned to it. That means the composer sits directly above the
software keyboard rather than behind it, the thread stays scrollable, the tab bar hides while
typing, the textarea uses a 16px font so iOS never zooms on focus, message text is selectable, long
messages wrap, and Enter sends while Shift+Enter inserts a newline.

---

## 8a. Landing page

`/` is a standalone public website page inside `MarketingLayout` — **not** the app with a hero
bolted on. It has its own fixed header (transparent over the video, solid once you scroll past it),
its own full-screen mobile menu, and the site footer. The app sidebar and tab bar do not exist here.

Order: full-bleed video hero → guest strip if unlocked → experiences grid → three editorial
spotlights → **watch** → **how it works** → Vitoria band → restaurants → events →
grocery/transfer pair → **everything in one place** (all 16 services, grouped) → **what guests say**
→ unlock CTA → footer. Copy lives in [`src/data/mockLanding.js`](src/data/mockLanding.js) so it can
be edited without touching layout.

`/discover` is the *app* home and lives inside `AppLayout`. Its two-column layout (`page--railed`)
is applied by React **only when the context rail actually renders** — a visitor without a stay gets
the full width instead of an empty 336px column.

**No sideways scrolling:** `body { overflow-x: hidden }` covers mobile, and `overflow-x: clip` on
`.app-main` covers desktop — applied *inside* the 1024px block, because pairing `clip` with a
`visible` axis coerces that axis to `auto` and would turn the element into a scroll container. Grid
tracks use `minmax(0, …)` and grid children carry `min-width: 0`, since the default `min-width: auto`
is what lets a wide child push a track past its container in the first place.

## 8b. Landing page video

Both players on `/` use the same YouTube video and read it from **one place**:
[`src/config/video.js`](src/config/video.js).

| Where | Behaviour |
| --- | --- |
| Hero background | Autoplays muted, loops, no controls, no keyboard, not a tab stop |
| Video section (`#watch`) | Full controls, sound, `loading="lazy"`, fullscreen allowed |

Both embeds carry `cc_load_policy=0` and `iv_load_policy=3`.

**To swap in the client's own drone footage:** change `VIDEO_ID` in `src/config/video.js`. Both
players update automatically — there is no second copy of the id anywhere.

Two details worth keeping if the markup is ever touched: the still photograph stays painted
underneath the hero video (so the headline is readable from the first frame and nothing breaks if
the embed is blocked), and `.video-bg` sits at `z-index: -2` so the scrim at `-1` still darkens the
footage. `loop=1` also requires `playlist=<same id>` — that is a YouTube quirk, not a typo. Visitors
with reduced-motion enabled get the photograph alone.

---

## 9. Assumptions

1. **The code is the credential.** `/access` and `/guest/:guestId` resolve a guest from mock data
   with no real auth. Token exchange belongs in `AppContext.unlockWithCode` / `loadSession`.
   Everything about the destination stays public on purpose — the app has to sell 30A to someone who
   has not booked yet.
2. **Business details are illustrative.** Real 30A business names are used so the prototype reads
   authentically, but phone numbers are reserved fictional `555-01xx` numbers, and ratings, prices,
   and hours are invented. Replace them with licensed partner data before anything public.
3. **Imagery is remote and subject-checked.** Every photo carrying a category (hero, bonfires, golf
   carts, biking, boating, family, wellness, beaches) was sourced from Unsplash by subject and
   *looked at* before being used — an earlier pass of guessed ids produced a studio bicycle and a
   scuba diver, which is exactly the failure mode this brief cannot afford. All 88 URLs are checked
   by `npm run test:images`, nothing copyrighted is committed, and `SmartImage` degrades to a
   branded placeholder if one ever 404s.
4. **The map is illustrative.** Real coordinates are projected onto a stylised coastal plan so the
   prototype needs no API key. `MapPanel`'s props are the same ones a Mapbox layer would take.
5. **Weather, tides, and beach flags are static mock values**, not a live feed.
6. **Grocery totals are estimates.** The guest sees an estimate before submitting and is charged the
   real receipt total plus fees — which is why payment happens after confirmation, not at request.
7. **Transfer pricing** is `airport base × vehicle multiplier + $15 per bag over capacity`. A real
   quote will come from the transport partner.
8. **Partner transactions happen off-platform.** Partner pages lead with *Visit website* and *Call*,
   both tracked as outbound engagement. We never claim to know whether a booking completed, and every
   partner page carries a disclosure saying so.
9. **The "Advance to…" controls on tracking pages are prototype-only** stand-ins for the operations
   console, clearly labelled as such in the UI.
10. **Dates are pinned to the demo stay** (20–27 August 2026) so the app looks correct mid-stay.
11. **No dark mode.** The brief specified one warm, coastal palette; the tokens are structured so a
    dark theme could be added later without touching components.
