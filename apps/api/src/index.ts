import { Hono, Context } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { prisma, User } from '@probable/db'
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

// viem represents wei-precision values as native BigInt. The Polymarket
// relayer client's HTTP layer JSON.stringifies request/response bodies
// without a BigInt-safe replacer, which throws. This is the standard,
// narrowly-scoped fix (serialize BigInt as its decimal string) rather than
// patching viem or the relayer client itself.
;(BigInt.prototype as any).toJSON = function () { return this.toString() }

// Import services
import { WalletService, getPrivy } from './services/wallet'
import { PolymarketService } from './services/polymarket'
import { LiveMarketsService } from './services/polymarketLive'
import { PolymarketTradingService } from './services/polymarketTrading'
import { DepositWalletService } from './services/depositWallet'
import { RealtimeService } from './services/realtime'
import { AiService } from './services/ai'
import { NotificationService } from './services/notifications'
import { QueueService } from './services/queue'

type Variables = { user: User; sessionToken?: string }
const app = new Hono<{ Variables: Variables }>()
const webhookLogs: any[] = []

// Enable CORS
app.use('*', cors())

// ---------- password + session helpers ----------

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  return salt + ':' + scryptSync(password, salt, 64).toString('hex')
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

async function createSession(userId: string) {
  const token = 'ses_' + randomBytes(24).toString('hex')
  await prisma.session.create({ data: { token, userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) } })
  return token
}

const publicUser = (u: { id: string; email: string; name: string | null }) => ({ id: u.id, email: u.email, name: u.name })

// Auth middleware — dual mode:
//  - "ses_..." tokens are user sessions (web app sign-in)
//  - anything else is checked as a developer API key (programmatic/SDK access)
// Either attaches an authenticated user onto the request context.
const authMiddleware = async (c: Context<{ Variables: Variables }>, next: () => Promise<void>) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return c.json({ error: 'Unauthorized: Missing credentials.' }, 401)
  }

  if (token.startsWith('ses_')) {
    const session = await prisma.session.findUnique({ where: { token }, include: { user: true } })
    if (!session || session.expiresAt < new Date()) {
      return c.json({ error: 'Unauthorized: Invalid or expired session.' }, 401)
    }
    c.set('user', session.user)
    c.set('sessionToken', token)
    return next()
  }

  const apiKey = await prisma.apiKey.findUnique({ where: { key: token }, include: { user: true } })
  if (!apiKey || !apiKey.isActive) {
    return c.json({ error: 'Unauthorized: Invalid or inactive API key.' }, 401)
  }
  c.set('user', apiKey.user)
  await next()
}

app.get('/health', async (c) => {
  const userCount = await prisma.user.count()
  const marketCount = await prisma.market.count()
  return c.json({
    status: 'ok',
    service: 'probable-api',
    uptime: process.uptime(),
    dbUsers: userCount,
    dbMarkets: marketCount,
    queue: QueueService.getQueueStatus()
  })
})

// Retrieve all markets from SQLite database
app.get('/v1/markets', async (c) => {
  const dbMarkets = await prisma.market.findMany({
    include: { Orders: true }
  })
  return c.json(dbMarkets)
})

// Retrieve the authenticated user's own API keys
app.get('/v1/keys', authMiddleware, async (c) => {
  const user = c.get('user')
  const keys = await prisma.apiKey.findMany({ where: { userId: user.id } })
  return c.json(keys)
})

// Generate a new API key for the authenticated user
app.post('/v1/keys', authMiddleware, async (c) => {
  const user = c.get('user')
  const env = (await c.req.json().catch(() => ({}))).env === 'live' ? 'live' : 'test'
  const keyStr = `sk_${env}_${randomBytes(16).toString('hex')}`

  const newKey = await prisma.apiKey.create({
    data: { key: keyStr, userId: user.id, isActive: true }
  })

  return c.json(newKey)
})

// Create Event Market
app.post('/v1/markets', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}))
  if (!body.question) {
    return c.json({ error: "Missing required parameter: question" }, 400)
  }

  // Auto-analyze using AI Service
  const aiInfo = await AiService.analyzeMarket(body.question)

  // Register market on Polymarket CLOB
  const closesAt = body.closes ? new Date(body.closes) : new Date(aiInfo.suggestedClosingDate)
  const clobMarket = await PolymarketService.createMarket(
    body.question,
    closesAt,
    body.oracle || "oracle:consensus"
  )

  // Save to SQLite database
  const dbMarket = await prisma.market.create({
    data: {
      question: body.question,
      closesAt,
      oracleId: body.oracle || "oracle:consensus",
      liquidity: body.liquidity?.seed || 10000,
      creatorId: "acct_9K2mPx",
      status: "LIVE"
    }
  })

  return c.json({
    id: dbMarket.id,
    status: dbMarket.status,
    question: dbMarket.question,
    closesAt: dbMarket.closesAt.toISOString(),
    oracleId: dbMarket.oracleId,
    liquidity: dbMarket.liquidity,
    category: aiInfo.category,
    clobReference: clobMarket.clobMarketId,
    initialPrices: {
      yes: clobMarket.yesPrice,
      no: clobMarket.noPrice
    },
    verdictSummary: aiInfo.verdictSummary
  })
})

