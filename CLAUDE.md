# CLAUDE.md — Workspace Operations & Handover Guide

## Monorepo Architecture
This project is structured as a Turborepo monorepo with the following workspace packages:
* **`apps/web`**: Next.js frontend web application (served on `http://localhost:3000`).
* **`apps/api`**: Hono REST & WebSocket API backend server (served on `http://localhost:3001`).
* **`packages/db`**: Prisma schema and database client workspace (PostgreSQL — local dev connects to a real Postgres 16 server via `DATABASE_URL` in `.env`, matching `docker-compose.yml`'s declared `probable`/`probable_db` credentials).
* **`packages/sdk`**: `@probable/sdk` TypeScript client package used to trigger api calls. **Built as compiled `dist/`, not consumed as source** — run `npx tsc` inside `packages/sdk` after any change to `src/index.ts`, or the web app keeps using stale types/behavior.

---

## Core Operations Commands

### 1. Build and Compile Workspace
To compile typescript types and build the Next.js bundle across all workspaces:
```bash
npm run build
```
To compile a specific package (e.g. the developer SDK):
```bash
npm run build --workspace=@probable/sdk
```

### 2. Run Local Development Server
To boot up API backend servers, Next.js frontend, and the TypeScript compiler watch mode concurrently:
```bash
npm run dev
```
*If port conflicts occur, run `lsof -ti:3000,3001 | xargs kill -9` to free up the bindings.*

### 3. Database Operations (Prisma)
To apply schema updates or rebuild client bindings inside `packages/db`:
```bash
# Push schema changes
npx prisma db push
# Generate prisma client types
npx prisma generate
```
To clear and seed mock users and default market indicators:
```bash
npx tsx seed.ts
```

---

## What Has Been Built (Feature Summary)

### 1. Backend API Services (`apps/api/src/services/`)
* **`polymarket.ts`**: `getOrderBook` reads real bids/asks from `clob.polymarket.com`. `placeOrder` is an explicit **sandbox fill stub** — no private key, no signing. Real trading (client-side wallet signing, non-custodial) is not yet built; see task backlog.
* **`polymarketLive.ts`**: Real, server-proxied Gamma/CLOB client — events feed, search, price history, order books. This is what `/v1/live/*` and the `/markets`, `/market/[slug]`, `/watchlist` pages actually run on.
* **`ai.ts`**: Calls Gemini 2.5 Flash **only if `GEMINI_API_KEY` is set** (it currently isn't — falls back to a keyword-matcher). Categorizes/suggests a closing date for a newly created market; does **not** resolve markets to an outcome — no resolution endpoint exists anywhere in the API.
* **`queue.ts`**: Real BullMQ against a real local Redis (confirmed running). The job processor itself still just sleeps 1s and claims success — there's no real settlement behind it because there's no resolution/outcome concept in the schema yet.
* **`realtime.ts`**: Real relay — the server opens a real websocket to Polymarket's CLOB (`wss://ws-subscriptions-clob.polymarket.com`) for whatever token IDs connected browser clients ask for, and rebroadcasts real `quote_update`/`trade`/`book_update` events. No frontend page consumes this socket yet (the market detail page still polls the REST order-book endpoint every 20s) — wiring a live client is a clear next step.
* **`wallet.ts`**: **Fake.** `generateWallet` derives a deterministic "address" and "private key" from `sha256(userId + hardcoded_pepper)` — not a real wallet, not on any chain, and trivially re-derivable by anyone who knows the user ID. `getBalance` always returns a hardcoded $150 USDC. Real wallets require Privy (embedded non-custodial) integration — blocked on the user providing `PRIVY_APP_ID`/`PRIVY_APP_SECRET`.
* **`polyscore.ts`**: `getUserScore` ignores its `userId` argument and scores a hardcoded 4-trade fixture every time. Needs real settled-position history before it can mean anything.
* **`notifications.ts`**: `sendWebhook` performs a real HTTP POST now (8s timeout, honest `dispatched`/`httpStatus` in the response) — it used to claim success without ever calling `fetch`.

### 2. Authenticated Endpoints (`apps/api`)
* **`POST /v1/auth/signup` / `login`**: Real password auth — scrypt-hashed passwords, session tokens (`ses_...`, 30-day expiry) stored in the `Session` table. `authMiddleware` accepts either a session token (web app) or a developer API key (`sk_test_.../sk_live_...`) as the bearer credential — both are checked against the DB per-request.
* **`GET/POST /v1/keys`**: Scoped to the authenticated user only (previously `GET /v1/keys` had no auth at all and returned every user's keys — fixed).
* **`/v1/live/*`**: Real Polymarket data proxy — `events`, `events/search`, `events/by-ids`, `events/:slug`, `price-history/:tokenId`, `book/:tokenId`.
* **`/v1/watchlist`**: CRUD + per-market price alert thresholds (`alertAbove`/`alertBelow`), scoped to the authenticated user.
* **`/v1/markets`, `/v1/trades`, `/v1/wallets`, `/v1/polyscore`**: The older **user-created-market toy exchange** — creates a `Market` row, "trades" against it at a hardcoded 0.52/0.48 price via the fake wallet above. Not connected to real Polymarket markets or real money. Current product direction (per user decision) is to build real trading on top of the *real* Polymarket markets users browse/watch instead of investing further in this system.

### 3. Frontend Web Application Pages (`apps/web/app/`)
* **`/` (Landing Page)**: Dynamic code playground selector widgets.
* **`/product`**: anchored primitives grids (Rails, Embeds, Shield) + volume-fee discount calculators.
* **`/markets`**: Live Polymarket event feed — search, category filters, watchlist star.
* **`/market/[slug]`**: Real price chart (1D/1W/1M/ALL), real order book (polled), multi-outcome selector, resolution rules text pulled from the real event description, price alert form.
* **`/watchlist`**: Server-synced (Postgres) when signed in; `localStorage`-backed when signed out. Same UI either way.
* **`/docs`**: API docs + interactive try-it-out sandbox console routing requests using the SDK client.
* **`/status`**: Live latency charts and 30-day uptime grids.
* **`/changelog`**: Timeline log of releases.
* **`/auth`**: Email + password signup/signin, session cached in `localStorage` under `probable_session` as `{ token, user }`.
* **`/dashboard`**: Gated dashboard pulling custom markets, trade history, API keys, and webhook logs dynamically for the logged-in user (talks to the toy-exchange endpoints above, not the real `/v1/live/*` markets).
* **`/onboard`**: Multi-step compliance wizard prefilled with session details.
* **`Ticker.tsx`**: Header bar — goes through `apps/api`'s `/v1/live/events` proxy (previously called `gamma-api.polymarket.com` directly from the browser, bypassing the API entirely).

### 4. Styling & Responsiveness (`globals.css`)
* Implemented clean grid utilities (`grid-2`, `grid-3`, `footer-layout`, `markets-grid`, `detail-grid`) that collapse on mobile devices.
* Added premium `.premium-card` hover float transitions.

### 5. Known gaps (tracked, not yet built)
* No real non-custodial wallets (blocked on Privy credentials from the user).
* No real trading against Polymarket — no order signing, no USDC movement, no position tracking, no settlement. Direction decided: build this on the real-markets (`/v1/live/*`) side, targeting Polygon **mainnet** with real USDC once wallets land — start small, given a bug here means real financial loss.
* No market resolution/settlement concept anywhere in the schema for the toy-exchange side.
* `docker-compose.yml` declares Postgres + Redis + ClickHouse; only Postgres and Redis are actually in use (via local Homebrew installs, not the compose file itself), and ClickHouse is referenced nowhere in the code.
