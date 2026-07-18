# Product Requirements

## Functional Requirements
1. **API Key Management**: Developers can generate, rotate, and revoke API keys via the dashboard.
2. **Embedded Wallet Creation**: Create deterministic smart wallets for end-users linked to their email or application userID.
3. **Market Embedding**: Provide a customizable React/JS `<probable-embed>` component for displaying live orderbooks.
4. **Programmatic Trading**: API endpoints to purchase YES/NO shares, view balances, and retrieve historical market rates.
5. **Real-time Price Stream**: WebSockets to push live orderbook quotes to connected clients.
6. **Automatic Resolution**: Listen for Polymarket oracle settlement events and automatically distribute payouts.

## Non-Functional Requirements
* **Latency**: Less than 50ms for API quote generation.
* **Uptime**: 99.99% system availability.
* **Security**: SOC 2 compliance standards, rate-limiting per API key, and anti-wash trading checks on order placement.
