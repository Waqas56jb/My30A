# My30A Partner Portal (`partner/`)

Where a local 30A business manages how it appears to guests — and sees exactly how much interest
My30A sends its way.

**Frontend only.** No backend, no database, no real authentication, no Stripe, no APIs. Everything
runs on mock data behind a service layer built to be swapped for HTTP.

```
user/      public guest experience — sells 30A, unlocks a stay
host/      property owners — private property info, guest access
partner/   this app — local businesses, listings, and outbound engagement
```

---

## The business model, in one paragraph

My30A does not take partner bookings. A guest discovers a business, reads the listing, looks at the
photos, and then taps **Call**, **Website**, or **Directions** — at which point they leave and deal
with the partner directly. So this portal counts **profile views, website clicks, phone clicks and
directions clicks**, and says plainly on every page that shows numbers that it cannot see purchases,
phone conversations, or offline bookings. There is no checkout, no order list, no commission, and no
booking calendar anywhere in the app — a test asserts that.

---

## Running it

```bash
cd partner
npm install
npm run dev          # http://localhost:5185
```

Sign in at **`/partner/login`** with any password. The login screen lists demo accounts covering
every listing state:

| Business | State |
| --- | --- |
| Glow & Flow 30A Beach Bonfires | Approved, with full analytics |
| 30A Golf Cart Rentals | Approved |
| 30A Bike Rentals | Approved |
| Rosemary Beach Photography | Pending review |
| 30A Wellness Studio | Rejected, with a reason |
| 30A Coastal Boating | Suspended, with a reason |

Or apply from scratch at **`/partner/register`** — the application signs you straight in so you can
see the pending state.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server, exposed on the LAN so you can open it on a phone |
| `npm run build` / `npm run preview` | Production build and preview |
| `npm test` | 22 routes + 20 interaction flows in jsdom |
| `npm run test:images` | Checks every remote image URL still resolves |

---

## Routes

Every route is implemented and tested — nothing says "coming soon".

**Public**

| Route | Page |
| --- | --- |
| `/partner/login` | Sign in, with demo accounts |
| `/partner/register` | Five-step application with a **live listing preview** |
| `/partner/forgot-password` · `/partner/reset-password` | Password reset |

**Authenticated** — visiting these signed out bounces to login and returns you afterwards.

| Route | Page |
| --- | --- |
| `/partner/dashboard` | Status banner, engagement stats, trend, listing strength, journey |
| `/partner/profile` | Business info, optional pricing, hours, social — with live preview |
| `/partner/photos` | Logo, cover, gallery: add, reorder, feature, set cover, delete |
| `/partner/preview` | The guest-facing listing, phone or desktop, with live event logging |
| `/partner/analytics` | Views / website / phone / directions over time, interest, referrers |
| `/partner/notifications` · `/partner/settings` · `/partner/help` | Account |
| `/` · `/partner` | Redirect to the dashboard |
| `*` | Not found |

---

## What actually works

- **Apply** → five validated steps, live preview beside the form, submits to *Pending review*
- **Sign in / out** → guarded routes, redirect back to where you were headed
- **Edit profile** → validation, live preview of the draft, save
- **Optional pricing** → switch it off and the listing shows *Contact for pricing*
- **Photos** → add from the sample library, reorder, feature, set cover, delete with confirmation
- **Preview** → tap Call / Website / Directions and see the exact event that would be logged
- **Analytics** → switch range (7d / 30d / 90d / 12m) and metric; charts redraw
- **Status states** → approved, pending, rejected (with reason + **resubmit**), suspended (with reason)
- **Notifications** → open, deep-link, mark all read
- **Settings** → account, notification preferences, account visibility, failure simulation, reset demo data, delete-account dialog

---

## Architecture

```
partner/src/
├── assets/images.js          # shared photo registry (remote, subject-checked)
├── components/
│   ├── charts/Charts.jsx     # BarChart, TrendChart, RankBars, Donut — hand-rolled SVG
│   ├── nav/                  # Sidebar, TopBar, BottomTabs, PartnerDrawer
│   ├── ui/                   # design-system primitives shared with the other apps
│   ├── ListingPreview.jsx    # the guest-facing listing, one component, reused everywhere
│   ├── PartnerUI.jsx         # Panel, Stat, StatusBanner, TrackingCard, Journey
│   └── ErrorBoundary.jsx
├── context/PartnerContext.jsx
├── data/                     # partners, analytics, notifications
├── hooks/                    # useAsync, useMediaQuery, useDocumentTitle, …
├── layouts/PortalLayout.jsx
├── pages/                    # Login, Register, Dashboard, Profile, Photos,
│                             # Preview, Analytics, Notifications, Settings, Help
├── services/                 # auth, partner, analytics, notification + mockClient
└── styles/                   # tokens, base, components (shared) + partner.css
```

