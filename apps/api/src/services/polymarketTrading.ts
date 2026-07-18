import { PrivyClient } from "@privy-io/server-auth";
import { ClobClient, Chain, Side, OrderType } from "@polymarket/clob-client";
import type { ApiKeyCreds } from "@polymarket/clob-client";
import { prisma } from "@probable/db";
import { USDC_POLYGON, POLYGON_CAIP2 } from "./wallet";

// Real trading against Polymarket's actual mainnet CLOB, using the official
// @polymarket/clob-client for order construction/signing/submission — not a
// reimplementation. The only custom part is the signer adapter below, which
// bridges Privy's non-custodial signTypedData API into the ethers-style
// signer interface the official client expects. This process never sees a
// private key; Privy holds it and only returns a signature.

export const CTF_EXCHANGE_POLYGON = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"; // @polymarket/clob-client MATIC_CONTRACTS.exchange
export const CTF_CONDITIONAL_TOKENS_POLYGON = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045"; // MATIC_CONTRACTS.conditionalTokens
const CLOB_HOST = "https://clob.polymarket.com";

let privy: PrivyClient | null = null;
function getPrivy(): PrivyClient {
  if (privy) return privy;
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("PRIVY_APP_ID/PRIVY_APP_SECRET are not configured — real trading is unavailable.");
  }
  privy = new PrivyClient(appId, appSecret);
  return privy;
}

// Adapter satisfying @polymarket/clob-client's `ClobSigner` (ethers-style)
// interface, backed by a real Privy embedded wallet.
function privySigner(walletId: string, address: string) {
  return {
    getAddress: async () => address,
    _signTypedData: async (domain: Record<string, unknown>, types: Record<string, unknown>, value: Record<string, unknown>) => {
      const primaryType = Object.keys(types).find((k) => k !== "EIP712Domain") || "Order";
      const { signature } = await getPrivy().walletApi.ethereum.signTypedData({
        walletId,
        typedData: { domain, types: types as any, message: value, primaryType },
      });
      return signature;
    },
  };
}

async function requireWallet(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.walletAddress || !user.privyWalletId) {
    throw new Error("No wallet yet — call POST /v1/wallets first.");
  }
  return { address: user.walletAddress, walletId: user.privyWalletId };
}

async function clientFor(userId: string, creds?: ApiKeyCreds) {
  const { address, walletId } = await requireWallet(userId);
  const signer = privySigner(walletId, address);
  return new ClobClient(CLOB_HOST, Chain.POLYGON, signer as any, creds);
}

export class PolymarketTradingService {
  // Proves wallet ownership to Polymarket via a real signature (no funds
  // involved — this is authentication, not a transaction) and gets back
  // API credentials for subsequent order calls. Cached per user.
  static async ensureApiCreds(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.clobApiKey && user.clobApiSecret && user.clobApiPassphrase) {
      return { key: user.clobApiKey, secret: user.clobApiSecret, passphrase: user.clobApiPassphrase };
    }

    const client = await clientFor(userId);
    const creds = await client.createOrDeriveApiKey();

    await prisma.user.update({
      where: { id: userId },
      data: { clobApiKey: creds.key, clobApiSecret: creds.secret, clobApiPassphrase: creds.passphrase },
    });

    return creds;
  }

  // Checks the wallet's on-chain USDC.e allowance granted to Polymarket's
  // Exchange contract — this must be > 0 before any order can fill. Read-only.
  static async getAllowance(userId: string) {
    const { address } = await requireWallet(userId);
    const selector = "0xdd62ed3e"; // allowance(owner,spender)
    const owner = address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const spender = CTF_EXCHANGE_POLYGON.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const data = selector + owner + spender;

    const res = await fetch(process.env.POLYGON_RPC_URL || "https://1rpc.io/matic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: USDC_POLYGON, data }, "latest"] }),
    });
    const json = await res.json();
    if (json.error) throw new Error(`Polygon RPC error: ${json.error.message}`);
    return { address, spender: CTF_EXCHANGE_POLYGON, allowance: Number(BigInt(json.result)) / 1e6 };
  }

  // Builds (and signs, via Privy) the real on-chain approve() transaction
  // granting the Exchange contract an allowance over the wallet's USDC.e.
  // Returns the signed transaction — broadcasting it is a separate, explicit
  // step so real gas is never spent without the caller choosing to.
  static async buildApproveTransaction(userId: string, amount: string /* raw USDC.e units, 6 decimals, or "max" */) {
    const { address, walletId } = await requireWallet(userId);
    const amountHex = amount === "max"
      ? "f".repeat(64)
      : BigInt(amount).toString(16).padStart(64, "0");
    const data = "0x095ea7b3" // approve(address,uint256)
      + CTF_EXCHANGE_POLYGON.toLowerCase().replace(/^0x/, "").padStart(64, "0")
      + amountHex;

    const signed = await getPrivy().walletApi.ethereum.signTransaction({
      walletId,
      transaction: { to: USDC_POLYGON as `0x${string}`, data: data as `0x${string}`, chainId: 137 },
    });

    return { from: address, to: USDC_POLYGON, signedTransaction: signed.signedTransaction };
  }

  // Places a real order on Polymarket's live CLOB. If the wallet lacks
  // funds/allowance, Polymarket will legitimately reject it — that
  // rejection is real and correct, not something to work around.
  static async placeOrder(userId: string, params: { tokenId: string; side: "BUY" | "SELL"; price: number; size: number; eventSlug: string }) {
    const creds = await this.ensureApiCreds(userId);
    const client = await clientFor(userId, creds);

    const signedOrder = await client.createOrder({
      tokenID: params.tokenId,
      price: params.price,
      size: params.size,
      side: params.side === "BUY" ? Side.BUY : Side.SELL,
    });

    const result = await client.postOrder(signedOrder, OrderType.GTC);

    await prisma.realPosition.create({
      data: {
        userId,
        polymarketOrderId: result.orderID || result.id || "unknown",
        tokenId: params.tokenId,
        eventSlug: params.eventSlug,
        side: params.side,
        price: params.price,
        size: params.size,
        status: result.success === false ? "REJECTED" : "SUBMITTED",
      },
    });

    return result;
  }

  static async listPositions(userId: string) {
    return prisma.realPosition.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }
}