// Real non-custodial wallet (Privy embedded, Polygon). Idempotent per user.
app.post('/v1/wallets', authMiddleware, async (c) => {
  const user = c.get('user')
  try {
    const wallet = await WalletService.getOrCreateWallet(user.id)
    const balance = await WalletService.getBalance(wallet.address)

    return c.json({
      userId: wallet.userId,
      address: wallet.address,
      walletId: wallet.walletId,
      type: wallet.walletType,
      chain: wallet.chain,
      token: balance.token,
      balance: balance.balance,
      created: wallet.created,
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 502)
  }
})

// Retrieve order logs
app.get('/v1/trades', async (c) => {
  const trades = await prisma.order.findMany({
    include: { market: true }
  })
  return c.json(trades)
})

// Execute trade (toy-exchange system — frozen; kept functional, not extended.
// Real trading against actual Polymarket positions is being built separately.)
app.post('/v1/trades', authMiddleware, async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => ({}))
  const { marketId, type, amount } = body

  if (!marketId || !type || !amount) {
    return c.json({ error: "Missing required parameters: marketId, type, or amount" }, 400)
  }

  // 1. Resolve the caller's own real wallet (never another user's)
  let wallet, balance
  try {
    wallet = await WalletService.getOrCreateWallet(user.id)
    balance = await WalletService.getBalance(wallet.address)
  } catch (err: any) {
    return c.json({ error: err.message }, 502)
  }
  const priceEstimate = type === "YES" ? 0.52 : 0.48
  const estimatedCost = amount * priceEstimate

  if (balance.balance < estimatedCost) {
    return c.json({ error: "Insufficient USDC balance in your wallet." }, 400)
  }

  // 3. Save order to the database
  const dbOrder = await prisma.order.create({
    data: {
      marketId,
      userId: user.id,
      type,
      amount,
      price: priceEstimate
    }
  })

  // 4. Queue order execution to BullMQ
  const job = await QueueService.addJob("process-trade", {
    marketId,
    type,
    amount,
    walletAddress: wallet.address
  })

  // 5. Dispatch webhook (real HTTP POST — logs the actual outcome, not an assumed one)
  if (body.webhookUrl) {
    const result = await NotificationService.sendWebhook(body.webhookUrl, "trade.executed", {
      orderId: dbOrder.id,
      marketId,
      type,
      amount,
      walletAddress: wallet.address,
      jobId: job.id
    }, user.id)
    webhookLogs.push({
      id: `wh_${Math.random().toString(36).substring(2, 10)}`,
      url: body.webhookUrl,
      event: "trade.executed",
      statusCode: result.httpStatus,
      dispatched: result.dispatched,
      error: result.error ?? null,
      timestamp: result.timestamp,
      payload: { orderId: dbOrder.id, marketId, type, amount }
    })
  }

  return c.json({
    tradeId: dbOrder.id,
    status: "queued",
    jobId: job.id,
    estimatedCost,
    walletAddress: wallet.address
  })
})

app.post('/v1/predictions', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}))
  if (!body.question) {
    return c.json({ error: "Missing required parameter: question" }, 400)
  }

  const analysis = await AiService.analyzeMarket(body.question)
  return c.json(analysis)
})

app.post('/v1/ai/draft-market', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}))
  if (!body.prompt) {
    return c.json({ error: "Prompt is required" }, 400)
  }

  const draft = await AiService.draftMarket(body.prompt)
  return c.json(draft)
})


app.get('/v1/webhooks/logs', authMiddleware, async (c) => {
  const user = c.get('user')
  const deliveries = await prisma.webhookDelivery.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  return c.json(deliveries)
})

app.get('/v1/webhooks/deliveries', authMiddleware, async (c) => {
  const user = c.get('user')
  const deliveries = await prisma.webhookDelivery.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  return c.json(deliveries)
})

app.post('/v1/webhooks/deliveries/:id/retry', authMiddleware, async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const delivery = await prisma.webhookDelivery.findFirst({
    where: { id, userId: user.id }
  })

  if (!delivery) {
    return c.json({ error: "Webhook delivery not found" }, 404)
  }

  const payload = JSON.parse(delivery.payload)
  const result = await NotificationService.sendWebhook(delivery.webhookUrl, delivery.event, payload, user.id)

  return c.json({
    success: result.dispatched,
    statusCode: result.httpStatus,
    error: result.error || null
  })
})

