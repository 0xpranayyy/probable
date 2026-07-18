"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Link from "next/link";
import Footer from "../../components/Footer";
import { ProbableClient } from "@probable/sdk";

const docSections = [
  {
    id: "keys",
    group: "AUTHENTICATION",
    method: "POST",
    methodBg: "#0E9160",
    path: "/keys",
    title: "Generate API Keys",
    desc: "Create scoped credentials to authenticate your application backend. Keep sandbox keys on dev environments.",
    params: [
      { name: "userId", type: "string", typeColor: "#D6336C", desc: "Optional. Developer userID reference." }
    ],
    example: `// cURL example\ncurl -X POST http://localhost:3001/keys \\\n  -H "Content-Type: application/json" \\\n  -d '{"userId": "dev_acme"}'\n\n// Response\n{\n  "userId": "dev_acme",\n  "key": "sk_test_8f2a1b9c...",\n  "status": "active",\n  "createdAt": "2026-07-18T15:47:11Z"\n}`
  },
  {
    id: "markets",
    group: "MARKETS",
    method: "POST",
    methodBg: "#0E9160",
    path: "/v1/markets",
    title: "Create Event Market",
    desc: "Initialize a new prediction market. This triggers AI categorization and registers it in the SQLite database.",
    params: [
      { name: "question", type: "string", typeColor: "#D6336C", desc: "The query event statement (e.g. 'Will ETH close above $5k?')." },
      { name: "closes", type: "string", typeColor: "#D6336C", desc: "Optional. ISO-8601 target closing date." },
      { name: "oracle", type: "string", typeColor: "#D6336C", desc: "Optional. Custom oracle resolver identifier." }
    ],
    example: `// cURL example\ncurl -X POST http://localhost:3001/v1/markets \\\n  -H "Authorization: Bearer sk_test_4Jn8Wz1c" \\\n  -d '{"question": "Will BTC reach $100K this year?"}'`
  },
  {
    id: "wallets",
    group: "WALLETS",
    method: "POST",
    methodBg: "#0E9160",
    path: "/v1/wallets",
    title: "Abstract User Wallet",
    desc: "Generates a secure gasless ERC-4337 smart account dynamically linked to your user identifier.",
    params: [
      { name: "userId", type: "string", typeColor: "#D6336C", desc: "Your internal application user ID." }
    ],
    example: `// cURL example\ncurl -X POST http://localhost:3001/v1/wallets \\\n  -H "Authorization: Bearer sk_test_4Jn8Wz1c" \\\n  -d '{"userId": "user_981a"}'`
  },
  {
    id: "trades",
    group: "TRADING",
    method: "POST",
    methodBg: "#0E9160",
    path: "/v1/trades",
    title: "Execute Market Trade",
    desc: "Submits order parameters to buy YES/NO prediction shares, verifying balances and logging orders.",
    params: [
      { name: "marketId", type: "string", typeColor: "#D6336C", desc: "Target prediction market ID." },
      { name: "userId", type: "string", typeColor: "#D6336C", desc: "Abstract user ID executing the trade." },
      { name: "type", type: "string", typeColor: "#D6336C", desc: "Target trade decision, must be 'YES' or 'NO'." },
      { name: "amount", type: "number", typeColor: "#7A4599", desc: "Amount in USD/USDC shares to buy." }
    ],
    example: `// cURL example\ncurl -X POST http://localhost:3001/v1/trades \\\n  -H "Authorization: Bearer sk_test_4Jn8Wz1c" \\\n  -d '{"marketId": "mkt_btc_150k", "type": "YES", "amount": 10}'`
  },
  {
    id: "predictions",
    group: "ANALYTICS & AI",
    method: "POST",
    methodBg: "#0E9160",
    path: "/v1/predictions",
    title: "AI Analysis Forecast",
    desc: "Forecasts market category and starting price probability index using AI models.",
    params: [
      { name: "question", type: "string", typeColor: "#D6336C", desc: "The market query statement to analyze." }
    ],
    example: `// cURL example\ncurl -X POST http://localhost:3001/v1/predictions \\\n  -H "Authorization: Bearer sk_test_4Jn8Wz1c" \\\n  -d '{"question": "Will OpenAI IPO in 2025?"}'`
  }
];

