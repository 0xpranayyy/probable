# System Architecture

## High-Level Diagram
```
              +-------------------+
              |  Next.js Frontend |
              +---------+---------+
                        |
                        v
              +-------------------+
              |    Hono API GW    |
              +----+----+----+----+
                   |    |    |
         +---------+    |    +---------+
         v              v              v
  +------------+  +-----------+  +------------+
  | Wallet Svc |  | Trade Svc |  | Quotes Svc |
  +------------+  +-----------+  +------------+
         |              |              |
         v              v              v
   (Viem/Ethers)   (Polymarket)   (ClickHouse)
         |         (CLOB API)
         v
   (Polygon Chain)
```

## Data and Worker Flow
1. **User Placement**: Frontend requests wallet creation -> wallet service returns deterministic account -> user deposits funds.
2. **Execution**: User executes order via API -> Hono backend runs anti-wash trading -> pushes job to BullMQ queue -> worker executes order on Polymarket CLOB.
3. **Settlement**: Worker polls Polymarket resolution state -> oracle triggers -> payout processed to user's abstracted wallet.
