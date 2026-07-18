# Workers and Queues

## BullMQ Tasks
We use **BullMQ** backed by **Redis** to execute tasks asynchronously.
* `process-trades`: Executes orders on Polygon network in FIFO sequence.
* `settle-payouts`: Polls oracle states and executes smart contract payout distributions.
* `webhook-retry`: Retries failed webhook calls with exponential backoff.
