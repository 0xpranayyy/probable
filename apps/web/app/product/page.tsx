"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Footer from "../../components/Footer";

const productBlocks = [
  {
    tag: "RAILS",
    tagColor: "#D6336C",
    tagBg: "rgba(255,143,181,.15)",
    title: "Instant Fiat & Crypto Settlement",
    body: "Eliminate gas fees and crypto complexities. Fund accounts directly via standard card checkout or USDC transfers, and resolve payouts instantly.",
    points: [
      "ERC-4337 smart wallets generated under the hood",
      "Gas sponsored via paymasters on Polygon chain",
      "Direct fiat deposits with credit card or Apple Pay"
    ],
    snippet: `const payout = await probable.rails.payout({\n  userId: "user_981a",\n  amount: 250.00,\n  asset: "USDC"\n});`
  },
  {
    tag: "EMBEDS",
    tagColor: "#0E9160",
    tagBg: "rgba(58,223,165,.15)",
    title: "Beautiful, Reactive Market Embeds",
    body: "Drop responsive prediction cards directly into your news feeds or trading interfaces. Custom stylesheet overrides let you align it with your brand identity.",
    points: [
      "One line of JS to import and render widgets",
      "Auto-updating WebSockets quote streams",
      "Zero React wrapper boilerplate required"
    ],
    snippet: `<probable-embed\n  market-id="mkt_btc_150k"\n  theme="dark"\n  accent="#F0568C"\n/>`
  },
  {
    tag: "SHIELD",
    tagColor: "#D4491F",
    tagBg: "rgba(255,203,142,.15)",
    title: "Institutional Fraud & Wash Monitoring",
    body: "Integrate compliance safely. Our monitoring suite blocks circular trading and coordinates user limits based on geographic rules automatically.",
    points: [
      "Automated wash trading detection models",
      "OFAC sanction checks and KYC validation flow",
      "Geographic gating on order execution"
    ],
    snippet: `const check = await probable.shield.check({\n  userId: "user_981a",\n  action: "TRADE_EXECUTE"\n});\n// -> status: ALLOWED`
  }
];

const useCases = [
  { k: "FINTECH", kColor: "#D6336C", title: "Asset Hedging", body: "Let users purchase options or hedge holdings against real-world event occurrences directly in your dashboard." },
  { k: "MEDIA", kColor: "#0E9160", title: "Stake Polls", body: "Turn static readership polls into active financial predictions. Boost reader interaction by 4.2x." },
  { k: "GAMING", kColor: "#D4491F", title: "Interactive Esports", body: "Allow viewers to forecast game outcomes and player statistics live with gasless sub-second payouts." },
];

const tiers = [
  { name: "Sandbox", desc: "Build prototypes, evaluate endpoints, and run virtual mock trades.", rate: "0%", unit: "fees", feats: ["100 transactions/mo", "API key access", "Community support"], btnBg: "none", btnBorder: "rgba(29,24,50,.14)", btnColor: "#1D1832", cta: "Start testing", popular: false, bg: "#fff", border: "rgba(29,24,50,.08)", ink: "#1D1832", muted: "#6E6787", featColor: "#4A4363" },
  { name: "Scale", desc: "For scaling production apps requiring full trading capabilities and streaming.", rate: "0.5%", unit: "per trade", feats: ["Unlimited trades", "WebSockets quote stream", "Anti-wash shield checks", "Email support"], btnBg: "#1D1633", btnBorder: "none", btnColor: "#fff", cta: "Upgrade now", popular: true, bg: "#fff", border: "rgba(240,86,140,.45)", ink: "#1D1832", muted: "#6E6787", featColor: "#4A4363" },
  { name: "Platform", desc: "Custom features, dedicated nodes, and enterprise compliance gating.", rate: "Custom", unit: "volume pricing", feats: ["Dedicated RPC channels", "White-glove payment setups", "SLA support channel", "Compliance auditing"], btnBg: "none", btnBorder: "rgba(29,24,50,.14)", btnColor: "#1D1832", cta: "Contact sales", popular: false, bg: "#fff", border: "rgba(29,24,50,.08)", ink: "#1D1832", muted: "#6E6787", featColor: "#4A4363" }
];

