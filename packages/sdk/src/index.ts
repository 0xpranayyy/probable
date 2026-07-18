export interface MarketCreateParams {
  question: string;
  closes?: string;
  oracle?: string;
}

export interface TradeCreateParams {
  marketId: string;
  userId: string;
  type: "YES" | "NO";
  amount: number;
  webhookUrl?: string;
}

export class ProbableClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey?: string; baseUrl?: string } = {}) {
    this.apiKey = config.apiKey || "";
    this.baseUrl = config.baseUrl || "http://localhost:3001";
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: "Unknown API error" }));
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  public readonly markets = {
    list: async () => {
      return this.request("/v1/markets");
    },
    create: async (params: MarketCreateParams) => {
      return this.request("/v1/markets", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
    getBook: async (marketId: string) => {
      return this.request(`/v1/markets?id=${marketId}`).then((list) => {
        const found = list.find((m: any) => m.id === marketId);
        if (!found) throw new Error("Market not found");
        return {
          marketId,
          bids: [{ price: 0.51, size: 1000 }],
          asks: [{ price: 0.52, size: 1500 }],
        };
      });
    },
  };

  public readonly trades = {
    list: async () => {
      return this.request("/v1/trades");
    },
    create: async (params: TradeCreateParams) => {
      return this.request("/v1/trades", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
  };

  public readonly wallets = {
    create: async (userId: string) => {
      return this.request("/v1/wallets", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
    },
  };

  public readonly keys = {
    create: async (userId: string) => {
      return this.request("/keys", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
    },
    list: async () => {
      return this.request("/v1/keys");
    },
  };

  public readonly analytics = {
    getPolyScore: async (userId: string) => {
      return this.request(`/v1/polyscore?userId=${encodeURIComponent(userId)}`);
    },
    getPricingConfig: async () => {
      return this.request("/v1/config/pricing");
    },
  };

  public readonly webhooks = {
    listLogs: async () => {
      return this.request("/v1/webhooks/logs");
    },
  };

  public readonly auth = {
    signup: async (email: string, name?: string) => {
      return this.request("/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, name }),
      });
    },
    login: async (email: string) => {
      return this.request("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
  };
}
