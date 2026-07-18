# Wallet Infrastructure

## Embedded Wallet Abstraction
End-users of fintech or media sites do not need their own MetaMask or Coinbase wallets. 
* We use **Viem** to deterministically generate key pairs based on application UserIDs.
* Each developer application receives a parent key, from which individual user wallets are derived using BIP-32/BIP-44 HD derivation paths (`m/44'/60'/0'/0/x`).

## Gas Sponsorship
To ensure a frictionless trading experience, gas costs on Polygon are fully sponsored. 
* We execute transactions via **ERC-4337 Smart Accounts** (using Biconomy or ZeroDev accounts).
* Paymasters handle transaction validation and pay for gas using platform credits.
