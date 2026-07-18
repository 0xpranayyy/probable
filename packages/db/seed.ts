import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear database
  await prisma.order.deleteMany({});
  await prisma.market.deleteMany({});
  await prisma.apiKey.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database cleared.");

  // Create default organization user
  const user = await prisma.user.create({
    data: {
      id: "acct_9K2mPx",
      email: "ops@acme.com",
      name: "Acme Sportsbook",
    },
  });

  console.log("Created user:", user.name);

  // Create default API keys
  await prisma.apiKey.createMany({
    data: [
      {
        id: "key_prod",
        key: "sk_live_9K2mPx4Q",
        userId: user.id,
        isActive: true,
      },
      {
        id: "key_test",
        key: "sk_test_4Jn8Wz1c",
        userId: user.id,
        isActive: true,
      },
    ],
  });

  console.log("Created API keys.");

  // Create default markets
  const marketsData = [
    {
      id: "mkt_midterms",
      question: "Democrats win the 2026 midterms?",
      closesAt: new Date("2026-11-03T23:59:59Z"),
      oracleId: "oracle:consensus",
      liquidity: 4200000,
      creatorId: user.id,
      status: "LIVE",
    },
    {
      id: "mkt_btc_150k",
      question: "BTC above $150k by Dec 31?",
      closesAt: new Date("2026-12-31T23:59:59Z"),
      oracleId: "oracle:consensus",
      liquidity: 2800000,
      creatorId: user.id,
      status: "LIVE",
    },
    {
      id: "mkt_gpt6",
      question: "GPT-6 released before 2027?",
      closesAt: new Date("2026-12-31T23:59:59Z"),
      oracleId: "oracle:consensus",
      liquidity: 1900000,
      creatorId: user.id,
      status: "LIVE",
    },
    {
      id: "mkt_t20",
      question: "India wins the T20 World Cup?",
      closesAt: new Date("2026-03-14T23:59:59Z"),
      oracleId: "oracle:consensus",
      liquidity: 3100000,
      creatorId: user.id,
      status: "LIVE",
    },
    {
      id: "mkt_rates",
      question: "Fed cuts rates in September?",
      closesAt: new Date("2026-09-17T23:59:59Z"),
      oracleId: "oracle:consensus",
      liquidity: 1400000,
      creatorId: user.id,
      status: "LIVE",
    },
    {
      id: "mkt_hottest",
      question: "2026 hottest year on record?",
      closesAt: new Date("2026-01-15T23:59:59Z"),
      oracleId: "oracle:consensus",
      liquidity: 860000,
      creatorId: user.id,
      status: "LIVE",
    },
  ];

  for (const m of marketsData) {
    await prisma.market.create({ data: m });
  }

  console.log("Created default markets.");

  // Create default orders
  const mktIds = ["mkt_midterms", "mkt_btc_150k", "mkt_gpt6", "mkt_t20", "mkt_rates", "mkt_hottest"];
  for (const mId of mktIds) {
    await prisma.order.create({
      data: {
        marketId: mId,
        userId: user.id,
        type: Math.random() > 0.5 ? "YES" : "NO",
        amount: Math.round(500 + Math.random() * 2000),
        price: 0.50,
      },
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
