"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Footer from "../../components/Footer";
import { ProbableClient } from "@probable/sdk";

const sdk = new ProbableClient({ baseUrl: "http://localhost:3001" });

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const data = isLogin
        ? await sdk.auth.login(email, password)
        : await sdk.auth.signup(email, password, name || undefined);

      localStorage.setItem("probable_session", JSON.stringify({ token: data.token, user: data.user }));
      setMessage(isLogin ? "Login successful! Redirecting..." : "Signup successful! Welcome aboard. Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setIsError(true);
      setMessage(err.message || "Authentication failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFFBF7", color: "#1D1832", fontFamily: "'Instrument Sans', sans-serif" }}>
      <Ticker />
      <Navbar />

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "120px 32px 140px" }}>
        
        <div style={{
          background: "#fff",
          border: "1px solid rgba(29, 24, 50, 0.08)",
          borderRadius: "24px",
          padding: "44px 38px",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 20px 48px rgba(74,42,90,.05)",
          animation: "fadeUp 0.6s ease"
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ margin: "0 0 8px", font: "800 28px 'Bricolage Grotesque'", letterSpacing: "-1px" }}>
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p style={{ color: "#6E6787", fontSize: "14px", margin: 0 }}>
              {isLogin ? "Enter your email to log in to your dashboard" : "Get started with sandboxed prediction rails"}
            </p>
          </div>

          {/* Tab Selector */}
          <div style={{ display: "flex", gap: "6px", background: "rgba(29,24,50,0.04)", padding: "4px", borderRadius: "10px", marginBottom: "24px" }}>
            <button
              onClick={() => { setIsLogin(true); setMessage(""); }}
              style={{
                flex: 1,
                background: isLogin ? "#fff" : "transparent",
                border: "none",
                color: "#1D1832",
                font: "600 13px 'Instrument Sans'",
                padding: "8px",
                borderRadius: "7px",
                cursor: "pointer",
                boxShadow: isLogin ? "0 2px 8px rgba(0,0,0,0.05)" : "none"
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setMessage(""); }}
              style={{
                flex: 1,
                background: !isLogin ? "#fff" : "transparent",
                border: "none",
                color: "#1D1832",
                font: "600 13px 'Instrument Sans'",
                padding: "8px",
                borderRadius: "7px",
                cursor: "pointer",
                boxShadow: !isLogin ? "0 2px 8px rgba(0,0,0,0.05)" : "none"
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {!isLogin && (
              <div>
                <label style={{ fontWeight: 600, fontSize: "13px", display: "block", marginBottom: "6px" }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#FFFBF7",
                    border: "1px solid rgba(29,24,50,.12)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    fontSize: "14px",
                    fontFamily: "'Instrument Sans'"
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ fontWeight: 600, fontSize: "13px", display: "block", marginBottom: "6px" }}>Email Address</label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  background: "#FFFBF7",
                  border: "1px solid rgba(29,24,50,.12)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  fontSize: "14px",
                  fontFamily: "'Instrument Sans'"
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: "13px", display: "block", marginBottom: "6px" }}>Password</label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  background: "#FFFBF7",
                  border: "1px solid rgba(29,24,50,.12)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  fontSize: "14px",
                  fontFamily: "'Instrument Sans'"
                }}
              />
            </div>

            {message && (
              <div style={{
                fontSize: "13.5px",
                color: isError ? "#D6336C" : "#17B877",
                background: isError ? "rgba(214,51,108,0.07)" : "rgba(23,184,119,0.07)",
                border: `1px solid ${isError ? "rgba(214,51,108,0.15)" : "rgba(23,184,119,0.15)"}`,
                padding: "10px 14px",
                borderRadius: "10px",
                fontWeight: 600
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: "#1D1633",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "14px",
                font: "700 15px 'Instrument Sans'",
                cursor: "pointer",
                marginTop: "8px",
                transition: "opacity 0.2s",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Please wait..." : isLogin ? "Sign In →" : "Sign Up →"}
            </button>
          </form>

        </div>

      </div>

      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 32px" }}>
        <Footer />
      </div>
    </div>
  );
}
