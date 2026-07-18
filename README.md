# Probable

An enterprise-grade, non-custodial prediction market integration portal. The platform wraps Polymarket's liquidity pool, order book bookkeepers, and settlement engine into a unified developer dashboard, custom embed widget generator, and real-time WebSocket ticker relay.

---

## 🛠 Monorepo Architecture

This project is structured as a Turborepo monorepo with workspace packages managed under `apps/` and `packages/`:

- **`apps/web`**: Next.js client dashboard, prediction market browser, and embed builder playground (served on `http://localhost:3000`).
- **`apps/api`**: Hono REST & WebSocket backend proxied to Polymarket CLOB endpoints (served on `http://localhost:3001`).
- **`packages/db`**: Database client workspace using Prisma ORM configured for PostgreSQL.
- **`packages/sdk`**: `@probable/sdk` compiled TypeScript client consumed by the frontend and documentation sandbox.

---

## 🚀 Core Capabilities

### 1. Privy Embedded Authentication
Non-custodial user wallet resolution built via Privy EIP-712 auth flow. Enables client-side transaction signing, token allowances, and wallet creations secure from third-party interception.

### 2. Live CLOB Orderbook Relay
REST and WebSocket proxies stream real-time price feeds, bids, and asks directly from `clob.polymarket.com` using a secure relay node, bypassing cross-origin browser limitations.

### 3. Persistent Webhook Debugger
A Postgres-backed webhook delivery queue system tracking status codes, latency, and payloads of events (e.g., `trade.executed`). Offers frontend controls to trigger manual payload retries.

### 4. AI-Powered Market Draft Assistant
Leverages Gemini models via the Google Generative Language API to analyze prompt inputs, recommend target categories, suggest closing dates, and output structured prediction market JSON proposals.

### 5. PolyScore Leaderboard
Calculates accuracy reliability rankings using Brier-scoring models:
$$BS = \frac{1}{N} \sum_{t=1}^{N} (f_t - o_t)^2$$
Maps forecasters' predictive history to expert performance tiers displayed on a global dashboard leaderboard.

---

## 💻 Getting Started

### 📋 Prerequisites
Ensure you have the following installed on your machine:
- Node.js (v20+)
- PostgreSQL instance running locally or remotely

### ⚙️ Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/probable_db"
GEMINI_API_KEY="your-gemini-api-key"
PRIVY_APP_ID="your-privy-app-id"
PRIVY_APP_SECRET="your-privy-app-secret"
```

### 1. Install Dependencies
Install dependencies across all workspaces from the monorepo root:
```bash
npm install
```

### 2. Setup the Database
Push the Prisma database schema and run seed scripts to initialize mock keys and default markets:
```bash
# Push schema to PostgreSQL
npx prisma db push --schema=packages/db/prisma/schema.prisma

# Seed initial database states
npx tsx packages/db/seed.ts
```

### 3. Run Development Servers
Spin up the backend API, frontend dashboard, and TypeScript compilers in watch mode concurrently:
```bash
npm run dev
```
- Frontend: `http://localhost:3000`
- API Server: `http://localhost:3001`

---

## 📦 Build & Compilation

To build typescript definitions and compile the production Next.js build across the entire monorepo:
```bash
npm run build
```

---

## 🌐 Production Cloud Deployment

### Next.js Frontend (Vercel)
When deploying the monorepo frontend on Vercel, ensure the project configurations match the following properties:
1. **Root Directory**: Set to `apps/web`.
2. **Build Settings**: Toggle **ON** the option `"Include source files outside of the Root Directory in the Build Step"` so that shared workspace packages (`@probable/sdk`, `@probable/db`) resolve successfully.
3. **Framework Preset**: Set to **Next.js**.