**Services** — components never touch mock data for anything dynamic:

```
authService       login, signOut, requestPasswordReset, resetPassword, validate*
partnerService    listPartners, getPartner, updatePartner, applyAsPartner, setStatus,
                  resubmit, addPhoto, removePhoto, setCoverPhoto, toggleFeatured,
                  movePhoto, setLogo, resetPartners
analyticsService  getAnalytics, getInterest, getReferrers, trackingPolicy,
                  totalEngagement, connectRate
notificationService listNotifications, markRead, markAllRead, push
```

`mockClient.js` provides the shared transport: latency, `setFailureMode()` for exercising error
states, and a small pub/sub so a service can tell React something changed. Anything a partner
creates or edits persists to `localStorage`; **Settings → Reset demo data** restores the fixtures.

---

## Ready for backend integration

| Concern | Where it plugs in |
| --- | --- |
| **Auth** | `services/authService.js` — the context only knows `login/signOut` and a session object |
| **REST/GraphQL** | Reimplement each service against HTTP; names, arguments and return shapes are the contract |
| **Approval workflow** | `setStatus` / `resubmit` are the two transitions; an admin panel would drive the rest |
| **Uploads** | `addPhoto` takes an image reference — point it at storage and the gallery UI is unchanged |
| **Event tracking** | The guest app fires `{ partner_id, event_type, timestamp }`; `analyticsService` is where those aggregates arrive |
| **Notifications** | `notificationService.push()` already feeds the bell live |

---

## Testing

```bash
npm test                                   # 22 routes + 20 flows
SMOKE_VIEWPORT=desktop npm run test:routes # same routes at desktop widths
```

**Routes** — every route signed in and signed out, across all four listing states. React key
warnings and invalid DOM nesting fail the run.

**Flows** — login rejection and success, sign-out guarding, the five-step application with every
validation branch, the live preview following typed input, profile validation and save, pricing
falling back to *Contact for pricing*, photo add/feature/cover/delete, the empty-gallery state,
outbound event recording, analytics range and metric switching, the empty-analytics state,
rejection + resubmit, suspension messaging, the mobile drawer, notifications, settings toggles, and
API-failure recovery.

Two of those tests exist to protect the business model rather than the UI:

- **"Nothing anywhere offers a booking, checkout or payment"** — scans every authenticated page for
  *Book now, Add to cart, Checkout, Pay now, Payment, Commission, Payout, Order, Invoice*.
- **"The tracking policy is stated on the pages that show numbers"** — every page displaying
  engagement figures must also carry the *we track / we do not track* disclosure.

Current status: **22/22 routes (mobile and desktop), 20/20 flows, 88/88 images**, clean console,
production build succeeds, dev server serves every deep link.

---

## Responsive

- **Phone** — top bar with a slide-in drawer, five-item bottom tab bar, single-column forms, sticky
  save bar, ≥44px targets, safe-area insets on every fixed surface.
- **Tablet** — the mobile shell with multi-column grids.
- **Desktop (≥1024px)** — persistent sidebar with the business card, scrollable main column,
  main + aside layouts at 1100px, sticky live preview beside the profile and registration forms.
- **No sideways scrolling** — grid tracks use `minmax(0, …)`, grid children carry `min-width: 0`,
  and the desktop scroll container uses `overflow-x: clip` (applied only where `overflow-y` is
  already `auto`, since pairing `clip` with a `visible` axis coerces that axis to `auto`).

---

## Assumptions

1. **Authentication is mocked.** Any password works; the email selects which business you manage.
   Real token exchange belongs in `authService`.
2. **Uploads are mocked.** Photos come from a curated sample library; ordering, featuring, cover
   selection and deletion are all real.
3. **Analytics are illustrative fixtures**, but the *shape* is honest — engagement only, never
   revenue or conversions, because outbound taps are the last thing the platform can observe.
4. **Ratings and review counts are display-only.** There is no review system in this build; they
   come from the fixtures and would be fed by the guest app later.
5. **Approval is an admin action.** A partner can submit and resubmit; the reviewer side belongs in
   the admin panel, which is out of scope here.
6. **Business details are illustrative.** Phone numbers are reserved fictional `555-01xx` numbers.
7. **Imagery is remote and subject-checked** — the same registry the guest app uses, verified by
   `npm run test:images`, rendered through `SmartImage` so a dead URL degrades to a placeholder
   rather than a broken layout.
