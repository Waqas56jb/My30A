# My30A — Admin & Operations (`/admin`)

The operations control centre for the whole My30A ecosystem: guests, hosts, properties, partners,
the Local Guide, grocery delivery, airport transfers, payments, Vitoria, content and reporting.

**Frontend only.** No backend, no database, no Stripe, no AI provider, no email or push service.
Everything runs on seeded mock data behind a service layer designed to be swapped for real
endpoints. Nothing in this build sends, charges or schedules anything.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:5190
npm run build      # production build into dist/

npm test           # 60 routes + 37 interaction flows (jsdom)
npm run test:images
SMOKE_VIEWPORT=desktop npm run test:routes   # same routes at desktop widths
```

Sign in with any demo account — password `admin1234` for all of them:

| Email | Role | What they can reach |
| --- | --- | --- |
| `alicia@my30a.com` | Super Admin | Everything, including settings and admin users |
| `marcus@my30a.com` | Operations | Approvals, orders, transfers, guests |
| `priya@my30a.com` | Finance | Payments, refunds, tips, subscriptions, analytics |
| `tom@my30a.com` | Content Manager | Local Guide, content, media |
| `sofia@my30a.com` | Support | Escalations, guests, orders |

The login screen also has a role picker so one account can walk through every permission set. A real
system takes the role from the account, never from the form — that control is a demo affordance.

---

## 1. The three roles this panel manages

These are not interchangeable, and the UI never mixes them.

| | What it is | Relationship to My30A | What admin does |
| --- | --- | --- | --- |
| **Host** | Owner or manager of a vacation property | Pays a subscription | Approve, suspend, edit properties, manage billing |
| **Partner** | An independent local business | Pays nothing, takes no bookings here | Approve the listing, manage visibility, report referral traffic |
| **Guest** | The vacationer | Pays for services My30A runs itself | Look up the stay, manage their requests, payments, reviews |

### The partner rule, stated once and enforced everywhere

A partner is a business we point guests at, not a supplier we book. The guest sees the listing, then
calls, opens the website or drives over — and everything after that happens off-platform.

So the only four things this panel can honestly report are:

```
partner_view · website_click · phone_click · directions_click
```

There is deliberately **no** `bookings`, `revenue`, `commission` or `conversion-to-sale` field on a
partner anywhere in the data layer, and every screen showing partner numbers carries the
`ReferralNote` disclosure. A column labelled "clicks" next to a business name invites the reader to
assume it means sales; saying otherwise once at the top of the page is cheaper than correcting it in
a meeting later.

A flow test asserts this: `Partner analytics never claims a sale`.

### The services My30A does run

Grocery delivery and airport transfers **are** ours, so admin owns their whole lifecycle — request,
confirmation, payment, fulfilment, completion, tip, cancellation and refund. Those screens have
every step, because every step is really ours to operate.

---

## 2. Routes

Every route has a complete UI. Nothing is a placeholder.

| Route | Page |
| --- | --- |
| `/admin/login` · `/admin/forgot-password` · `/admin/logout` | Mock auth |
| `/admin/dashboard` | Executive view: eight headline numbers, today's movement, seven switchable charts, the attention queue |
| `/admin/operations` | The daily work centre — needs-attention, today's schedule, queues, active orders, recent activity |
| `/admin/guests` · `/admin/guests/:id` | Guest list and a full record with an assembled timeline |
| `/admin/hosts` · `/admin/hosts/:id` | Hosts, approvals, properties, subscription |
| `/admin/partners` · `/admin/partners/:id` | Applications, approval flow, listing details, referral analytics |
| `/admin/properties` · `/admin/properties/:id` | Property list and full editor including Vitoria configuration |
| `/admin/local-guide/categories` | Create, edit, reorder, enable/disable categories |
| `/admin/local-guide/listings` | Guest-facing listing controls: publish, feature, pricing |
| `/admin/local-guide/featured` | Featured places, and strong candidates to promote |
| `/admin/grocery` · `/admin/grocery/:id` | Grocery queue and the full seven-step workflow |
| `/admin/transfers` · `/admin/transfers/:id` | Transfer queue, driver assignment, cancellation preview |
| `/admin/service-requests` | Both service queues in one list |
| `/admin/vitoria` | AI overview: automation rate, escalations, topics, requests created |
| `/admin/vitoria/conversations` · `/:id` | Conversation list and transcript |
| `/admin/vitoria/activity` | Volume, response times, escalations waiting, requests raised |
| `/admin/vitoria/knowledge` | Knowledge base management (editorial only — no vector store) |
| `/admin/vitoria/automation` | Scheduled behaviours with enable/disable |
| `/admin/payments` | Every transaction, with a timeline and refunds |
| `/admin/payments/refunds` | Refund queue and the cancellation rules that produce them |
| `/admin/payments/tips` | Tips, who they go to, and the rates chosen |
| `/admin/subscriptions` | Host plans and billing state |
| `/admin/analytics` + `/guests` `/partners` `/services` `/revenue` | Four analytics surfaces plus an overview |
| `/admin/reviews` | Ratings with hide / flag / restore |
| `/admin/notifications` | Push and email, with a composer |
| `/admin/content` | Guest-facing blocks: heroes, featured experiences, promotions |
| `/admin/media` | Media library with mock upload |
| `/admin/reports` | Eight reports, preview and CSV export |
| `/admin/audit` | Every change made in the panel |
| `/admin/admin-users` | Team and the permission matrix |
| `/admin/settings` | Nine sections, including all commercial rules |

Aliases: `/` and `/admin` → `/admin/dashboard`, `/login` → `/admin/login`.

---

## 3. How the mock layer works

`src/services/adminApi.js` is the single mock backend. Every collection seeds from
`src/data/*`, then persists a local copy so an approval or a status change survives a refresh.
`resetAll()` restores the shipped fixtures — there is a button for it in Settings.

Three things are worth knowing:

**Fixtures are generated, not typed.** A hundred hand-written guests end up looking like ten guests
written ten times. `src/data/seed.js` holds a seeded xorshift generator, so the same numbers appear
on every machine and every run — screenshots stay true and a demo can be talked about.

**"Today" is pinned.** `TODAY` in `seed.js` is a fixed date. A fixture that says "arriving tomorrow"
has to still say that next month.

**Every mutation writes to the audit log.** `recordAudit()` is called inside the service functions,
not by the components, so an action cannot be performed without being recorded.

Derived numbers are computed on read rather than stored twice — a host's property count comes from
the properties table, a guest's status from their stay dates, Vitoria's automation rate from the
conversations themselves. Two stored copies of the same fact eventually disagree.

---

## 4. Two implementation details worth keeping

**The session is read synchronously.** `AdminProvider` initialises from localStorage in `useState`,
not in an effect. An async check renders every guarded route as signed-out for one frame and bounces
the operator to `/admin/login` on every refresh.

**Signing out is a route, not a click handler.** `/admin/logout` is deliberately unguarded. Clearing
the session while still standing on a guarded screen is a race: React Router defers navigation
inside a transition, so the state update lands first, the guard re-renders, and the operator ends up
on the login page with a `from` pointing back at where they were.

---

## 5. Responsive

Tested at 375, 390, 430, 768, 1024, 1280 and 1440px.

- **≥1100px** — fixed sidebar rail, top bar, and the main column owns the vertical scroll so the
  navigation stays put while a long table moves.
- **<1100px** — top bar with a drawer holding the same tree, so nothing is unreachable.
- **<900px** — every table becomes a stack of labelled cards. Not a style choice: a nine-column
  table on a 375px phone either scrolls sideways or shrinks the text to nothing.
- Charts render into a viewBox at 100% width, so they resize with their container without a resize
  observer.
- Grid tracks use `minmax(0, …)` and grid children carry `min-width: 0` — the default `min-width:
  auto` is what lets a wide child push its track past the container.
- Search inputs use `max(16px, …)` so iOS does not zoom the layout on focus.

---

## 6. Testing

```bash
npm test                                     # 60 routes + 37 flows
SMOKE_VIEWPORT=desktop npm run test:routes   # the same routes in the table layout
npm run test:images                          # every remote image URL resolves
```

**Routes** (`scripts/smoke.jsx`) — mounts every route, waits for the mock API, and asserts each page
rendered real content rather than a skeleton or the error boundary. React key warnings and invalid
DOM nesting are treated as failures. Guarded routes are checked signed-out too.

**Flows** (`scripts/flows.jsx`) — the partner approval flow including a rejection that demands a
reason, a grocery order driven through all seven steps, a transfer completing and capturing its card
hold, a refund previewed then committed, filters, pagination, global search, role-limited
navigation, knowledge and media editing, category deletion being blocked while listings use it, an
API failure recovering on retry, the drawer, and sign-out.

Two of those tests guard business rules rather than mechanics: `Partner analytics never claims a
sale`, and `Vitoria must not quote partner prices by default`.

Current status: **60/60 routes (mobile and desktop), 37/37 flows, 88/88 images**, clean console,
production build succeeds.

---

## 7. What is ready for backend integration

| Seam | File | Replace with |
| --- | --- | --- |
| Every read and write | `src/services/adminApi.js` | Real endpoints; the promise shapes stay the same |
| Transport, latency, failure simulation | `src/services/mockClient.js` | `fetch` |
| Authentication | `src/services/authService.js` | A real provider; `getSession()` must stay synchronous |
| Report generation | `src/services/reportService.js` | Server-side export |
| Audit trail | `recordAudit()` in `adminApi.js` | A real append-only log |

Commercial rules — host plans, grocery service-fee tiers, transfer cancellation tiers, tip presets —
live in `src/data/settings.js` and are editable in Settings, because the final numbers are not
agreed. Nothing in the UI hardcodes a price.

---

## 8. Deliberately not built

Backend, database, Stripe, Supabase, real AI, real email or push. Beyond that:

- **No partner booking, availability or commission** anywhere — see the partner rule above.
- **No vector database.** `/admin/vitoria/knowledge` manages the content; retrieval does not exist.
- **No enforced permissions.** Roles hide navigation, which is a convenience for the operator, not
  access control. With no server there is nothing to enforce a permission, and presenting it as
  security would be dishonest. The matrix on `/admin/admin-users` is the model to build against.
- **No IP addresses in the audit log.** There is no request to read one from; a plausible-looking
  address would be fabricated evidence, so the column shows `—`.
- **No card data.** `•••• 4242` is a label, not a truncated PAN. A flow test asserts nothing on the
  payments screen matches a 13–19 digit sequence.
