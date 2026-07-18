// Live Polymarket data — proxied server-side so apps/web never talks to
// Polymarket directly. Distinct from PolymarketService (which simulates
// trading against markets *created on this platform*): this service only
// reads real, public Polymarket events for the market-browsing feature.

const GAMMA = 'https://gamma-api.polymarket.com'
const CLOB = 'https://clob.polymarket.com'

async function get(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Polymarket request failed: ${res.status} ${url}`)
  return res.json()
}

function parseJsonField(v: unknown): any[] {
  if (Array.isArray(v)) return v
  try { return JSON.parse((v as string) || '[]') } catch { return [] }
}

export interface LiveMarket {
  id: string
  question: string
  groupItemTitle: string
  outcomes: string[]
  prices: number[]
  tokens: string[]
  yesPrice: number | null
  yesToken: string | null
  bestBid: number | null
  bestAsk: number | null
  volume24hr: number
  oneDayPriceChange: number | null
  liquidity: number
  endDate: string | null
  closed: boolean
  image: string | null
}

export interface LiveEvent {
  id: string
  slug: string
  title: string
  description: string | null
  image: string | null
  volume24hr: number
  volume: number
  liquidity: number
  endDate: string | null
  tags: string[]
  markets: LiveMarket[]
  binary: boolean
}

function normalizeMarket(m: any): LiveMarket {
  const outcomes = parseJsonField(m.outcomes)
  const prices = parseJsonField(m.outcomePrices).map(Number)
  const tokens = parseJsonField(m.clobTokenIds)
  return {
    id: m.id,
    question: m.question,
    groupItemTitle: m.groupItemTitle || m.question,
    outcomes,
    prices,
    tokens,
    yesPrice: prices[0] ?? null,
    yesToken: tokens[0] ?? null,
    bestBid: m.bestBid != null ? Number(m.bestBid) : null,
    bestAsk: m.bestAsk != null ? Number(m.bestAsk) : null,
    volume24hr: Number(m.volume24hr || 0),
    oneDayPriceChange: m.oneDayPriceChange != null ? Number(m.oneDayPriceChange) : null,
    liquidity: Number(m.liquidityNum || m.liquidity || 0),
    endDate: m.endDate ?? null,
    closed: !!m.closed,
    image: m.image || m.icon || null,
  }
}

function normalizeEvent(e: any): LiveEvent {
  const markets = (e.markets || [])
    .filter((m: any) => m.closed !== true)
    .map(normalizeMarket)
    .sort((a: LiveMarket, b: LiveMarket) => (b.yesPrice ?? 0) - (a.yesPrice ?? 0))
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    description: e.description ?? null,
    image: e.image || e.icon || null,
    volume24hr: Number(e.volume24hr || 0),
    volume: Number(e.volume || 0),
    liquidity: Number(e.liquidity || 0),
    endDate: e.endDate ?? null,
    tags: (e.tags || []).map((t: any) => t.label).filter(Boolean),
    markets,
    binary: markets.length === 1,
  }
}

export const CATEGORIES = [
  { label: 'Trending', slug: null },
  { label: 'Politics', slug: 'politics' },
  { label: 'Crypto', slug: 'crypto' },
  { label: 'Sports', slug: 'sports' },
  { label: 'Tech', slug: 'tech' },
  { label: 'Economy', slug: 'economy' },
  { label: 'World', slug: 'world' },
  { label: 'Culture', slug: 'pop-culture' },
]

export class LiveMarketsService {
  static async listEvents(opts: { tag?: string | null; limit?: number; offset?: number } = {}) {
    const { tag, limit = 40, offset = 0 } = opts
    const params = new URLSearchParams({
      closed: 'false', active: 'true', archived: 'false',
      order: 'volume24hr', ascending: 'false',
      limit: String(limit), offset: String(offset),
    })
    if (tag) params.set('tag_slug', tag)
    const data = await get(`${GAMMA}/events?${params}`)
    return (data as any[]).map(normalizeEvent).filter(e => e.markets.length > 0)
  }

  static async getEventBySlug(slug: string) {
    const data = await get(`${GAMMA}/events?slug=${encodeURIComponent(slug)}`)
    if (!data.length) return null
    return normalizeEvent(data[0])
  }

  static async getEventsByIds(ids: string[]) {
    if (!ids.length) return []
    const params = ids.map(id => `id=${encodeURIComponent(id)}`).join('&')
    const data = await get(`${GAMMA}/events?${params}`)
    return (data as any[]).map(normalizeEvent)
  }

  static async search(q: string) {
    const data = await get(`${GAMMA}/public-search?q=${encodeURIComponent(q)}&limit_per_type=20`)
    return ((data.events || []) as any[])
      .filter(e => !e.closed)
      .map(normalizeEvent)
      .filter(e => e.markets.length > 0)
  }

  static async priceHistory(tokenId: string, interval: '1d' | '1w' | '1m' | 'max' = '1w') {
    const fidelity = { '1d': 5, '1w': 60, '1m': 180, max: 720 }[interval] || 60
    const data = await get(`${CLOB}/prices-history?market=${tokenId}&interval=${interval}&fidelity=${fidelity}`)
    return data.history || []
  }

  static async orderBook(tokenId: string) {
    const b = await get(`${CLOB}/book?token_id=${tokenId}`)
    const sort = (side: any[], desc: boolean) => (side || [])
      .map(l => ({ price: Number(l.price), size: Number(l.size) }))
      .sort((x, y) => desc ? y.price - x.price : x.price - y.price)
    return { bids: sort(b.bids, true), asks: sort(b.asks, false) }
  }
}
