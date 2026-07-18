import { PrivyClient } from "@privy-io/server-auth";
import { prisma } from "@probable/db";

// Polymarket's CLOB V2 migration (~2026-04-28) replaced USDC.e collateral
// with their own settlement token, "Polymarket USD" (pUSD). Verified
// on-chain: name()="Polymarket USD", symbol()="pUSD", decimals()=6, and
// cross-checked against @polymarket/clob-client-v2's own MATIC_CONTRACTS.
// This is NOT USDC or USDC.e — funding a wallet with either of those will
// not let it trade; it needs pUSD specifically.
export const PUSD_POLYGON = "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB";
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

  // Real on-chain read: current pUSD balance on Polygon mainnet for the
  // given address, via a direct eth_call against the verified collateral contract.
  static async getBalance(address: string) {
    const selector = "0x70a08231"; // balanceOf(address)
    const data = selector + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");

    const res = await fetch(POLYGON_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "eth_call",
        params: [{ to: PUSD_POLYGON, data }, "latest"],
      }),
    });
    const json = await res.json();
    if (json.error) throw new Error(`Polygon RPC error: ${json.error.message}`);

    const raw = BigInt(json.result);
    return {
      address,
      token: "pUSD",
      chain: "Polygon",
      contractAddress: PUSD_POLYGON,
      balance: Number(raw) / 1e6, // pUSD has 6 decimals
    };
  }
}
