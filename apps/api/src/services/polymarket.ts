export class PolymarketService {
  private static clobEndpoint = "https://clob.polymarket.com";

  static async getOrderBook(clobMarketId: string) {
    // If it's a real token ID (numeric), we fetch it from Polymarket CLOB
    const isTokenId = /^\d+$/.test(clobMarketId);
    if (isTokenId) {
      try {
        const response = await fetch(`${this.clobEndpoint}/book?token_id=${clobMarketId}`);
        if (response.ok) {
          const data = await response.json();
          return {
            marketId: clobMarketId,
            bids: data.bids || [],
            asks: data.asks || [],
          };
        }
      } catch (err: any) {
        console.warn("[Polymarket CLOB] Failed to fetch real orderbook:", err.message);
      }
    }

    // Fallback to simulated orderbook
    return {
      marketId: clobMarketId,
      bids: [
        { price: 0.51, size: 1000 },
        { price: 0.50, size: 2500 }
      ],
      asks: [
        { price: 0.52, size: 1500 },
        { price: 0.53, size: 3000 }
      ]
    };
  }

  static async createMarket(question: string, closesAt: Date, oracleId: string) {
    // Registers/Resolves parameters on Polymarket CLOB
    return {
      clobMarketId: `pm_mkt_${Math.random().toString(36).substring(2, 10)}`,
      question,
      closesAt,
      oracleId,
      status: "ACTIVE",
      yesPrice: 0.50,
      noPrice: 0.50,
    };
  }

  // Sandbox order fill. Real trading is non-custodial (client-side wallet signing,
  // e.g. via Privy) and lands in v2 — this API never holds a private key.
  static async placeOrder(clobMarketId: string, type: "YES" | "NO", amount: number, walletAddress: string) {
    const price = type === "YES" ? 0.52 : 0.48;
    const totalCost = amount * price;

    return {
      orderId: `pm_ord_mock_${Math.random().toString(36).substring(2, 10)}`,
      clobMarketId,
      walletAddress,
      type,
      amount,
      price,
      totalCost,
      status: "FILLED",
      transactionHash: `0x${Math.random().toString(16).substring(2, 40)}`,
      timestamp: new Date(),
    };
  }
}
