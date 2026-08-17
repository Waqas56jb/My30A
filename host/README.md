# My30A Host (`host/`)

The property owner's control centre behind the guest experience.

A host adds their rental, enters the private information a guest actually needs — WiFi, door codes,
check-in, house rules, parking, emergencies — adds their own local recommendations, publishes, and
hands out a link and QR code. From then on Vitoria answers guest questions and the host sees what
was asked, what was viewed, and what she could not answer.

**Frontend only.** No backend, no database, no real authentication, no Stripe, no AI, no
notifications. Everything runs on mock data behind a service layer built to be swapped for HTTP.

There is **no host subscription and no checkout anywhere in this app** — the guest experience is free
and the account exists purely so private property information stays private.

```
user/   public guest experience — sells 30A, unlocks a stay
host/   this app — property configuration, guest access, insights
```

---

## Running it

```bash
cd host
npm install
npm run dev          # http://localhost:5174   (the guest app runs on 5173)
```

Sign in at **`/host/login`** with **michael@coastalkey30a.com** and any password, or create an
account — signup lands you in email verification (any 6 digits) and then onboarding.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server, exposed on the LAN so you can open it on a phone |
| `npm run build` / `npm run preview` | Production build and preview |
| `npm test` | 38 routes + 26 interaction flows in jsdom |
| `npm run test:images` | Checks every remote image URL still resolves |

---

## 1. Folder structure

```
host/
├── index.html
├── vite.config.js
├── scripts/                     # test harness (not shipped)
│   ├── setup-dom.js             # jsdom preload
│   ├── smoke.jsx                # every route renders real content
│   ├── flows.jsx                # interaction / flow tests
│   └── check-images.mjs
└── src/
    ├── assets/images.js         # shared photo registry (remote URLs)
    ├── components/
    │   ├── charts/Charts.jsx    # BarChart, TrendChart, RankBars, Donut, StarBreakdown
    │   ├── nav/                 # Sidebar, TopBar, BottomTabs, HostDrawer
    │   ├── ui/                  # design-system primitives, shared with the guest app
    │   ├── DataTable.jsx        # table on desktop, cards on mobile
    │   ├── HostUI.jsx           # Kpi, Panel, SetupChecklist, ActivityList, status pills
    │   ├── PropertySwitcher.jsx
    │   ├── QRCode.jsx
    │   └── ErrorBoundary.jsx
    ├── context/
    │   ├── AuthContext.jsx      # mock session + route guarding
    │   └── WorkspaceContext.jsx # properties, active property, notifications, toasts
    ├── data/                    # properties, guests, recommendations, conversations,
    │                            # analytics, notifications, help, host account
    ├── hooks/                   # useAsync, useMediaQuery, useVisualViewport, …
    ├── layouts/HostLayout.jsx
    ├── pages/
    │   ├── auth/                # Login, Signup, PasswordPages (forgot/reset/verify)
    │   ├── property/            # PropertyLayout, Overview, Sections, Photos,
    │   │                        # Recommendations, GuestAccess, Preview
    │   └── …                    # Dashboard, Onboarding, Properties, Guests, Vitoria,
    │                            # Activity, Analytics, Notifications, Profile, Settings, Help
    ├── services/                # auth, property, guest, vitoria, analytics,
    │                            # recommendation, notification + mockClient
    ├── styles/                  # tokens, base, components (shared) + host.css
    └── utils/
```

---

## 2. Routes

Every route is implemented and tested — none are placeholders.

**Public (no session)**

| Route | Page |
| --- | --- |
| `/host/login` · `/host/signup` | Sign in, create account |
| `/host/forgot-password` · `/host/reset-password` | Password reset |

**Authenticated** — visiting any of these signed out bounces to login and returns you afterwards.

