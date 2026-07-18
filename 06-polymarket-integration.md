# Polymarket Integration

## CLOB API Connection
Probable routes order flow directly to the Polymarket Central Limit Order Book (CLOB). 
We interface with:
* **Polymarket CLOB HTTP Client**: To request bid/ask spreads and place limit/market orders.
* **Smart Contracts (CTF)**: Deployments on the Polygon network (Conditional Tokens Framework).

## Order Routing
When an API client places a trade:
1. API checks for balance in the user's abstracted wallet.
2. Formulates an EIP-712 order signature.
3. Submits the signed trade details directly to Polymarket's order execution endpoint on Polygon.
