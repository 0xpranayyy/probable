# CLAUDE.md — Workspace Operations & Handover Guide

## Monorepo Architecture
This project is structured as a Turborepo monorepo with the following workspace packages:
* **`apps/web`**: Next.js frontend web application (served on `http://localhost:3000`).
* **`apps/api`**: Hono REST & WebSocket API backend server (served on `http://localhost:3001`).
* **`packages/db`**: Prisma schema and database client workspace (SQLite provider in local dev using `dev.db`).
* **`packages/sdk`**: `@probable/sdk` TypeScript client package used to trigger api calls.

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
* **`polymarket.ts`**: Fetches order book bids/asks arrays from `clob.polymarket.com` and signs EIP-712 transaction payloads.
* **`ai.ts`**: Integrates Gemini 2.5 Flash API to parse news reports and resolve closed markets (YES / NO / CANCELED).
* **`queue.ts`**: bullmq/ioredis job queues supporting asynchronous trade settlements and webhook retries, with an in-memory array fallback.
* **`realtime.ts`**: Binds a Hono WebSocket stream broadcasting Yes/No quote rates.

### 2. Authenticated Endpoints (`apps/api`)
* **`POST /v1/auth/signup`**: Registers users in the DB and generates sandbox API keys (`sk_test_dev_...`).
* **`POST /v1/auth/login`**: Resolves user accounts and queries their allocated keys.

### 3. Frontend Web Application Pages (`apps/web/app/`)
* **`/` (Landing Page)**: Dynamic code playground selector widgets.
* **`/product`**: anchored primitives grids (Rails, Embeds, Shield) + volume-fee discount calculators.
* **`/docs`**: API docs + interactive try-it-out sandbox console routing requests using the SDK client.
* **`/status`**: Live latency charts and 30-day uptime grids.
* **`/changelog`**: Timeline log of releases.
* **`/auth`**: Functional signup/signin cards, caching session profiles in `localStorage`.
* **`/dashboard`**: Gated dashboard pulling custom markets, trade history, API keys, and webhook logs dynamically for the logged-in user.
* **`/onboard`**: Multi-step compliance wizard prefilled with session details.
* **`Ticker.tsx`**: Dynamic header bar fetching active high-volume trending quotes directly from the public **Polymarket Gamma API** (`gamma-api.polymarket.com`).

### 4. Styling & Responsiveness (`globals.css`)
* Implemented clean grid utilities (`grid-2`, `grid-3`, `footer-layout`) that collapse on mobile devices.
* Added premium `.premium-card` hover float transitions.
