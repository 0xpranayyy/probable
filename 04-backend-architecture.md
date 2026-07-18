# Backend Architecture

## Technology Choice
We use **Hono** running on Node.js/Bun for our high-performance backend, backed by **@hono/node-server** to serve requests. 

## Structure
The backend is structured inside `apps/api`:
* `/src/index.ts` - Entry point and route registrations.
* `/src/services` - core business logic abstraction files:
  * `polymarket.ts` - Interface with Polymarket CLOB.
  * `wallet.ts` - Logic for viem-based deterministic wallets.
  * `realtime.ts` - Price streams and WebSockets.
  * `ai.ts` - Automated market parsing and prediction assistance.
  * `polyscore.ts` - Trader reliability score calculation.
  * `queue.ts` - Task queue interfaces.

## Authentication
Authentication is enforced at the Gateway level by checking `x-api-key` headers against the database `ApiKey` table.
