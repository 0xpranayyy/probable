import { WebSocketServer, WebSocket } from "ws";

export class RealtimeService {
  private static wss: WebSocketServer | null = null;
  private static clients: Set<WebSocket> = new Set();

  static init(server: any) {
    this.wss = new WebSocketServer({ server });
    
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("[WebSocket Server] Client connected.");
      this.clients.add(ws);
      
      ws.send(JSON.stringify({ event: "welcome", message: "Connected to Probable live quotes." }));

      ws.on("message", (message: string) => {
        try {
          const parsed = JSON.parse(message);
          console.log("[WebSocket Server] Message received:", parsed);
        } catch (e) {
          console.warn("[WebSocket Server] Failed to parse message:", message);
        }
      });

      ws.on("close", () => {
        console.log("[WebSocket Server] Client disconnected.");
        this.clients.delete(ws);
      });

      ws.on("error", (err) => {
        console.error("[WebSocket Server] Connection error:", err.message);
        this.clients.delete(ws);
      });
    });

    console.log("[WebSocket Server] WebSocketServer bound successfully to Hono server.");
    this.startSimulatedBroadcasting();
  }

  static broadcast(payload: any) {
    const data = JSON.stringify(payload);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private static startSimulatedBroadcasting() {
    setInterval(() => {
      const mockMarkets = ["mkt_midterms", "mkt_btc_150k", "mkt_gpt6", "mkt_t20", "mkt_rates", "mkt_hottest"];
      const target = mockMarkets[Math.floor(Math.random() * mockMarkets.length)];
      const yesPrice = parseFloat((0.2 + Math.random() * 0.6).toFixed(2));
      const noPrice = parseFloat((1.0 - yesPrice).toFixed(2));

      this.broadcast({
        event: "quote_update",
        marketId: target,
        yes: Math.round(yesPrice * 100),
        no: Math.round(noPrice * 100),
        timestamp: new Date().toISOString()
      });
    }, 2500);
  }
}
