# My30A Host backend

Production API for the four My30A Host React apps (`user`, `host`, `partner`, `admin`).

Vitoria is the guest concierge. Grocery delivery and airport transfers are My30A-operated orders. Partners are referral listings only — the API tracks views and outbound clicks, never bookings or revenue.

## Stack

Node.js 20+, TypeScript, Express, PostgreSQL via Supabase, Socket.IO, Nodemailer, OpenAI Responses API, Zod, Pino.

## Setup

```bash
cd backend
cp .env.example .env
# fill real values — never commit .env
npm install
npm run migrate
npm run seed
npm run dev
```

The API listens on `PORT` (default `4000`).

## Environment

Copy `.env.example`. Required at runtime:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL` (direct, port 5432 — migrations)
- `SUPABASE_POOLER_URL` (pooler, port 6543 — runtime)
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `OFFICIAL_EMAIL`
- `JWT_SECRET`, `SESSION_SECRET` (32+ characters)

`SUPABASE_SERVICE_ROLE_KEY` is required for Storage signed URLs. If it is empty the API still starts, but proof-photo uploads return `STORAGE_NOT_CONFIGURED`.

Frontend apps may only use:

- `VITE_API_BASE_URL`
- `VITE_SOCKET_URL`

Do not put secrets in `VITE_` variables.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Watch server |
| `npm run migrate` | Apply `supabase/migrations` |
| `npm run seed` | Demo accounts and catalogue |
| `npm test` | Isolation, auth, order, partner tests |
| `npm run smoke` | Hit a running server |
| `npm run verify` | Check `OPENAI_MODEL` against `/v1/models` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled server |

## Demo accounts (seed)

| Role | Email | Password |
|---|---|---|
| Guest (stay) | `sarah@my30a.com` | `demo1234` |
| Guest (stay) | `daniel@my30a.com` | `demo1234` |
| Guest (no stay) | `alex@my30a.com` | `demo1234` |
| Host | `michael@coastalkey30a.com` | `demo1234` |
| Partner | `glow@30abonfires.com` | `demo1234` |
| Super admin | `alicia@my30a.com` | `admin1234` |
| Operations | `marcus@my30a.com` | `admin1234` |
| Finance | `priya@my30a.com` | `admin1234` |
| Content | `tom@my30a.com` | `admin1234` |
| Support | `sofia@my30a.com` | `admin1234` |

Access codes: `MY30A-8842` / slug `demo`, `MY30A-2291` / slug `daniel`.

## Architecture

Layered Express app: routes → services → repositories (SQL) → PostgreSQL.

Authorization is enforced on every route (JWT + role + ownership + admin permission matrix). Supabase RLS is enabled on private tables so the anon key cannot read them.

Vitoria calls named tools only. The model never receives SQL and cannot supply another guest’s `property_id`.

## Payments

`PAYMENT_PROVIDER=none`. `NullPaymentProvider` always returns `PAYMENT_PROVIDER_NOT_CONFIGURED`. Stripe is not installed. Tip and cancellation fields exist; nothing is charged.

## Email vs notifications

Nodemailer sends official transactional email only. In-app notifications are database rows plus Socket.IO `notification:new`. No Firebase.

## Socket.IO

Authenticated with the same JWT. Rooms: `guest:{id}`, `host:{id}`, `partner:{id}`, `admin:{id}`, `admin:ops`.

Events: `notification:new`, `order:created`, `order:updated`, `grocery:updated`, `transfer:updated`, `partner:updated`.

## Storage

Buckets intended: `property-images`, `partner-images`, `order-proof`, `avatars`, `content-images`. Proof photos use signed URLs.

## API

See [API.md](./API.md). Envelope:

```json
{ "success": true, "data": {} }
{ "success": false, "error": { "code": "AUTH_REQUIRED", "message": "..." } }
```

## Frontends

From each app folder, `.env.development` should set `VITE_API_BASE_URL=http://localhost:4000`. If that variable is unset, the existing mock services still run so jsdom tests pass.
