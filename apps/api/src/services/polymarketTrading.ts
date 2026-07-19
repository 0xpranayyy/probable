import { ClobClient, Chain, Side, OrderType, SignatureTypeV2 } from "@polymarket/clob-client-v2";
import type { ApiKeyCreds } from "@polymarket/clob-client-v2";
import { RelayClient } from "@polymarket/builder-relayer-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import { prisma } from "@probable/db";
import { PUSD_POLYGON } from "./wallet";
import { viemPrivySigner } from "./viemPrivySigner";

// Real trading against Polymarket's actual mainnet CLOB (V2, live since the
// 2026-04-28 migration), using the official @polymarket/clob-client-v2 for
// order construction/signing/submission — not a reimplementation.
//
// Under CLOB V2, a plain EOA cannot be the order maker — Polymarket rejects
// it with "maker address not allowed, please use the deposit wallet flow".
// Every order here is signed with signatureType=POLY_1271 and
// funderAddress=<the user's deposit wallet>, matching what
// docs.polymarket.com/trading/deposit-wallets requires. The EOA (Privy
// wallet) only ever produces a signature — Polymarket's own SDK builds the
// ERC-7739-wrapped payload the deposit wallet's ERC-1271 validator expects.
//
// Note: the client's createOrder() calls resolveVersion() itself, so it
// stays correct across future CLOB version bumps without code changes here.

export const CTF_EXCHANGE_V2_POLYGON = "0xE111180000d2663C0091e4f400237545B87B996B";
const CLOB_HOST = "https://clob.polymarket.com";
const RELAYER_URL = "https://relayer-v2.polymarket.com/";

function getBuilderConfig(): BuilderConfig {
  const key = process.env.BUILDER_API_KEY;
  const secret = process.env.BUILDER_SECRET;
  const passphrase = process.env.BUILDER_PASSPHRASE;
  if (!key || !secret || !passphrase) {
    throw new Error("BUILDER_API_KEY/BUILDER_SECRET/BUILDER_PASSPHRASE are not configured.");
  }
  return new BuilderConfig({ localBuilderCreds: { key, secret, passphrase } });
}

async function requireWallet(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.walletAddress || !user.privyWalletId) {
    throw new Error("No wallet yet — call POST /v1/wallets first.");
  }
  return { address: user.walletAddress, walletId: user.privyWalletId };
}

async function requireDepositWallet(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.depositWalletAddress || !user.depositWalletDeployed) {
    throw new Error("No deposit wallet yet — call POST /v1/live/wallet/deposit first.");
  }
  return user.depositWalletAddress;
}

async function clientFor(userId: string, creds?: ApiKeyCreds) {
  const { address, walletId } = await requireWallet(userId);
  const depositWallet = await requireDepositWallet(userId);
  const signer = viemPrivySigner(walletId, address as `0x${string}`);
  return new ClobClient({
    host: CLOB_HOST,
    chain: Chain.POLYGON,
    signer: signer as any,
    creds,
    signatureType: SignatureTypeV2.POLY_1271,
    funderAddress: depositWallet,
  });
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

  // Checks the deposit wallet's on-chain pUSD allowance granted to
  // Polymarket's V2 Exchange contract — must be > 0 before any order fills.
  static async getAllowance(userId: string) {
    const depositWallet = await requireDepositWallet(userId);
    const selector = "0xdd62ed3e"; // allowance(owner,spender)
    const owner = depositWallet.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const spender = CTF_EXCHANGE_V2_POLYGON.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const data = selector + owner + spender;

    const res = await fetch(process.env.POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: PUSD_POLYGON, data }, "latest"] }),
    });
    const json = await res.json();
    if (json.error) throw new Error(`Polygon RPC error: ${json.error.message}`);
    return { address: depositWallet, spender: CTF_EXCHANGE_V2_POLYGON, allowance: Number(BigInt(json.result)) / 1e6 };
  }

  // Submits a gasless, relayer-executed approve() call FROM the deposit
  // wallet (not the EOA — the deposit wallet is the one that needs to grant
  // the allowance, since it's the address that will actually hold pUSD and
  // place orders). Real on-chain effect, sponsored gas, one relayer round trip.
  static async approvePusd(userId: string, amount: string /* raw pUSD units, 6 decimals, or "max" */) {
    const { address, walletId } = await requireWallet(userId);
    const depositWallet = await requireDepositWallet(userId);
    const amountHex = amount === "max" ? "f".repeat(64) : BigInt(amount).toString(16).padStart(64, "0");
    const data = "0x095ea7b3" // approve(address,uint256)
      + CTF_EXCHANGE_V2_POLYGON.toLowerCase().replace(/^0x/, "").padStart(64, "0")
      + amountHex;

    const signer = viemPrivySigner(walletId, address as `0x${string}`);
    const client = new RelayClient(RELAYER_URL, 137, signer as any, getBuilderConfig() as any);

    const deadline = String(Math.floor(Date.now() / 1000) + 300); // 5 min
    const response = await client.executeDepositWalletBatch(
      [{ target: PUSD_POLYGON, value: "0", data }],
      depositWallet,
      deadline,
    );
    const result = await (response as any).wait();
    if (!result || result.state === "STATE_FAILED") {
      throw new Error("pUSD approval transaction failed or timed out.");
    }
    return { depositWallet, spender: CTF_EXCHANGE_V2_POLYGON, transactionHash: result.transactionHash };
  }

  // Places a real order on Polymarket's live CLOB, signed as the deposit
  // wallet (POLY_1271/ERC-7739). If it lacks funds/allowance, Polymarket
  // will legitimately reject it — that rejection is real and correct.
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