export default function Docs() {
  const [activeSectionId, setActiveSectionId] = useState("keys");
  const activeSection = docSections.find(s => s.id === activeSectionId) || docSections[0];

  // Sandbox inputs
  const [sandboxApiKey, setSandboxApiKey] = useState("sk_test_4Jn8Wz1c");
  const [formInputs, setFormInputs] = useState<Record<string, string>>({
    userId: "dev_user_1",
    question: "Will Bitcoin reach $150K this year?",
    marketId: "mkt_btc_150k",
    type: "YES",
    amount: "10"
  });
  const [sandboxResponse, setSandboxResponse] = useState<string>("");
  const [loadingSandbox, setLoadingSandbox] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem("probable_session");
    if (cached) {
      const { token, user } = JSON.parse(cached);
      if (token) {
        setSandboxApiKey(token);
        setFormInputs(prev => ({ ...prev, userId: user.id }));
      }
    }
  }, []);

  const handleInputChange = (key: string, val: string) => {
    setFormInputs(prev => ({ ...prev, [key]: val }));
  };

  const handleExecuteSandbox = async () => {
    setLoadingSandbox(true);
    setSandboxResponse("Routing request through @probable/sdk client...");

    try {
      const client = new ProbableClient({
        apiKey: sandboxApiKey,
        baseUrl: "http://localhost:3001"
      });

      let data: any;

      if (activeSection.id === "keys") {
        data = await client.keys.create("test");
      } else if (activeSection.id === "markets") {
        data = await client.markets.create({
          question: formInputs["question"] || "",
          closes: formInputs["closes"] || undefined,
          oracle: formInputs["oracle"] || undefined
        });
      } else if (activeSection.id === "wallets") {
        data = await client.wallets.create(formInputs["userId"] || "");
      } else if (activeSection.id === "trades") {
        data = await client.trades.create({
          marketId: formInputs["marketId"] || "",
          userId: formInputs["userId"] || "sandbox_user",
          type: (formInputs["type"] || "YES") as any,
          amount: parseFloat(formInputs["amount"]) || 0
        });
      } else {
        throw new Error(`Unhandled SDK section: ${activeSection.id}`);
      }

      setSandboxResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setSandboxResponse(`SDK Error: ${e.message}\nMake sure your Hono API server is running on port 3001!`);
    } finally {
      setLoadingSandbox(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFFBF7", color: "#1D1832", fontFamily: "'Instrument Sans',sans-serif" }}>
      <Ticker />
      <Navbar />

      <div data-screen-label="Docs" className="sidebar-layout" style={{ maxWidth: "1180px", margin: "0 auto", padding: "48px 32px 96px", alignItems: "start" }}>
        
        {/* Sidebar Nav */}
        <div style={{ position: "sticky", top: "98px", display: "flex", flexDirection: "column", gap: "3px" }}>
          <div style={{ font: "600 10.5px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1.4px", padding: "14px 14px 10px" }}>AUTHENTICATION</div>
          <button 
            onClick={() => setActiveSectionId("keys")}
            style={{ textAlign: "left", background: activeSectionId === "keys" ? "rgba(29,24,50,.06)" : "transparent", border: "none", color: "#1D1832", font: "600 14px 'Instrument Sans',sans-serif", padding: "9px 14px", borderRadius: "10px", cursor: "pointer", transition: "background .15s" }}>
            Generate Keys
          </button>

          <div style={{ font: "600 10.5px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1.4px", padding: "14px 14px 10px" }}>CORE PRIMITIVES</div>
          <button 
            onClick={() => setActiveSectionId("markets")}
            style={{ textAlign: "left", background: activeSectionId === "markets" ? "rgba(29,24,50,.06)" : "transparent", border: "none", color: "#1D1832", font: "600 14px 'Instrument Sans',sans-serif", padding: "9px 14px", borderRadius: "10px", cursor: "pointer", transition: "background .15s" }}>
            Create Market
          </button>
          <button 
            onClick={() => setActiveSectionId("wallets")}
            style={{ textAlign: "left", background: activeSectionId === "wallets" ? "rgba(29,24,50,.06)" : "transparent", border: "none", color: "#1D1832", font: "600 14px 'Instrument Sans',sans-serif", padding: "9px 14px", borderRadius: "10px", cursor: "pointer", transition: "background .15s" }}>
            Abstract Wallet
          </button>
          <button 
            onClick={() => setActiveSectionId("trades")}
            style={{ textAlign: "left", background: activeSectionId === "trades" ? "rgba(29,24,50,.06)" : "transparent", border: "none", color: "#1D1832", font: "600 14px 'Instrument Sans',sans-serif", padding: "9px 14px", borderRadius: "10px", cursor: "pointer", transition: "background .15s" }}>
            Execute Trade
          </button>

          <div style={{ font: "600 10.5px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1.4px", padding: "14px 14px 10px" }}>ANALYTICS & AI</div>
          <button 
            onClick={() => setActiveSectionId("predictions")}
            style={{ textAlign: "left", background: activeSectionId === "predictions" ? "rgba(29,24,50,.06)" : "transparent", border: "none", color: "#1D1832", font: "600 14px 'Instrument Sans',sans-serif", padding: "9px 14px", borderRadius: "10px", cursor: "pointer", transition: "background .15s" }}>
            AI Forecast
          </button>

          <div style={{ marginTop: "22px", background: "linear-gradient(115deg,#FFE3EC,#EFE9FF)", borderRadius: "14px", padding: "18px" }}>
            <div style={{ font: "700 14px 'Bricolage Grotesque',sans-serif", marginBottom: "6px" }}>Sandbox is free</div>
            <div style={{ fontSize: "12.5px", color: "#4A4363", lineHeight: 1.5, marginBottom: "12px" }}>Test with play-money liquidity, unlimited calls.</div>
            <Link href="/onboard" style={{ display: "inline-block", background: "#1D1633", border: "none", color: "#fff", font: "600 12.5px 'Instrument Sans',sans-serif", padding: "8px 15px", borderRadius: "999px", cursor: "pointer", textDecoration: "none" }}>Get keys →</Link>
          </div>
        </div>

        {/* Content Panel */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ font: "700 11px 'JetBrains Mono',monospace", color: "#fff", background: activeSection.methodBg, padding: "4px 10px", borderRadius: "7px", letterSpacing: ".5px" }}>{activeSection.method}</span>
            <span style={{ font: "600 15px 'JetBrains Mono',monospace", color: "#6E6787" }}>{activeSection.path}</span>
          </div>
          
          <h1 style={{ margin: "0 0 14px", font: "800 36px/1.06 'Bricolage Grotesque',sans-serif", letterSpacing: "-1.4px" }}>{activeSection.title}</h1>
          <p style={{ color: "#6E6787", fontSize: "16px", lineHeight: "1.65", maxWidth: "560px", margin: "0 0 34px" }}>{activeSection.desc}</p>
          
          <div style={{ font: "600 12px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1.2px", marginBottom: "14px" }}>PARAMETERS</div>
          <div style={{ border: "1px solid rgba(29,24,50,.09)", borderRadius: "14px", overflow: "hidden", marginBottom: "36px", background: "#fff" }}>
            {activeSection.params.map((pr, j) => (
              <div key={j} style={{ display: "grid", gridTemplateColumns: "190px 110px 1fr", gap: "16px", padding: "15px 20px", borderBottom: "1px solid rgba(29,24,50,.06)", fontSize: "14px", alignItems: "baseline" }}>
                <span style={{ font: "600 13px 'JetBrains Mono',monospace", color: "#1D1832" }}>{pr.name}</span>
                <span style={{ font: "500 11.5px 'JetBrains Mono',monospace", color: pr.typeColor }}>{pr.type}</span>
                <span style={{ color: "#6E6787", lineHeight: "1.55" }}>{pr.desc}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: "24px", marginBottom: "36px" }}>
            <div>
              <div style={{ font: "600 12px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1.2px", marginBottom: "14px" }}>EXAMPLE REQUEST</div>
              <div style={{ background: "#1D1633", borderRadius: "15px", padding: "22px", font: "500 12.5px/1.8 'JetBrains Mono',monospace", color: "#B9AEDB", whiteSpace: "pre-wrap", overflowX: "auto" }}>
                {activeSection.example}
              </div>
            </div>

            {/* Sandbox Try It Out Console */}
            <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "20px" }}>
              <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif", marginBottom: "12px" }}>Interactive Sandbox Console</div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {activeSection.id !== "keys" && (
                  <div>
                    <label style={{ fontWeight: 600, fontSize: "12px", display: "block", marginBottom: "4px" }}>Authorization Key</label>
                    <input 
                      value={sandboxApiKey}
                      onChange={(e) => setSandboxApiKey(e.target.value)}
                      style={{ width: "100%", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "8px", padding: "8px 10px", font: "500 12px 'JetBrains Mono',monospace" }}
                    />
                  </div>
                )}

                {activeSection.params.map((p, k) => (
                  <div key={k}>
                    <label style={{ fontWeight: 600, fontSize: "12px", display: "block", marginBottom: "4px" }}>{p.name}</label>
                    <input 
                      value={formInputs[p.name] || ""}
                      onChange={(e) => handleInputChange(p.name, e.target.value)}
                      style={{ width: "100%", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "8px", padding: "8px 10px", font: "500 12px 'JetBrains Mono',monospace" }}
                    />
                  </div>
                ))}

                <button 
                  onClick={handleExecuteSandbox}
                  disabled={loadingSandbox}
                  style={{ background: "#1D1633", border: "none", color: "#fff", font: "700 13px 'Instrument Sans',sans-serif", padding: "10px", borderRadius: "8px", cursor: "pointer", marginTop: "8px" }}>
                  {loadingSandbox ? "Executing..." : "Send Request →"}
                </button>
              </div>
            </div>
          </div>

          {/* Sandbox Response block */}
          {sandboxResponse && (
            <div>
              <div style={{ font: "600 12px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1.2px", marginBottom: "14px" }}>SANDBOX RESPONSE</div>
              <pre style={{ background: "#0E0B1A", border: "1px solid rgba(58,223,165,.3)", borderRadius: "15px", padding: "20px", font: "500 12.5px 'JetBrains Mono',monospace", color: "#3ADFA5", overflowX: "auto" }}>
                <code>{sandboxResponse}</code>
              </pre>
            </div>
          )}

        </div>

      </div>
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 32px" }}>
        <Footer />
      </div>
    </div>
  );
}