| Route | Page |
| --- | --- |
| `/host/verify-email` | Six-digit verification |
| `/host/onboarding` | Guided setup over the real checklist |
| `/host/dashboard` | Property health at a glance |
| `/host/properties` · `/host/properties/new` | Property list, add property |
| `/host/properties/:id` | Overview |
| `…/information` `…/wifi` `…/check-in` `…/check-out` `…/rules` `…/parking` `…/emergency` | Section forms |
| `…/recommendations` `…/photos` `…/guest-access` `…/vitoria` `…/preview` | Recommendations, gallery, link + QR, Vitoria config, guest preview |
| `/host/guests` · `/host/guests/:id` | Guest list and detail |
| `/host/vitoria` | Conversations, top questions, escalations |
| `/host/activity` · `/host/analytics` | Activity feed, charts and engagement |
| `/host/notifications` `/host/profile` `/host/settings` `/host/help` | Account |
| `/` · `/host` | Redirect to the dashboard |
| `*` | Not found |

---

## 3. What actually works

Every button in the brief does something real against the mock layer:

- **Add property** → creates a draft, switches the workspace to it, opens it
- **Save WiFi / check-in / check-out / parking / emergency** → validates, persists, shows in the guest preview
- **House rules** → add, edit, enable/disable without deleting, delete with confirmation
- **Photos** → add from a sample library, caption, reorder, set cover, remove
- **Recommendations** → add, edit, feature, delete, search and filter
- **Publish / Pause / Delete property** → confirmation dialogs that explain the consequence, then real status change
- **Generate / regenerate guest access** → new link and code, old one invalidated
- **Copy link, copy code, share** → clipboard with toast feedback
- **Preview as guest** → phone-framed render of the guest experience, with a toggle to check what a
  public visitor sees instead
- **Property switcher** → moves the whole panel to another rental
- **Guests** → search, filter by access status, open a guest, see their activity and conversations
- **Vitoria** → filter conversations, isolate unanswered ones, open a transcript
- **Analytics** → switch range, charts redraw
- **Notifications** → open, deep-link, mark all read
- **Settings** → toggle privacy masking, simulate API failures, reset demo data, sign out

---

## 4. Mock data

`src/data/` — one file per entity, re-exported from `data/index.js`.

| File | Contents |
| --- | --- |
| `properties.js` | 3 properties (published, published, draft) with WiFi, access, rules, parking, emergency, photos, branding, Vitoria config, guest access, stats; plus `setupProgress()` |
| `guests.js` | 7 guests across access states, per-guest activity, property activity feed |
| `recommendations.js` | 9 host picks with the host's own note |
| `conversations.js` | 7 conversation summaries with transcripts, resolved/escalated flags, and aggregated top questions |
| `analytics.js` | Per-property, per-range totals and series; partner engagement; satisfaction distribution |
| `notifications.js` | Host notification feed |
| `host.js` | The host account, demo credentials, onboarding steps |
| `help.js` | Help centre content and support contact |

Setup completion is computed, not stored: `sectionComplete()` asks whether the fields a guest would
actually miss are filled in, so the checklist cannot drift from reality.

---

## 5. Service layer

Components never touch mock data for anything dynamic. `services/mockClient.js` provides the shared
transport — latency, `setFailureMode()` for exercising error states, and a tiny pub/sub so a service
can tell React something changed.

```
authService          login, signUp, signOut, requestPasswordReset, resetPassword,
                     verifyEmail, updateProfile, updateSettings, validateEmail/Password
propertyService      listProperties, getProperty, createProperty, updateProperty,
                     deleteProperty, setPropertyStatus, regenerateGuestAccess,
                     addPhoto, removePhoto, setCoverPhoto, movePhoto, updatePhoto,
                     saveRule, removeRule, resetProperties
guestService         listGuests, getGuest, getGuestActivity, getRecentActivity, getGuestCounts
vitoriaService       listConversations, getConversation, getVitoriaSummary, saveVitoriaConfig
analyticsService     getAnalytics, getPartnerEngagement, getSatisfaction, getPropertySnapshot
recommendationService listRecommendations, getRecommendation, saveRecommendation,
                     deleteRecommendation, countForProperty
notificationService  listNotifications, markRead, markAllRead, push, unreadCountSync
```

