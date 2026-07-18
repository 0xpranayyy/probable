# Realtime Engine

## WebSockets Quote Stream
Real-time streaming is essential for prediction markets. 
* We host a WebSocket server inside Hono.
* Connected clients can subscribe to specific market topics (e.g., `market:BTC-150k`).
* When Polymarket orderbook updates occur, we broadcast the new YES/NO prices to all subscribers.

## Server-Sent Events (SSE)
For read-only widgets, we offer Server-Sent Events to push updates to the UI, reducing client overhead.
