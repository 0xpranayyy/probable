# API Specification

## Endpoints

### 1. Key Generation
* **POST `/keys`**: Generates a new API key.
  * *Request*: `{ "userId": "user_abc" }`
  * *Response*: `{ "key": "pk_test_xxxx", "status": "active" }`

### 2. Market Operations
* **POST `/v1/markets`**: Creates a prediction market.
  * *Request*: `{ "question": "...", "closes": "...", "oracle": "..." }`
  * *Response*: `{ "id": "mkt_xxx", "status": "LIVE" }`

### 3. Wallets
* **POST `/v1/wallets`**: Creates an embedded user wallet.
  * *Request*: `{ "userId": "..." }`
  * *Response*: `{ "address": "0x..." }`

### 4. Trading
* **POST `/v1/trades`**: Places an order on a market.
  * *Request*: `{ "marketId": "...", "type": "YES", "amount": 50 }`
  * *Response*: `{ "tradeId": "trd_xxx", "status": "settled" }`