app.get('/v1/config/pricing', async (c) => {
  return c.json({
    tiers: [
      { limit: 100000, rate: 0.018, label: "< $100K" },
      { limit: 1000000, rate: 0.014, label: "$100K – $1M" },
      { limit: 10000000, rate: 0.009, label: "$1M – $10M" },
      { limit: 99999999, rate: 0.005, label: "$10M +" }
    ]
  })
})

app.post('/v1/auth/signup', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  if (!body.email || !body.password || String(body.password).length < 8) {
    return c.json({ error: "Email and a password of at least 8 characters are required" }, 400)
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) {
    return c.json({ error: "An account with this email already exists" }, 409)
  }

  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name || null,
      password: hashPassword(body.password),
    }
  })

  const keyString = `sk_test_${randomBytes(16).toString('hex')}`
  await prisma.apiKey.create({ data: { key: keyString, userId: user.id } })

  const token = await createSession(user.id)
  return c.json({ token, user: publicUser(user) }, 201)
})

app.post('/v1/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const user = await prisma.user.findUnique({ where: { email: body.email || '' } })

  if (!user || !verifyPassword(body.password || '', user.password)) {
    return c.json({ error: "Invalid email or password" }, 401)
  }

  const token = await createSession(user.id)
  return c.json({ token, user: publicUser(user) })
})

app.post('/v1/auth/privy', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const privyToken = body.token
  if (!privyToken) {
    return c.json({ error: "Privy access token is required" }, 400)
  }

  try {
    const claims = await getPrivy().verifyAuthToken(privyToken)
    const privyUser = await getPrivy().getUser(claims.userId) as any

    const email = privyUser.email || privyUser.linkedAccounts?.find((a: any) => a.type === 'email')?.address || privyUser.linkedAccounts?.find((a: any) => a.type === 'email')?.emailAddress
    if (!email) {
      return c.json({ error: "No email address associated with this Privy account" }, 400)
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { privyWalletId: claims.userId }
        ]
      }
    })

    if (!user) {
      const embeddedWallet = privyUser.linkedAccounts?.find((a: any) => a.type === 'wallet' && a.walletClientType === 'privy')
      const walletAddress = embeddedWallet?.address || null

      user = await prisma.user.create({
        data: {
          email,
          name: privyUser.name || email.split('@')[0],
          password: hashPassword(randomBytes(16).toString('hex')),
          walletAddress,
          privyWalletId: claims.userId
        }
      })

      const keyString = `sk_test_${randomBytes(16).toString('hex')}`
      await prisma.apiKey.create({ data: { key: keyString, userId: user.id } })
    } else {
      if (!user.privyWalletId || !user.walletAddress) {
        const embeddedWallet = privyUser.linkedAccounts?.find((a: any) => a.type === 'wallet' && a.walletClientType === 'privy')
        await prisma.user.update({
          where: { id: user.id },
          data: {
            privyWalletId: claims.userId,
            walletAddress: user.walletAddress || embeddedWallet?.address || null
          }
        })
      }
    }

    const sessionToken = await createSession(user.id)
    return c.json({ token: sessionToken, user: publicUser(user) })
  } catch (err: any) {
    console.error("Privy authentication error:", err)
    return c.json({ error: "Privy verification failed: " + err.message }, 401)
  }
})

app.get('/v1/auth/me', authMiddleware, async (c) => {
  return c.json(publicUser(c.get('user')))
})

app.post('/v1/auth/logout', authMiddleware, async (c) => {
  const token = c.get('sessionToken')
  if (token) await prisma.session.deleteMany({ where: { token } })
  return c.json({ ok: true })
})

// ---------- live Polymarket data (read-only, browser -> this API -> Polymarket) ----------

app.get('/v1/live/events', async (c) => {
  const tag = c.req.query('tag') || null
  const limit = Number(c.req.query('limit') || 40)
  try {
    const events = await LiveMarketsService.listEvents({ tag, limit })
    return c.json(events)
  } catch (err: any) {
    return c.json({ error: err.message }, 502)
  }
})

app.get('/v1/live/events/search', async (c) => {
  const q = c.req.query('q') || ''
  if (!q.trim()) return c.json([])
  try {
    return c.json(await LiveMarketsService.search(q))
  } catch (err: any) {
    return c.json({ error: err.message }, 502)
  }
})

app.get('/v1/live/events/by-ids', async (c) => {
  const ids = (c.req.query('ids') || '').split(',').filter(Boolean)
  try {
    return c.json(await LiveMarketsService.getEventsByIds(ids))
  } catch (err: any) {
    return c.json({ error: err.message }, 502)
  }
})

