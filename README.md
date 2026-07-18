# 🔮 Probable

<p align="center">
  <img src="https://img.shields.io/badge/Monorepo-Turborepo-pink?style=for-the-badge&logo=turbo" alt="Turborepo Badge" />
  <img src="https://img.shields.io/badge/Framework-Next.js-pink?style=for-the-badge&logo=nextdotjs" alt="Next.js Badge" />
  <img src="https://img.shields.io/badge/Backend-Hono-pink?style=for-the-badge&logo=hono" alt="Hono Badge" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-pink?style=for-the-badge&logo=postgresql" alt="PostgreSQL Badge" />
  <img src="https://img.shields.io/badge/AI-Gemini-pink?style=for-the-badge&logo=google" alt="Gemini Badge" />
</p>

An enterprise-grade, non-custodial gateway and developer SDK built to integrate prediction market liquidity directly into custom interfaces. Probable provides embedded wallet signing, live CLOB order-book relays, AI-assisted market draft engines, and database-backed webhook logs with manual retry support.

---

## 🏗 System & Monorepo Architecture

The platform is orchestrated as a workspace-resolved monorepo. Shared packages compile locally into TypeScript assets consumed dynamically by application layers.

```mermaid
graph TD
    %% Styling Definitions
    classDef default fill:#FFFBF7,stroke:#1D1832,stroke-width:1px,color:#1D1832,font-family:'Instrument Sans',sans-serif;
    classDef app fill:#FFE3EC,stroke:#F0568C,stroke-width:2px,color:#120F24,font-weight:bold;
    classDef pkg fill:#E8FBF1,stroke:#0E9160,stroke-width:2px,color:#120F24,font-weight:bold;
    classDef ext fill:#EFE9FF,stroke:#7A4599,stroke-width:1px,color:#120F24;

    %% Nodes
    A[Next.js Client Dashboard<br/>apps/web] :::app
    B[Hono REST & WS API<br/>apps/api] :::app
    C["TypeScript SDK<br/>@probable/sdk"] :::pkg
    D["Postgres Schema<br/>@probable/db"] :::pkg

    E[Privy Non-Custodial Auth] :::ext
    F[Polymarket CLOB WebSocket] :::ext
    G[Google Gemini LLM Engine] :::ext

    %% Connections
    A -->|import client| C
    A -->|render views| D
    B -->|query database| D
    C -->|REST / WebSockets| B
    B -->|embedded session tokens| E
    B -->|stream live quotes| F
    B -->|analyze market drafting| G
```

---

## 🔄 Core Developer Workflows

### A. Non-Custodial Session & Signing Cycle
Every trade and token allowance requires client-side signing of EIP-712 payloads using Privy's embedded wallets, ensuring the platform remains non-custodial and secure.

```mermaid
sequenceDiagram
    autonumber
    actor Developer as Client Developer
    participant Web as Apps/Web Dashboard
    participant API as Apps/API Gateway
    participant Privy as Privy Embedded Wallet
    participant Poly as Polymarket Mainnet

    Developer->>Web: Initiate USDC.e Token Allowance
    Web->>API: Fetch raw transaction payloads
    API-->>Web: Return unsigned payload metadata
    Web->>Privy: Request signature for EIP-712 transaction
    Privy-->>Web: User signs securely in-browser (non-custodial)
    Web->>Poly: Broadcast signed payload directly to contract
    Poly-->>Web: Confirmation of approved allowance
```

### B. Persistent Webhook & Retry debugger
Dispatched trade execution notifications are registered in PostgreSQL database tables to debug webhook endpoints. If a target server drops, payloads can be redelivered in one-click.

```mermaid
flowchart LR
    classDef step fill:#FFFBF7,stroke:#1D1832,stroke-width:1px;
    classDef db fill:#FFE3EC,stroke:#F0568C,stroke-width:2px;

    1[Trade Executed] :::step --> 2[Queue Webhook Payload] :::step
    2 --> 3[(Postgres Webhook Logs)] :::db
    3 --> 4{Target Endpoint HTTP 200?} :::step
    4 -->|Yes| 5[Status: SUCCESS] :::step
    4 -->|No / Timeout| 6[Status: FAILED] :::step
    6 --> 7[Developer triggers 'Redeliver Event'] :::step
    7 --> 2
```

---

## 💻 Getting Started

### 📋 Prerequisites
Ensure you have the following installed:
- Node.js (v20+)
- PostgreSQL Database Instance

### ⚙️ Environment Configuration
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/probable_db"
GEMINI_API_KEY="your-gemini-api-key"
PRIVY_APP_ID="your-privy-app-id"
PRIVY_APP_SECRET="your-privy-app-secret"
```

### 1. Installation
Install core packages and dependencies across workspaces:
```bash
npm install
```

### 2. Setup the Database Schema
Sync your PostgreSQL database with the Prisma schema and run mock seeds:
```bash
# Push Prisma schema to Postgres
npx prisma db push --schema=packages/db/prisma/schema.prisma

# Seed initial keys & markets
npx tsx packages/db/seed.ts
```

### 3. Spin Up Local Servers
Concurrently run compilation watch tasks, Rest API, and Next.js frontend:
```bash
npm run dev
```

---

## 🚀 Monorepo Cloud Deployment

When deploying `probable` on Vercel:
1. Set the **Root Directory** project setting to `apps/web`.
2. Enable the option `"Include source files outside of the Root Directory in the Build Step"` to compile packages like `@probable/sdk` and `@probable/db`.
3. Set the framework preset to **Next.js**.
