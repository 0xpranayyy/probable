"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Footer from "../../components/Footer";
import { usePrivy } from "@privy-io/react-auth";

export default function AuthPage() {
  const { login, ready, authenticated } = usePrivy();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const cached = localStorage.getItem("probable_session");
    if (cached) {
      window.location.href = "/dashboard";
    }
  }, []);

  useEffect(() => {
    if (ready && !authenticated) {
      login();
    }
  }, [ready, authenticated]);

  useEffect(() => {
    if (ready && authenticated) {
      setLoading(true);
      // Wait for navbar sync to write to localStorage, then redirect
      const interval = setInterval(() => {
        const cached = localStorage.getItem("probable_session");
        if (cached) {
          clearInterval(interval);
          window.location.href = "/dashboard";
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [ready, authenticated]);

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
            <button
              onClick={() => login()}
              disabled={loading || !ready}
              style={{
                width: "100%",
                background: "#120F24",
                color: "#fff",
                border: "none",
                borderRadius: "9999px",
                padding: "15px",
                font: "700 15px 'Instrument Sans'",
                cursor: "pointer",
                transition: "opacity 0.2s",
                opacity: (loading || !ready) ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(18, 15, 36, 0.15)"
              }}
            >
              {loading ? "Authenticating session..." : "Sign In with Privy"}
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
