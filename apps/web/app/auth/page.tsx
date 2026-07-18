"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Footer from "../../components/Footer";
import { sdk } from "../../lib/sdk";
import { usePrivy } from "@privy-io/react-auth";

export default function AuthPage() {
  const { login, ready, authenticated, getAccessToken } = usePrivy();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const cached = localStorage.getItem("probable_session");
    if (cached) {
      window.location.href = "/dashboard";
    }
  }, []);

  useEffect(() => {
    if (ready && authenticated) {
      handlePrivyAuth();
    }
  }, [ready, authenticated]);

  const handlePrivyAuth = async () => {
    setLoading(true);
    setMessage("Verifying credentials with secure auth server...");
    setIsError(false);
    try {
      const privyToken = await getAccessToken();
      if (!privyToken) throw new Error("Could not retrieve authentication token.");

      const data = await sdk.auth.privy(privyToken);
      localStorage.setItem("probable_session", JSON.stringify({ token: data.token, user: data.user }));
      setMessage("Authentication successful! Redirecting to dashboard...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setIsError(true);
      setMessage(err.message || "Failed to sync session with backend.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8FA", color: "#120F24", fontFamily: "'Instrument Sans', sans-serif" }}>
      <Ticker />
      <Navbar />

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "120px 32px 140px" }}>
        
        <div style={{
          background: "#fff",
          border: "1px solid rgba(130, 0, 255, 0.08)",
          borderRadius: "24px",
          padding: "48px 38px",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 20px 48px rgba(18,15,36,.05)",
          animation: "fadeUp 0.6s ease"
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ margin: "0 0 8px", font: "800 30px 'Bricolage Grotesque'", letterSpacing: "-1.2px", color: "#120F24" }}>
              Welcome to Probable
            </h2>
            <p style={{ color: "#625E77", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
              Prediction market infrastructure for developers. Authenticate to manage API keys, monitor webhooks, and track real Polygon mainnet positions.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {message && (
              <div style={{
                fontSize: "13.5px",
                color: isError ? "#8200FF" : "#17B877",
                background: isError ? "rgba(255,92,35,0.07)" : "rgba(23,184,119,0.07)",
                border: `1px solid ${isError ? "rgba(255,92,35,0.15)" : "rgba(23,184,119,0.15)"}`,
                padding: "12px 16px",
                borderRadius: "10px",
                fontWeight: 600,
                textAlign: "center"
              }}>
                {message}
              </div>
            )}

            <button
              onClick={() => login()}
              disabled={loading || !ready}
              style={{
                width: "100%",
                background: "#120F24",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "15px",
                font: "700 15px 'Instrument Sans'",
                cursor: "pointer",
                transition: "opacity 0.2s",
                opacity: (loading || !ready) ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(18, 15, 36, 0.15)"
              }}
            >
              {loading ? "Please wait..." : "Sign In with Privy"}
            </button>
            
            <div style={{ fontSize: "11px", color: "#9490A8", textAlign: "center", marginTop: "8px" }}>
              Secure non-custodial wallet creation powered by Privy.
            </div>
          </div>

        </div>

      </div>

      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 32px" }}>
        <Footer />
      </div>
    </div>
  );
}