Anything the host creates or edits persists to `localStorage`, so a demo survives a refresh.
**Settings → Reset demo data** restores the fixtures.

---

## 6. Ready for backend integration

| Concern | Where it plugs in |
| --- | --- |
| **Auth** | `services/authService.js` — `AuthContext` only knows `login/signUp/signOut` and a `host` object. Route guarding already lives in `HostLayout`. |
| **REST/GraphQL** | Reimplement each service against HTTP. Function names, arguments and return shapes are the contract. |
| **Guest access issuance** | `regenerateGuestAccess` and `setPropertyStatus` are the two places a real token/QR would be minted. |
| **QR codes** | `components/QRCode.jsx` draws a placeholder pattern and the UI says so. Swap it for a server-rendered scannable code. |
| **File uploads** | `addPhoto` takes an image reference — point it at your storage and the gallery UI is unchanged. |
| **Analytics** | `analyticsService` returns totals + series in the shape the charts consume. |
| **Notifications** | `notificationService.push()` already feeds the bell live; point it at a socket or push handler. |

---

## 7. Testing

Two jsdom harnesses run the real application.

```bash
npm test                                   # 38 routes + 26 flows
SMOKE_VIEWPORT=desktop npm run test:routes # same routes at desktop widths
```

**Routes** — mounts every route signed in and signed out, and asserts each rendered real content
rather than a skeleton, the error boundary, or the login screen when it should have been
authenticated. React key warnings and invalid DOM nesting fail the run.

**Flows** — login rejection and success, sign-out guarding, signup validation, saving WiFi and seeing
it reach the guest preview, password masking, required-field validation, adding/toggling/deleting
house rules, publishing, pausing, regenerating guest access, the private/public split, adding and
deleting recommendations and photos, creating a property, search, guest filtering and detail,
opening a Vitoria transcript, isolating unanswered questions, analytics range switching, the empty
analytics state, the mobile drawer, the property switcher, notifications, and API-failure recovery.

Current status: **38/38 routes (mobile and desktop), 26/26 flows, 88/88 images**, clean console,
production build succeeds.

---

## 8. Responsive

Built mobile-first because hosts do this standing in the property.

- **Phone** — top bar with a slide-in drawer, five-item bottom tab bar, single-column forms, sticky
  save bar above the tabs, ≥44px targets, safe-area insets on every fixed surface.
- **Tables become cards below 860px.** No horizontal scrolling anywhere; the responsive `DataTable`
  renders labelled cards on small screens and a real `<table>` above.
- **Charts** are hand-rolled SVG in a viewBox, so they scale to the container from 320px up with no
  resize observer and no charting dependency.
- **Tablet** — the mobile shell with multi-column grids.
- **Desktop (≥1024px)** — persistent sidebar with the property switcher, scrollable main column,
  main + aside layouts at 1100px.

---

## 9. Assumptions

1. **Authentication is mocked.** Any password works for the demo account; a created account is stored
   in `localStorage`. Real token exchange belongs in `authService`.
2. **The QR code is a placeholder pattern, not a scannable code.** Generating a real one needs
   Reed-Solomon encoding, which belongs on the backend when access is issued. The UI labels it, so
   nobody prints one expecting it to scan.
3. **Uploads are mocked.** Photos are chosen from a sample library; the flow, ordering, captions and
   cover selection are all real.
4. **Analytics are illustrative fixtures**, but the shapes are honest: partner engagement counts
   views and outbound taps only, because what happens on a partner's own site is not observable —
   the UI says so rather than implying bookings.
5. **The guest preview is a representation, not the guest app embedded.** It renders from the same
   property data a guest receives. When the apps share a backend, this is where a live iframe or a
   shared component package would go.
6. **Multi-property support is deliberately simple** — a switcher and a list, no teams, roles, or
   bulk operations. The brief asked for the architecture, not the enterprise features.
7. **Dates are pinned to the demo window** (August 2026) so stays read as current.
8. **No partner or admin functionality is present**, per the brief. Hosts manage their own property
   and their own recommendations; the platform's partner directory is not editable here.
