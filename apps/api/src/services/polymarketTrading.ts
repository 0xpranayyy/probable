import { PrivyClient } from "@privy-io/server-auth";
import { ClobClient, Chain, Side, OrderType } from "@polymarket/clob-client-v2";
import type { ApiKeyCreds } from "@polymarket/clob-client-v2";
import { prisma } from "@probable/db";
import { PUSD_POLYGON } from "./wallet";

// Real trading against Polymarket's actual mainnet CLOB (V2, live since the
// 2026-04-28 migration), using the official @polymarket/clob-client-v2 for
// order construction/signing/submission — not a reimplementation. The only
// custom part is the signer adapter below, which bridges Privy's
// non-custodial signTypedData API into the ethers-style signer interface the
// official client expects. This process never sees a private key; Privy
// holds it and only returns a signature.
//
// Note: the client's createOrder() calls resolveVersion() itself, so it
// stays correct across future CLOB version bumps without code changes here.

// Verified against @polymarket/clob-client-v2's own MATIC_CONTRACTS —
// the V1 exchange contract (0x4bFb41...) still exists but no longer accepts
// V2-shaped orders; V2 orders are authorized against this contract instead.
export const CTF_EXCHANGE_V2_POLYGON = "0xE111180000d2663C0091e4f400237545B87B996B";
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

// Adapter satisfying @polymarket/clob-client-v2's `ClobSigner` (ethers-style)
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
  return new ClobClient({ host: CLOB_HOST, chain: Chain.POLYGON, signer: signer as any, creds });
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

  // Checks the wallet's on-chain pUSD allowance granted to Polymarket's
  // V2 Exchange contract — this must be > 0 before any order can fill. Read-only.
  static async getAllowance(userId: string) {
    const { address } = await requireWallet(userId);
    const selector = "0xdd62ed3e"; // allowance(owner,spender)
    const owner = address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const spender = CTF_EXCHANGE_V2_POLYGON.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const data = selector + owner + spender;

    const res = await fetch(process.env.POLYGON_RPC_URL || "https://1rpc.io/matic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: PUSD_POLYGON, data }, "latest"] }),
    });
    const json = await res.json();
    if (json.error) throw new Error(`Polygon RPC error: ${json.error.message}`);
    return { address, spender: CTF_EXCHANGE_V2_POLYGON, allowance: Number(BigInt(json.result)) / 1e6 };
  }

  // Builds (and signs, via Privy) the real on-chain approve() transaction
  // granting the V2 Exchange contract an allowance over the wallet's pUSD.
  // Returns the signed transaction WITHOUT broadcasting it — broadcasting
  // spends real gas and is a deliberate separate step, not automatic.
  static async buildApproveTransaction(userId: string, amount: string /* raw pUSD units, 6 decimals, or "max" */) {
    const { address, walletId } = await requireWallet(userId);
    const amountHex = amount === "max"
      ? "f".repeat(64)
      : BigInt(amount).toString(16).padStart(64, "0");
    const data = "0x095ea7b3" // approve(address,uint256)
      + CTF_EXCHANGE_V2_POLYGON.toLowerCase().replace(/^0x/, "").padStart(64, "0")
      + amountHex;

    const signed = await getPrivy().walletApi.ethereum.signTransaction({
      walletId,
      transaction: { to: PUSD_POLYGON as `0x${string}`, data: data as `0x${string}`, chainId: 137 },
    });

    return { from: address, to: PUSD_POLYGON, signedTransaction: signed.signedTransaction };
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
        polymarketOrderId: (result as any).orderID || (result as any).id || "unknown",
        tokenId: params.tokenId,
        eventSlug: params.eventSlug,
        side: params.side,
        price: params.price,
        size: params.size,
        status: (result as any).success === false ? "REJECTED" : "SUBMITTED",
      },
    });

    return result;
  }

  static async listPositions(userId: string) {
    return prisma.realPosition.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }
}
