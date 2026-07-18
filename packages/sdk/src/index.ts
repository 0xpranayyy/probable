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

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiKey {
  id: string;
  key: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
}

// A live Polymarket outcome (one side of a binary market, or one entry in a multi-outcome event).
export interface LiveMarket {
  id: string;
  question: string;
  groupItemTitle: string;
  outcomes: string[];
  prices: number[];
  tokens: string[];
  yesPrice: number | null;
  yesToken: string | null;
  bestBid: number | null;
  bestAsk: number | null;
  volume24hr: number;
  oneDayPriceChange: number | null;
  liquidity: number;
  endDate: string | null;
  closed: boolean;
  image: string | null;
}

// A live Polymarket event — the thing users browse and watch.
export interface LiveEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  volume24hr: number;
  volume: number;
  liquidity: number;
  endDate: string | null;
  tags: string[];
  markets: LiveMarket[];
  binary: boolean;
}

export interface PricePoint {
  t: number;
  p: number;
}

export interface OrderBook {
  bids: { price: number; size: number }[];
  asks: { price: number; size: number }[];
}

export interface WatchlistItem {
  id: string;
  eventId: string;
  slug: string;
  title: string;
  image: string | null;
  alertAbove: number | null;
  alertBelow: number | null;
  alertFired: boolean;
  createdAt: string;
}

export class ProbableClient {
  private token: string;
  private baseUrl: string;

  constructor(config: { token?: string; apiKey?: string; baseUrl?: string } = {}) {
    // `apiKey` is kept as an alias: developer-facing API keys and web-app session
    // tokens are both just bearer credentials as far as the API is concerned.
    this.token = config.token || config.apiKey || "";
    this.baseUrl = config.baseUrl || "http://localhost:3001";
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: "Unknown API error" }));
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  public readonly auth = {
    signup: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
      const out = await this.request("/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      });
      this.token = out.token;
      return out;
    },
    privy: async (token: string): Promise<AuthResponse> => {
      const out = await this.request("/v1/auth/privy", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      this.token = out.token;
      return out;
    },
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const out = await this.request("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      this.token = out.token;
      return out;
    },
    me: (): Promise<User> => this.request("/v1/auth/me"),
    logout: async (): Promise<void> => {
      await this.request("/v1/auth/logout", { method: "POST" });
      this.token = "";
    },
  };

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

  // Live Polymarket events — read-only, proxied through the API.
  public readonly live = {
    events: (opts: { tag?: string | null; limit?: number } = {}): Promise<LiveEvent[]> => {
      const params = new URLSearchParams();
      if (opts.tag) params.set("tag", opts.tag);
      if (opts.limit) params.set("limit", String(opts.limit));
      const qs = params.toString();
      return this.request(`/v1/live/events${qs ? `?${qs}` : ""}`);
    },
    search: (q: string): Promise<LiveEvent[]> =>
      this.request(`/v1/live/events/search?q=${encodeURIComponent(q)}`),
    byIds: (ids: string[]): Promise<LiveEvent[]> =>
      this.request(`/v1/live/events/by-ids?ids=${ids.map(encodeURIComponent).join(",")}`),
    bySlug: (slug: string): Promise<LiveEvent> =>
      this.request(`/v1/live/events/${encodeURIComponent(slug)}`),
    priceHistory: (tokenId: string, interval: "1d" | "1w" | "1m" | "max" = "1w"): Promise<PricePoint[]> =>
      this.request(`/v1/live/price-history/${encodeURIComponent(tokenId)}?interval=${interval}`),
    book: (tokenId: string): Promise<OrderBook> =>
      this.request(`/v1/live/book/${encodeURIComponent(tokenId)}`),
  };

  public readonly watchlist = {
    list: (): Promise<WatchlistItem[]> => this.request("/v1/watchlist"),
    add: (item: { eventId: string; slug: string; title: string; image?: string | null }): Promise<WatchlistItem> =>
      this.request("/v1/watchlist", { method: "POST", body: JSON.stringify(item) }),
    remove: (eventId: string): Promise<{ ok: true }> =>
      this.request(`/v1/watchlist/${encodeURIComponent(eventId)}`, { method: "DELETE" }),
    setAlert: (eventId: string, alert: { above?: number | null; below?: number | null }): Promise<WatchlistItem> =>
      this.request(`/v1/watchlist/${encodeURIComponent(eventId)}/alert`, {
        method: "PATCH",
        body: JSON.stringify(alert),
      }),
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
    getOrCreate: async () => {
      return this.request("/v1/wallets", {
        method: "POST"
      });
    },
  };

  public readonly liveTrading = {
    getAllowance: async () => {
      return this.request("/v1/live/wallet/allowance");
    },
    approve: async (amount?: string) => {
      return this.request("/v1/live/wallet/approve", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
    },
    placeOrder: async (order: { tokenId: string; side: "BUY" | "SELL"; price: number; size: number; eventSlug: string }) => {
      return this.request("/v1/live/orders", {
        method: "POST",
        body: JSON.stringify(order),
      });
    },
    listPositions: async () => {
      return this.request("/v1/live/positions");
    },
  };

  public readonly keys = {
    create: async (env: "test" | "live" = "test"): Promise<ApiKey> => {
      return this.request("/v1/keys", {
        method: "POST",
        body: JSON.stringify({ env }),
      });
    },
    list: async (): Promise<ApiKey[]> => {
      return this.request("/v1/keys");
    },
  };

  public readonly analytics = {
    getPolyScore: async (userId: string) => {
      return this.request(`/v1/polyscore?userId=${encodeURIComponent(userId)}`);
    },
    getLeaderboard: async () => {
      return this.request("/v1/polyscore/leaderboard");
    },
    getPricingConfig: async () => {
      return this.request("/v1/config/pricing");
    },
  };

  public readonly webhooks = {
    listLogs: async () => {
      return this.request("/v1/webhooks/logs");
    },
    retry: async (id: string) => {
      return this.request(`/v1/webhooks/deliveries/${id}/retry`, {
        method: "POST",
      });
    },
  };
}
