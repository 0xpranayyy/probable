import { PrivyClient } from "@privy-io/server-auth";
import { prisma } from "@probable/db";

// This is the bridged USDC.e contract ("USD Coin (PoS)"), NOT native USDC
// (0x3c499c...c359). Verified against @polymarket/clob-client's own
// MATIC_CONTRACTS.collateral — Polymarket's CLOB Exchange settles in USDC.e,
// so this has to match exactly or real trades/approvals go to the wrong token.
export const USDC_POLYGON = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
export const POLYGON_CAIP2 = "eip155:137";
const POLYGON_RPC = process.env.POLYGON_RPC_URL || "https://1rpc.io/matic";

let privy: PrivyClient | null = null;
export function getPrivy(): PrivyClient {
  if (privy) return privy;
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("PRIVY_APP_ID/PRIVY_APP_SECRET are not configured — real wallets are unavailable.");
  }
  privy = new PrivyClient(appId, appSecret);
  return privy;
}

export class WalletService {
  // Real, non-custodial: Privy generates and holds the key material — this
  // server never sees a private key, only a walletId it can request
  // signatures from. Idempotent per user: creating twice returns the same wallet.
  static async getOrCreateWallet(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    if (user.walletAddress && user.privyWalletId) {
      return {
        userId,
        address: user.walletAddress,
        walletId: user.privyWalletId,
        walletType: "Privy embedded (non-custodial)",
        chain: "Polygon",
        created: false,
      };
    }

    const wallet = await getPrivy().walletApi.createWallet({ chainType: "ethereum" });

    await prisma.user.update({
      where: { id: userId },
      data: { walletAddress: wallet.address, privyWalletId: wallet.id },
    });

    return {
      userId,
      address: wallet.address,
      walletId: wallet.id,
      walletType: "Privy embedded (non-custodial)",
      chain: "Polygon",
      created: true,
    };
  }

  // Real on-chain read: current USDC balance on Polygon mainnet for the
  // given address, via a direct eth_call against the verified USDC contract.
  static async getBalance(address: string) {
    const selector = "0x70a08231"; // balanceOf(address)
    const data = selector + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");

    const res = await fetch(POLYGON_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "eth_call",
        params: [{ to: USDC_POLYGON, data }, "latest"],
      }),
    });
    const json = await res.json();
    if (json.error) throw new Error(`Polygon RPC error: ${json.error.message}`);

    const raw = BigInt(json.result);
    return {
      address,
      token: "USDC",
      chain: "Polygon",
      contractAddress: USDC_POLYGON,
      balance: Number(raw) / 1e6, // USDC has 6 decimals
    };
  }
}
