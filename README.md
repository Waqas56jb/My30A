# My30A

A premium, responsive React frontend for the My30A platform and its AI concierge, **Vitoria** —
built for the vacation-rental market along Florida's Scenic Highway 30A.

This repository holds **four independent applications**. They share a design language but nothing
else: separate builds, separate dependencies, separate deployments.

| App | Folder | Who it is for | Entry route |
| --- | --- | --- | --- |
| **Guest experience** | [`user/`](user/) | Vacationers — public website, then the app behind a login | `/` (public landing page) |
| **Host panel** | [`host/`](host/) | Property owners configuring their homes | `/host/dashboard` |
| **Partner portal** | [`partner/`](partner/) | Local businesses listed on My30A | `/partner/dashboard` |
| **Admin & operations** | [`admin/`](admin/) | The My30A team running the whole ecosystem | `/admin/dashboard` |

Each folder has its own README covering routes, mock data, components and tests.

Everything is **frontend only**. There is no backend, database, authentication server, payment
processor or AI API — every screen runs on mock data behind a service layer designed to be swapped
for real endpoints. See each README's *"What is ready for backend integration"* section.

---

## Running locally

```bash
cd user      && npm install && npm run dev     # http://localhost:5173
cd host      && npm install && npm run dev     # http://localhost:5180
cd partner   && npm install && npm run dev     # http://localhost:5185
cd admin     && npm install && npm run dev     # http://localhost:5190
```

The four dev servers use different ports on purpose, so all four can run side by side.

```bash
npm test            # route smoke tests + interaction flow tests (jsdom)
npm run test:images # verifies every remote image URL still resolves
npm run build       # production build into dist/
```

---

## Deploying to Vercel

Each app is **its own Vercel project**, because each has its own `package.json` and build output.
Four projects, one repository.

### One-time setup, per app

1. **New Project → import this repository.**
2. **Root Directory:** `user` (then repeat for `host`, `partner` and `admin`).
   Leave *"Include files outside the Root Directory"* **off** — each app is self-contained.
3. Framework preset: **Vite** (detected automatically).
   Build command `npm run build`, output directory `dist` — also pinned in `vercel.json`.
4. Deploy.

No environment variables are required. Nothing in these apps calls a network API; all data is mock
data bundled at build time.

**One optional variable**, on the **host** project only:

| Key | Value | Why |
| --- | --- | --- |
| `VITE_GUEST_APP_URL` | the guest app's domain, e.g. `https://my30a.com` | The links and QR codes a host shares point at the guest app. Set this to the domain the `user` project is served from. Defaults to `https://my30a.com` if unset — see [`host/src/config/links.js`](host/src/config/links.js). |

### Why refreshing used to 404

These are single-page applications. React Router owns `/discover`, `/host/properties/:id/wifi`,
`/partner/analytics` and so on — but those paths have no matching file on disk. A static host asked
for a file that does not exist returns **404**, which is why the first load worked and pressing
refresh (or pasting a deep link) broke.

Each app now ships a [`vercel.json`](user/vercel.json) with:

```json
"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
```

Vercel checks the filesystem **before** applying rewrites, so `/assets/*`, `/favicon.svg` and
`/robots.txt` are still served as real files; everything else is handed to `index.html` and resolved
by the router. Refresh, deep links, browser back/forward and shared URLs all behave.

The same file also sets:

- immutable, one-year caching on `/assets/*` (Vite fingerprints every filename, so they can never go stale)
- `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and a `Permissions-Policy` that denies camera, microphone, geolocation, payment and USB
- `X-Robots-Tag: noindex, nofollow` on **host**, **partner** and **admin** — those are private panels and must never be indexed. Their `robots.txt` says the same thing.

Each app also carries an `.nvmrc` (Node 22) for local `nvm` users. Vercel takes its Node version
from **Project Settings → Node.js Version** — set all four projects to **22.x** so local and remote
builds match.

### Custom domains

Nothing in the code assumes a particular hostname — no absolute URLs, no hardcoded ports, no
`basename`. Point domains wherever you like:

| Suggested domain | Project |
| --- | --- |
| `my30a.com` | `user` |
| `host.my30a.com` | `host` |
| `partners.my30a.com` | `partner` |
| `admin.my30a.com` | `admin` |

The only cross-app link is the guest-access URL the host panel generates. It is built in one place,
[`host/src/config/links.js`](host/src/config/links.js), from `VITE_GUEST_APP_URL` — so pointing the
host panel at a new guest domain is a single environment variable, not a code change. The guest app
answers both `/guest/:id` and the older `/stay/:id` shape, so links already in the wild keep working.

### Checklist before a client demo

- [ ] All four projects deploy green
- [ ] Open a deep link in each and press **refresh** — `user` → `/discover`, `host` → `/host/analytics`, `partner` → `/partner/analytics`, `admin` → `/admin/operations`
- [ ] Log in to the guest app as `sarah@my30a.com` / `demo1234`, then refresh — you stay logged in
- [ ] Landing page video autoplays muted on desktop and mobile
- [ ] `robots.txt` on host, partner and admin returns `Disallow: /`
- [ ] Sign into the admin panel as `alicia@my30a.com` / `admin1234` and check the operations queue has work in it
- [ ] Test on a real phone in both orientations — nothing scrolls sideways
