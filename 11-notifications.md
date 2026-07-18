# Notifications

## Webhooks
We notify downstream applications when important events occur.
* `trade.executed`: Dispatched on successful order completion on the CLOB.
* `market.resolved`: Sent when an oracle settles a prediction market.
* `wallet.funded`: Dispatched when deposit rails detect incoming USDC.

## Integrations
Developers can toggle channels for email (SendGrid), Telegram bots, or SMS (Twilio) directly from the dashboard settings.
