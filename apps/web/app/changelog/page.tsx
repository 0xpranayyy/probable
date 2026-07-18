"use client";

import React from "react";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Footer from "../../components/Footer";

const entries = [
  {
    date: "July 18, 2026",
    tag: "RELEASED",
    tagColor: "#FF8FB5",
    tagBg: "rgba(255,143,181,0.12)",
    title: "TypeScript SDK client & Live Webhooks",
    desc: "We just launched `@probable/sdk` to speed up integration pipelines, alongside a live developer webhook logs visualizer in the dashboard.",
    bullets: [
      "Released npm workspace library `@probable/sdk` containing typed query models.",
      "Added Live Status monitoring trackers under `/status`.",
      "Exposed dynamic platform fee calculations pulling pricing structures directly from the backend config routes."
    ],
    code: `import { ProbableClient } from "@probable/sdk";

const sdk = new ProbableClient({
  apiKey: "sk_live_prod_52x19c3"
});

// Stream, trade, score. Done.
const market = await sdk.markets.create({
  question: "Will ETH gas stay below 10 gwei?",
  closes: "2026-08-31T23:59:59Z"
});`
  },
  {
    date: "June 24, 2026",
    tag: "STABILITY",
    tagColor: "#3ADFA5",
    tagBg: "rgba(58,223,165,0.12)",
    title: "Polymarket CLOB Sync & EIP-712 gas sponsorships",
    desc: "Full orderbook sync with clob.polymarket.com on Polygon network (`chainId: 137`). Users can place gasless limit trades using paymaster sponsors.",
    bullets: [
      "Created gasless signature routers using pimlico/biconomy wallets integrations.",
      "Synchronized live bids/asks lists arrays directly from Polymarket CLOB endpoints.",
      "Added fallback local queue pools utilizing BullMQ queues to handle spikes."
    ],
    code: `// Polymarket EIP-712 transaction signature generator
const signature = await polymarket.signOrder({
  price: 0.52,
  amount: 250,
  side: "BUY"
});`
  },
  {
    date: "May 10, 2026",
    tag: "INIT",
    tagColor: "#FFCB8E",
    tagBg: "rgba(255,203,142,0.12)",
    title: "Hono Event Engine & AI Oracle Gating",
    desc: "Initial public launch of the Probable Prediction Market routing rails. Setup core Prisma ORM engines and Gemini-powered auto market resolvers.",
    bullets: [
      "Setup REST API routes inside Hono Node Server.",
      "Mapped event question parsing utilizing direct calls to Gemini 2.5 Flash APIs.",
      "Initialized SQLite db for zero-dependency local setups."
    ],
    code: `// AI Oracle evaluation
const outcome = await gemini.evaluateMarket(
  "Will BTC hit $150k?"
);`
  }
];

export default function ChangelogPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FFFBF7", color: "#1D1832", fontFamily: "'Instrument Sans', sans-serif" }}>
      <Ticker />
      <Navbar />

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "64px 32px 96px" }}>
        
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div style={{ font: "600 11px 'JetBrains Mono', monospace", color: "#D6336C", letterSpacing: "1.5px", marginBottom: "10px" }}>CHANGELOG</div>
          <h1 style={{ margin: "0 0 16px", font: "800 48px/1.05 'Bricolage Grotesque'", letterSpacing: "-1.8px" }}>Platform Updates</h1>
          <p style={{ color: "#6E6787", fontSize: "16.5px", margin: 0 }}>Follow the releases, fixes, and improvements on Probable Rails.</p>
        </div>

        {/* Timeline Entries */}
        <div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>
          {entries.map((ent, idx) => (
            <div key={idx} style={{
              display: "grid",
              gridTemplateColumns: "190px 1fr",
              gap: "24px",
              alignItems: "start"
            }}>
              {/* Left meta info */}
              <div style={{ position: "sticky", top: "110px" }}>
                <div style={{ font: "700 14px 'JetBrains Mono', monospace", color: "#A9A2BE", marginBottom: "8px" }}>{ent.date}</div>
                <span style={{
                  display: "inline-block",
                  font: "700 9.5px 'JetBrains Mono', monospace",
                  color: ent.tagColor,
                  background: ent.tagBg,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  letterSpacing: "0.5px"
                }}>{ent.tag}</span>
              </div>

              {/* Right content info */}
              <div style={{
                background: "#fff",
                border: "1px solid rgba(29, 24, 50, 0.08)",
                borderRadius: "20px",
                padding: "32px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.01)"
              }}>
                <h3 style={{ margin: "0 0 12px", font: "800 22px 'Bricolage Grotesque'", letterSpacing: "-0.6px" }}>{ent.title}</h3>
                <p style={{ color: "#6E6787", fontSize: "14.5px", lineHeight: "1.65", margin: "0 0 20px" }}>{ent.desc}</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                  {ent.bullets.map((b, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", fontSize: "13.5px", lineHeight: "1.5", color: "#4A4363" }}>
                      <span style={{ color: ent.tagColor, fontWeight: 700 }}>•</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div style={{ font: "600 10.5px 'JetBrains Mono', monospace", color: "#A9A2BE", letterSpacing: "0.8px", marginBottom: "8px" }}>CODE SNIPPET</div>
                <pre style={{ background: "#0E0B1A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "18px", font: "500 12px/1.7 'JetBrains Mono', monospace", color: "#B9AEDB", overflowX: "auto", margin: 0 }}>
                  <code>{ent.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>

      </div>

      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 32px" }}>
        <Footer />
      </div>
    </div>
  );
}
