import { RelayClient } from "@polymarket/builder-relayer-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import { prisma } from "@probable/db";
import { viemPrivySigner } from "./viemPrivySigner";

const RELAYER_URL = "https://relayer-v2.polymarket.com/";
const POLYGON_CHAIN_ID = 137;

function getBuilderConfig(): BuilderConfig {
  const key = process.env.BUILDER_API_KEY;
  const secret = process.env.BUILDER_SECRET;
  const passphrase = process.env.BUILDER_PASSPHRASE;
  if (!key || !secret || !passphrase) {
    throw new Error("BUILDER_API_KEY/BUILDER_SECRET/BUILDER_PASSPHRASE are not configured — deposit wallet operations are unavailable.");
  }
  return new BuilderConfig({ localBuilderCreds: { key, secret, passphrase } });
}

function relayClientFor(walletId: string, address: string) {
  const signer = viemPrivySigner(walletId, address as `0x${string}`);
  // BuilderConfig is duplicated across two node_modules paths (root vs
  // nested under builder-relayer-client) with identical runtime shape but
  // distinct TS nominal identity because of a private field — harmless,
  // cast past it.
  return new RelayClient(RELAYER_URL, POLYGON_CHAIN_ID, signer as any, getBuilderConfig() as any);
}

// RelayClient.isContractDeployed exists but is a private method (may change
// without notice) — check directly via eth_getCode instead, same pattern
// used everywhere else in this codebase for on-chain reads.
async function isDeployedOnChain(address: string): Promise<boolean> {
  const res = await fetch(process.env.POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getCode", params: [address, "latest"] }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`Polygon RPC error: ${json.error.message}`);
  return json.result && json.result !== "0x";
}

export class DepositWalletService {
  // Derives (and deploys if needed) the user's Polymarket deposit wallet —
  // the smart-contract proxy that actually holds pUSD and is the real
  // maker/signer on every order under CLOB V2. Idempotent: safe to call
  // repeatedly, only deploys once.
  static async getOrCreateDepositWallet(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.walletAddress || !user.privyWalletId) {
      throw new Error("No wallet yet — call POST /v1/wallets first.");
    }

    if (user.depositWalletAddress && user.depositWalletDeployed) {
      return { address: user.depositWalletAddress, deployed: true, created: false };
    }

    const client = relayClientFor(user.privyWalletId, user.walletAddress);
    const address = await client.deriveDepositWalletAddress();

    if (user.depositWalletAddress !== address) {
      await prisma.user.update({ where: { id: userId }, data: { depositWalletAddress: address } });
    }

    const alreadyDeployed = await isDeployedOnChain(address);
    if (alreadyDeployed) {
      await prisma.user.update({ where: { id: userId }, data: { depositWalletDeployed: true } });
      return { address, deployed: true, created: false };
    }

    const response = await client.deployDepositWallet();
    const result = await (response as any).wait();
    if (!result || result.state === "STATE_FAILED") {
      throw new Error("Deposit wallet deployment failed or timed out — try again.");
    }

    await prisma.user.update({ where: { id: userId }, data: { depositWalletDeployed: true } });
    return { address, deployed: true, created: true, transactionHash: result.transactionHash };
  }

  static async getStatus(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return {
      address: user?.depositWalletAddress ?? null,
      deployed: user?.depositWalletDeployed ?? false,
    };
  }
}
