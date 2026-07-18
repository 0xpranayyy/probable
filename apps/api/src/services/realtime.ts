import { WebSocketServer, WebSocket } from "ws";

const POLYMARKET_WS = "wss://ws-subscriptions-clob.polymarket.com/ws/market";

// Relays real Polymarket CLOB price ticks to connected browser clients.
// Clients subscribe to specific token IDs; we maintain one upstream
// connection to Polymarket per unique set of subscribed tokens across all
// clients, rather than one upstream connection per client.
export class RealtimeService {
  private static wss: WebSocketServer | null = null;
  private static clients: Map<WebSocket, Set<string>> = new Map(); // client -> tokenIds it wants
  private static upstream: WebSocket | null = null;
  private static upstreamTokens: Set<string> = new Set();
  private static reconnectTimer: NodeJS.Timeout | null = null;

  static init(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("[WebSocket Server] Client connected.");
      this.clients.set(ws, new Set());

      ws.send(JSON.stringify({ event: "welcome", message: "Connected to Probable live quotes." }));

      ws.on("message", (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === "subscribe" && Array.isArray(parsed.tokenIds)) {
            this.clients.set(ws, new Set(parsed.tokenIds.map(String)));
            this.syncUpstream();
          } else if (parsed.type === "unsubscribe") {
            this.clients.set(ws, new Set());
            this.syncUpstream();
          }
        } catch {
          console.warn("[WebSocket Server] Failed to parse client message:", message);
        }
      });

      ws.on("close", () => {
        console.log("[WebSocket Server] Client disconnected.");
        this.clients.delete(ws);
        this.syncUpstream();
      });

      ws.on("error", (err) => {
        console.error("[WebSocket Server] Connection error:", err.message);
        this.clients.delete(ws);
        this.syncUpstream();
      });
    });

    console.log("[WebSocket Server] WebSocketServer bound successfully to Hono server.");
  }

  static broadcast(payload: any) {
    const data = JSON.stringify(payload);
    this.clients.forEach((_tokens, client) => {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    });
  }

  private static allWantedTokens(): Set<string> {
    const all = new Set<string>();
    this.clients.forEach((tokens) => tokens.forEach((t) => all.add(t)));
    return all;
  }

  // Reconnect the upstream Polymarket socket whenever the union of
  // client-requested token IDs changes.
  private static syncUpstream() {
    const wanted = this.allWantedTokens();
    const same = wanted.size === this.upstreamTokens.size && [...wanted].every((t) => this.upstreamTokens.has(t));
    if (same) return;

    this.upstreamTokens = wanted;
    if (this.upstream) {
      try { this.upstream.close(); } catch { /* already closing */ }
      this.upstream = null;
    }
    if (wanted.size === 0) return;

    this.connectUpstream([...wanted]);
  }

  private static connectUpstream(tokenIds: string[]) {
    try {
      const ws = new WebSocket(POLYMARKET_WS);
      this.upstream = ws;

      ws.on("open", () => {
        console.log(`[Realtime] Subscribed to ${tokenIds.length} live Polymarket token(s).`);
        ws.send(JSON.stringify({ assets_ids: tokenIds, type: "market" }));
      });

      ws.on("message", (raw: string) => {
        let events: any[];
        try {
          const data = JSON.parse(raw.toString());
          events = Array.isArray(data) ? data : [data];
        } catch { return; }

        for (const evt of events) {
          const tokenId = evt.asset_id || evt.market;
          if (!tokenId) continue;
          if (evt.event_type === "price_change" || evt.price_changes) {
            const changes = evt.price_changes || [evt];
            for (const ch of changes) {
              this.broadcast({
                event: "quote_update",
                tokenId: ch.asset_id || tokenId,
                price: ch.price != null ? Number(ch.price) : null,
                side: ch.side || null,
                timestamp: new Date().toISOString(),
              });
            }
          } else if (evt.event_type === "last_trade_price") {
            this.broadcast({
              event: "trade",
              tokenId,
              price: evt.price != null ? Number(evt.price) : null,
              size: evt.size != null ? Number(evt.size) : null,
              timestamp: new Date().toISOString(),
            });
          } else if (evt.event_type === "book") {
            this.broadcast({ event: "book_update", tokenId, timestamp: new Date().toISOString() });
          }
        }
      });

      ws.on("close", () => {
        if (this.upstream !== ws) return; // superseded by a newer connection
        this.upstream = null;
        if (this.upstreamTokens.size === 0) return;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connectUpstream([...this.upstreamTokens]), 3000);
      });

      ws.on("error", (err: Error) => {
        console.warn("[Realtime] Upstream Polymarket socket error:", err.message);
      });
    } catch (err: any) {
      console.warn("[Realtime] Failed to connect upstream:", err.message);
    }
  }
}
