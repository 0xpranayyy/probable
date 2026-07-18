import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { prisma } from '@probable/db'

// Import services
import { WalletService } from './services/wallet'
import { PolymarketService } from './services/polymarket'
import { RealtimeService } from './services/realtime'
import { AiService } from './services/ai'
import { PolyScoreService } from './services/polyscore'
import { NotificationService } from './services/notifications'
import { QueueService } from './services/queue'

const app = new Hono()
const webhookLogs: any[] = []

// Enable CORS
app.use('*', cors())

// Auth Middleware: Check API Key
const authMiddleware = async (c: any, next: () => Promise<void>) => {
  const apiKey = c.req.header("Authorization")?.replace("Bearer ", "")
  if (!apiKey) {
    return c.json({ error: "Unauthorized: Missing API key." }, 401)
  }
  
  const keyExists = await prisma.apiKey.findUnique({
    where: { key: apiKey }
  })

  if (!keyExists || !keyExists.isActive) {
    return c.json({ error: "Unauthorized: Invalid or inactive API key." }, 401)
  }
  
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

// Retrieve active API keys from SQLite database
app.get('/v1/keys', async (c) => {
  const keys = await prisma.apiKey.findMany()
  return c.json(keys)
})

// Generate new API key
app.post('/keys', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const userId = body.userId || "acct_9K2mPx"
  const keyStr = `sk_test_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`
  
  const newKey = await prisma.apiKey.create({
    data: {
      key: keyStr,
      userId,
      isActive: true
    }
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

// Abstract smart account creation
app.post('/v1/wallets', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const userId = body.userId
  if (!userId) {
    return c.json({ error: "Missing required parameter: userId" }, 400)
  }

  const wallet = WalletService.generateWallet(userId)
  const balance = await WalletService.getBalance(wallet.address)

  return c.json({
    userId: wallet.userId,
    address: wallet.address,
    type: wallet.walletType,
    token: balance.token,
    balance: balance.balance,
    deployed: wallet.deployed
  })
})

// Retrieve order logs
app.get('/v1/trades', async (c) => {
  const trades = await prisma.order.findMany({
    include: { market: true }
  })
  return c.json(trades)
})

// Execute trade
app.post('/v1/trades', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { marketId, type, amount, userId } = body

  if (!marketId || !type || !amount || !userId) {
    return c.json({ error: "Missing required parameters: marketId, type, amount, or userId" }, 400)
  }

  // 1. Resolve wallet address
  const wallet = WalletService.generateWallet(userId)

  // 2. Validate USDC balance
  const balance = await WalletService.getBalance(wallet.address)
  const priceEstimate = type === "YES" ? 0.52 : 0.48
  const estimatedCost = amount * priceEstimate

  if (balance.balance < estimatedCost) {
    return c.json({ error: "Insufficient balance in smart account paymaster wallet." }, 400)
  }

  // 3. Save order to SQLite database
  const dbOrder = await prisma.order.create({
    data: {
      marketId,
      userId: "acct_9K2mPx",
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

  // 5. Dispatch Webhook
  if (body.webhookUrl) {
    let statusCode = 200
    try {
      await NotificationService.sendWebhook(body.webhookUrl, "trade.executed", {
        orderId: dbOrder.id,
        marketId,
        type,
        amount,
        walletAddress: wallet.address,
        jobId: job.id
      })
    } catch (e) {
      statusCode = 500
    }
    webhookLogs.push({
      id: `wh_${Math.random().toString(36).substring(2, 10)}`,
      url: body.webhookUrl,
      event: "trade.executed",
      statusCode,
      timestamp: new Date().toISOString(),
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

app.get('/v1/polyscore', authMiddleware, async (c) => {
  const userId = c.req.query("userId")
  if (!userId) {
    return c.json({ error: "Missing required query parameter: userId" }, 400)
  }

  const scoreDetails = PolyScoreService.getUserScore(userId)
  return c.json(scoreDetails)
})

app.get('/v1/webhooks/logs', authMiddleware, async (c) => {
  return c.json(webhookLogs)
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
  if (!body.email) {
    return c.json({ error: "Email is required" }, 400)
  }

  let user = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (user) {
    return c.json({ error: "User already exists with this email" }, 400)
  }

  user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name || null
    }
  })

  const keyString = `sk_test_dev_${Math.random().toString(36).substring(2, 10)}`
  const apiKey = await prisma.apiKey.create({
    data: {
      key: keyString,
      userId: user.id
    }
  })

  return c.json({ user, apiKey })
})

app.post('/v1/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  if (!body.email) {
    return c.json({ error: "Email is required" }, 400)
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email },
    include: { ApiKeys: true }
  })

  if (!user) {
    return c.json({ error: "No user found with this email" }, 404)
  }

  return c.json({ user, apiKeys: user.ApiKeys })
})

const port = 3001
console.log(`Server is running on port ${port}`)

const server = serve({
  fetch: app.fetch,
  port
})

RealtimeService.init(server)