app.get('/v1/live/events/:slug', async (c) => {
  try {
    const event = await LiveMarketsService.getEventBySlug(c.req.param('slug'))
    if (!event) return c.json({ error: 'Event not found' }, 404)
    return c.json(event)
  } catch (err: any) {
    return c.json({ error: err.message }, 502)
  }
})

app.get('/v1/live/price-history/:tokenId', async (c) => {
  const interval = (c.req.query('interval') as any) || '1w'
  try {
    return c.json(await LiveMarketsService.priceHistory(c.req.param('tokenId'), interval))
  } catch (err: any) {
    return c.json({ error: err.message }, 502)
  }
})

app.get('/v1/live/book/:tokenId', async (c) => {
  try {
    return c.json(await LiveMarketsService.orderBook(c.req.param('tokenId')))
  } catch (err: any) {
    return c.json({ error: err.message }, 502)
  }
})

// ---------- real trading (mainnet Polygon, real USDC.e) ----------
// Every route here is real: real Privy signatures, real Polymarket CLOB
// calls, real on-chain reads. Nothing is simulated. Orders will be rejected
// by Polymarket for real if the wallet has no funds/allowance — that is
// correct behavior, not a bug.

// Derives + deploys (if needed) the user's Polymarket deposit wallet — the
// smart-contract proxy that actually holds pUSD and places orders under
// CLOB V2. Real, gasless (sponsored by Polymarket's relayer), idempotent.
app.post('/v1/live/wallet/deposit', authMiddleware, async (c) => {
  const user = c.get('user')
  try {
    return c.json(await DepositWalletService.getOrCreateDepositWallet(user.id))
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

app.get('/v1/live/wallet/deposit', authMiddleware, async (c) => {
  const user = c.get('user')
  return c.json(await DepositWalletService.getStatus(user.id))
})

app.get('/v1/live/wallet/allowance', authMiddleware, async (c) => {
  const user = c.get('user')
  try {
    return c.json(await PolymarketTradingService.getAllowance(user.id))
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

// Submits a real, gasless approve() call from the deposit wallet, executed
// immediately via Polymarket's relayer (sponsored gas — nothing for the
// user to pay or separately broadcast).
app.post('/v1/live/wallet/approve', authMiddleware, async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => ({}))
  try {
    return c.json(await PolymarketTradingService.approvePusd(user.id, body.amount || 'max'))
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

app.post('/v1/live/orders', authMiddleware, async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => ({}))
  const { tokenId, side, price, size, eventSlug } = body
  if (!tokenId || !side || !price || !size || !eventSlug) {
    return c.json({ error: 'tokenId, side, price, size, and eventSlug are required' }, 400)
  }
  try {
    const result = await PolymarketTradingService.placeOrder(user.id, { tokenId, side, price, size, eventSlug })
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

app.get('/v1/live/positions', authMiddleware, async (c) => {
  const user = c.get('user')
  return c.json(await PolymarketTradingService.listPositions(user.id))
})

// ---------- watchlist ----------

app.get('/v1/watchlist', authMiddleware, async (c) => {
  const user = c.get('user')
  const items = await prisma.watchlistItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
  return c.json(items)
})

app.post('/v1/watchlist', authMiddleware, async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => ({}))
  if (!body.eventId || !body.slug || !body.title) {
    return c.json({ error: 'eventId, slug, and title are required' }, 400)
  }
  const item = await prisma.watchlistItem.upsert({
    where: { userId_eventId: { userId: user.id, eventId: body.eventId } },
    create: { userId: user.id, eventId: body.eventId, slug: body.slug, title: body.title, image: body.image || null },
    update: {},
  })
  return c.json(item, 201)
})

app.delete('/v1/watchlist/:eventId', authMiddleware, async (c) => {
  const user = c.get('user')
  await prisma.watchlistItem.deleteMany({ where: { userId: user.id, eventId: c.req.param('eventId') } })
  return c.json({ ok: true })
})

app.patch('/v1/watchlist/:eventId/alert', authMiddleware, async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => ({}))
  const { count } = await prisma.watchlistItem.updateMany({
    where: { userId: user.id, eventId: c.req.param('eventId') },
    data: { alertAbove: body.above ?? null, alertBelow: body.below ?? null, alertFired: false },
  })
  if (!count) return c.json({ error: 'Watchlist item not found' }, 404)
  const eventId = c.req.param('eventId')
  if (!eventId) return c.json({ error: 'eventId is required' }, 400)
  const item = await prisma.watchlistItem.findUnique({
    where: { userId_eventId: { userId: user.id, eventId } },
  })
  return c.json(item)
})

const port = 3001
console.log(`Server is running on port ${port}`)

const server = serve({
  fetch: app.fetch,
  port
})

RealtimeService.init(server)
