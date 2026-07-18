# Database Design

## Prisma Models
Our database schema is defined using Prisma with a PostgreSQL connector. Below are the core entities:

### 1. User
Represents developers or organizations utilizing Probable.
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  ApiKeys   ApiKey[]
  Markets   Market[]
  Orders    Order[]
}
```

### 2. ApiKey
Provides authentication and tracking details for platform integrations.
```prisma
model ApiKey {
  id        String   @id @default(uuid())
  key       String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  isActive  Boolean  @default(true)
}
```

### 3. Market
Maintains state for active, resolved, or canceled prediction markets.
```prisma
model Market {
  id          String   @id @default(uuid())
  question    String
  closesAt    DateTime
  oracleId    String
  liquidity   Float    @default(0)
  creatorId   String
  creator     User     @relation(fields: [creatorId], references: [id])
  status      String   @default("OPEN")
  createdAt   DateTime @default(now())
  Orders      Order[]
}
```

### 4. Order
Stores transactional execution details on the underlying Polymarket exchange.
```prisma
model Order {
  id        String   @id @default(uuid())
  marketId  String
  market    Market   @relation(fields: [marketId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // YES / NO
  amount    Float
  price     Float
  createdAt DateTime @default(now())
}
```