export default function Product() {
  const [volSlider, setVolSlider] = useState(50);
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);

  useEffect(() => {
    async function loadPricing() {
      try {
        const res = await fetch("http://localhost:3001/v1/config/pricing");
        if (res.ok) {
          const data = await res.json();
          setPricingTiers(data.tiers);
        }
      } catch (err) {
        console.warn("Failed to load pricing config from backend, using defaults.");
      }
    }
    loadPricing();
  }, []);

  const volumeAmount = volSlider * 10000;
  
  // Calculate rate dynamically based on tiers or fallback default
  let rate = 0.5;
  if (pricingTiers && pricingTiers.length > 0) {
    const matched = pricingTiers.find(t => volumeAmount <= t.limit);
    if (matched) {
      rate = matched.rate * 100;
    } else {
      rate = pricingTiers[pricingTiers.length - 1].rate * 100;
    }
  } else {
    rate = volumeAmount > 500000 ? 0.3 : 0.5;
  }

  const monthlyFee = (volumeAmount * (rate / 100)).toFixed(0);

  return (
    <div style={{ minHeight: "100vh", background: "#FFFBF7", color: "#1D1832", fontFamily: "'Instrument Sans',sans-serif" }}>
      <Ticker />
      <Navbar />

      <div data-screen-label="Product" style={{ maxWidth: "1180px", margin: "0 auto", padding: "72px 32px 96px" }}>
        <div style={{ font: "600 12.5px 'JetBrains Mono',monospace", color: "#D6336C", letterSpacing: "1.6px", marginBottom: "16px" }}>PRODUCT</div>
        <h1 style={{ margin: "0 0 14px", font: "800 50px/1.02 'Bricolage Grotesque',sans-serif", letterSpacing: "-2.2px" }}>One API, three primitives</h1>
        <p style={{ color: "#6E6787", fontSize: "17px", maxWidth: "560px", lineHeight: "1.6", margin: "0 0 56px" }}>Compose Rails, Embeds, and Shield into any prediction-market experience.</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {productBlocks.map((p, i) => (
            <div key={i} id={p.tag.toLowerCase()} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "44px", background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "20px", padding: "42px", alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-block", font: "600 11px 'JetBrains Mono',monospace", color: p.tagColor, background: p.tagBg, borderRadius: "999px", padding: "5px 13px", marginBottom: "18px", letterSpacing: ".6px" }}>{p.tag}</div>
                <div style={{ font: "700 27px 'Bricolage Grotesque',sans-serif", letterSpacing: "-.8px", marginBottom: "12px" }}>{p.title}</div>
                <div style={{ color: "#6E6787", fontSize: "15.5px", lineHeight: "1.65", marginBottom: "22px" }}>{p.body}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {p.points.map((pt, j) => (
                    <div key={j} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "14.5px", color: "#4A4363" }}>
                      <span style={{ color: "#17B877", fontWeight: 700 }}>✓</span>{pt}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#1D1633", borderRadius: "15px", padding: "22px 24px", font: "500 12.5px/1.75 'JetBrains Mono',monospace", color: "#B9AEDB", whiteSpace: "pre-wrap" }}>{p.snippet}</div>
            </div>
          ))}
        </div>

        {/* USE CASES */}
        <div style={{ marginTop: "88px" }}>
          <div style={{ font: "600 12.5px 'JetBrains Mono',monospace", color: "#0E9160", letterSpacing: "1.6px", marginBottom: "16px" }}>USE CASES</div>
          <h2 style={{ margin: "0 0 40px", font: "800 38px/1.06 'Bricolage Grotesque',sans-serif", letterSpacing: "-1.5px" }}>Who builds on Probable</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {useCases.map((u, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "18px", padding: "28px", cursor: "pointer" }}>
                <div style={{ font: "600 12px 'JetBrains Mono',monospace", color: u.kColor, marginBottom: "12px", letterSpacing: ".8px" }}>{u.k}</div>
                <div style={{ font: "700 18.5px 'Bricolage Grotesque',sans-serif", marginBottom: "9px", letterSpacing: "-.3px" }}>{u.title}</div>
                <div style={{ color: "#6E6787", fontSize: "14px", lineHeight: "1.62" }}>{u.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PRICING */}
        <div id="pricing" style={{ marginTop: "120px" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ font: "600 12.5px 'JetBrains Mono',monospace", color: "#D6336C", letterSpacing: "1.6px", marginBottom: "16px" }}>PRICING</div>
            <h1 style={{ margin: "0 0 14px", font: "800 50px/1.02 'Bricolage Grotesque',sans-serif", letterSpacing: "-2.2px" }}>Pay per settled dollar</h1>
            <p style={{ color: "#6E6787", fontSize: "17px", margin: 0 }}>No monthly fees. No minimums. Volume discounts built in.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "64px", alignItems: "start" }}>
            {tiers.map((t, i) => (
              <div key={i} style={{ background: t.bg, border: `1.5px solid ${t.border}`, borderRadius: "20px", padding: "34px", position: "relative", cursor: "pointer" }}>
                {t.popular && (
                  <div style={{ position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)", background: "#F0568C", color: "#fff", font: "700 10.5px 'JetBrains Mono',monospace", padding: "5px 14px", borderRadius: "999px", letterSpacing: ".8px" }}>MOST POPULAR</div>
                )}
                <div style={{ font: "700 21px 'Bricolage Grotesque',sans-serif", marginBottom: "6px", color: t.ink }}>{t.name}</div>
                <div style={{ color: t.muted, fontSize: "13.5px", marginBottom: "22px", minHeight: "36px", lineHeight: "1.45" }}>{t.desc}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "24px" }}>
                  <span style={{ font: "600 42px 'JetBrains Mono',monospace", letterSpacing: "-2.5px", color: t.ink }}>{t.rate}</span>
                  <span style={{ color: t.muted, fontSize: "14px" }}>{t.unit}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "11px", marginBottom: "28px" }}>
                  {t.feats.map((f, j) => (
                    <div key={j} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", color: t.featColor }}>
                      <span style={{ color: "#17B877", fontWeight: 700 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <button style={{ width: "100%", background: t.btnBg, border: `1px solid ${t.btnBorder}`, color: t.btnColor, font: "700 15px 'Instrument Sans',sans-serif", padding: "13px 0", borderRadius: "999px", cursor: "pointer" }}>{t.cta}</button>
              </div>
            ))}
          </div>

          {/* FEE CALCULATOR */}
          <div style={{ maxWidth: "780px", margin: "0 auto", background: "#fff", border: "1px solid rgba(29,24,50,.09)", borderRadius: "20px", padding: "38px", boxShadow: "0 16px 44px rgba(74,42,90,.08)" }}>
            <div style={{ font: "700 23px 'Bricolage Grotesque',sans-serif", letterSpacing: "-.5px", marginBottom: "6px" }}>Estimate your fees</div>
            <div style={{ color: "#6E6787", fontSize: "14px", marginBottom: "30px" }}>Drag to your expected monthly settled volume.</div>
            
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={volSlider} 
              onChange={(e) => setVolSlider(parseInt(e.target.value))} 
              style={{ width: "100%" }}
            />
            
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", gap: "16px" }}>
              <div style={{ flex: 1, background: "#FFFBF7", border: "1px solid rgba(29,24,50,.08)", borderRadius: "14px", padding: "18px 20px" }}>
                <div style={{ font: "600 10.5px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1px", marginBottom: "7px" }}>MONTHLY VOLUME</div>
                <div style={{ font: "600 26px 'JetBrains Mono',monospace", letterSpacing: "-1.5px" }}>${volumeAmount.toLocaleString()}</div>
              </div>
              <div style={{ flex: 1, background: "#FFFBF7", border: "1px solid rgba(29,24,50,.08)", borderRadius: "14px", padding: "18px 20px" }}>
                <div style={{ font: "600 10.5px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1px", marginBottom: "7px" }}>YOUR RATE</div>
                <div style={{ font: "600 26px 'JetBrains Mono',monospace", letterSpacing: "-1.5px", color: "#D6336C" }}>{rate.toFixed(1)}%</div>
              </div>
              <div style={{ flex: 1, background: "rgba(23,184,119,.07)", border: "1px solid rgba(23,184,119,.3)", borderRadius: "14px", padding: "18px 20px" }}>
                <div style={{ font: "600 10.5px 'JetBrains Mono',monospace", color: "#0E9160", letterSpacing: "1px", marginBottom: "7px" }}>EST. MONTHLY FEE</div>
                <div style={{ font: "600 26px 'JetBrains Mono',monospace", letterSpacing: "-1.5px", color: "#0E9160" }}>${parseFloat(monthlyFee).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
