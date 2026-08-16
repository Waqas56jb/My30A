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

Start at `/` and pick a demo guest, or go straight to **`/guest/demo`** (Sarah at Rosemary Beach
House, 20–27 August 2026). A second link, `/guest/daniel`, resolves a different guest and property so
you can see the app adapt.

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
    │   ├── nav/Navigation.jsx  # Sidebar, TopBar, MobileBottomNav
    │   ├── service/PaymentPanel.jsx
    │   ├── ui/                 # design-system primitives
    │   ├── ContextRail.jsx
    │   └── ErrorBoundary.jsx
    ├── context/AppContext.jsx  # guest session, notifications, saved places, toasts
    ├── data/                   # all mock data, one file per entity
    ├── hooks/                  # useAsync, useVisualViewport, useMediaQuery, …
    ├── layouts/AppLayout.jsx   # responsive shell
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

| Route | Page |
| --- | --- |
| `/` | Landing / guest-link entry |
| `/guest/:guestId` | Resolves the guest link and seeds the session |
| `/home` | Guest dashboard |
| `/vitoria` | AI concierge conversation |
| `/explore` | Explore 30A (categories, search, list/map) |
| `/map` | Full map experience with layer filters |
| `/restaurants` · `/restaurants/:id` | Restaurant list and detail |
| `/partners` · `/partners/:id` | Partner directory and detail (`?category=` supported) |
| `/beaches` · `/beaches/:id` | Beach guide and detail |
| `/events` · `/events/:id` | Events by day and detail |
| `/services` | Service catalogue + My Services |
| `/groceries` · `/groceries/new` · `/groceries/:id` | Grocery list, request wizard, tracking |
| `/transfers` · `/transfers/new` · `/transfers/:id` | Transfer list, request form, tracking |
| `/my-stay` | Property information |
| `/my-trip` | Trip overview, saved places, preferences, stay rating |
| `/notifications` | Notification centre |
| `/profile` · `/settings` | Guest profile and settings |
| `/orders` → `/services`, `/property` → `/my-stay` | Convenience redirects |
| `*` | Not-found page |

---

## 3. Major components

**Layout & navigation** — `AppLayout`, `Sidebar`, `TopBar`, `MobileBottomNav`, `PageHeader`,
`Breadcrumbs`, `StickyBar`, `ContextRail`, `ErrorBoundary`

**UI primitives** (`components/ui`) — `Button` (+`PrimaryButton`/`SecondaryButton`/`GhostButton`/
`IconButton`), `SmartImage`, `Modal`, `ConfirmModal`, `BottomSheet`, `Lightbox`, `Toaster`,
`EmptyState`, `ErrorState`, `SuccessState`, `Skeleton`/`SkeletonGrid`/`SkeletonList`/`SkeletonPage`,
`StatusBadge`, `PaymentBadge`, `Badge`, `SearchBar`, `FilterChips`, `Segmented`, `OptionGrid`,
`Stepper`, `Checkbox`, `Switch`, `Field`/`Input`/`Textarea`/`Select`, `RatingInput`, `RatingStars`,
`PriceDisplay`, `MetaRow`, `Avatar`, `CopyField`, `DefinitionList`, `Timeline`, `Section`, `Callout`,
`ScrollRow`, `ImageGallery`, `Icon`

**Cards** — `PlaceCard` (+ `RestaurantCard`, `PartnerCard`, `BeachCard`), `CategoryCard`,
`EventCard`, `ServiceCard`, `OrderCard`, `NotificationItem`, `RecommendationCard`

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
| `mockGuests` | Guests, stay window, preferences, **Vitoria memories**, saved places |
| `mockProperties` | Property, WiFi, access codes, check-in/out steps, rules, host, emergency |
| `mockRestaurants` | 14 restaurants with cuisine, hours, price level, distance |
| `mockPartners` | 21 partners across Golf, Boating, Photography, Bonfires, Bike Rentals, Wellness & Spa, Family Services, Babysitters, Activities, Transportation, Shopping |
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
npm test                                  # 37 routes + 21 interaction flows
SMOKE_VIEWPORT=desktop npm run test:routes # same routes at desktop widths
```

**Routes** (`scripts/smoke.jsx`) — mounts every route, waits for the mock API, and asserts each page
rendered real content rather than a skeleton or an error boundary. React key warnings and invalid DOM
nesting are treated as failures.

**Flows** (`scripts/flows.jsx`) — covers sending a message to Vitoria and getting a grounded answer,
suggested prompts with entity cards, both request wizards including every validation branch, status
progression, mock card authorisation, tipping, rating, cancellation with confirmation, filters,
search empty states, map list/map toggle, map pin sheets, Escape-to-close dialogs, saving places,
marking notifications read, editing preferences, and API-failure/retry recovery.

**Images** (`scripts/check-images.mjs`) — verifies all 67 registry URLs still return an image.

Current status: **37/37 routes (mobile and desktop), 21/21 flows, 67/67 images**, clean console,
production build succeeds.

---

## 8. Responsive & mobile notes

- **Mobile** — bottom tab bar, full-width cards, bottom sheets, ≥44px touch targets, safe-area insets
  on every fixed surface.
- **Tablet** — the mobile shell with multi-column grids.
- **Desktop (≥1024px)** — persistent sidebar, scrollable main column, sticky detail asides. Not a
  stretched mobile layout.
- **Wide (≥1360px)** — a contextual right rail on Home and Vitoria (conditions, stay, in-progress
  services, remembered preferences).

The chat deserves specific mention. `useVisualViewport` publishes the *visual* viewport height and
offset to CSS, and the chat screen is pinned to it. That means the composer sits directly above the
software keyboard rather than behind it, the thread stays scrollable, the tab bar hides while typing,
the textarea uses a 16px font so iOS never zooms on focus, message text is selectable, long messages
wrap, and Enter sends while Shift+Enter inserts a newline.

---

## 9. Assumptions

1. **The link is the credential.** `/guest/:guestId` resolves a guest from mock data with no auth, as
   specified. Real token exchange belongs in `AppContext.loadSession`.
2. **Business details are illustrative.** Real 30A business names are used so the prototype reads
   authentically, but phone numbers are reserved fictional `555-01xx` numbers, and ratings, prices,
   and hours are invented. Replace them with licensed partner data before anything public.
3. **Imagery is remote and unverified by eye.** All photos are Unsplash CDN URLs chosen per subject
   and verified to resolve (`npm run test:images`); nothing copyrighted is committed. Every image
   renders through `SmartImage`, so a failure degrades to a branded placeholder rather than a broken
   layout. Worth one visual pass before a client demo.
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
