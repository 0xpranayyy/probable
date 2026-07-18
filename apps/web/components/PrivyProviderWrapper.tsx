"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import React from "react";

export default function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  // Fallback to the user's active Privy app ID from .env
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmrqpgigz03vj0cjzhtf1q4lc";

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#F0568C",
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
