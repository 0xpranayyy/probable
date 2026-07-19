import { createWalletClient, http, type WalletClient } from "viem";
import { toAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import { getPrivy } from "./wallet";

// A real viem WalletClient whose signing methods are backed by a Privy
// embedded wallet. Used for both the CLOB client and the relayer client —
// both accept a viem WalletClient, and (importantly) only the WalletClient
// signing path receives an explicit `primaryType` from the official SDKs;
// the alternate ethers-style path does not, which matters for POLY_1271's
// nested ERC-7739 typed data. Privy never sees a request it can't already
// service: signMessage, signTypedData are real Privy RPC calls; signing a
// raw transaction is not needed by anything in this flow (deposit-wallet
// creation and batch execution are both gasless, relayer-submitted, and
// need only a message/typed-data signature from the owner EOA).
export function viemPrivySigner(walletId: string, address: `0x${string}`): WalletClient {
  const account = toAccount({
    address,
    signMessage: async ({ message }) => {
      const msg = typeof message === "string" ? message : Buffer.from(message.raw as any).toString("utf8");
      const { signature } = await getPrivy().walletApi.ethereum.signMessage({ walletId, message: msg });
      return signature as `0x${string}`;
    },
    signTransaction: async () => {
      throw new Error("Raw transaction signing is not used in the deposit-wallet/CLOB flow.");
    },
    signTypedData: async (params: any) => {
      const { domain, types, primaryType, message } = params;
      const { signature } = await getPrivy().walletApi.ethereum.signTypedData({
        walletId,
        typedData: { domain, types, primaryType, message },
      });
      return signature as `0x${string}`;
    },
  });

  return createWalletClient({
    account,
    chain: polygon,
    transport: http(process.env.POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com"),
  });
}
