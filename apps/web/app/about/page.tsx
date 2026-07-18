"use client";

import React from "react";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Footer from "../../components/Footer";

const aboutStats = [
  { value: "100%", label: "non-custodial wallets", g1: "#FFE3EC", g2: "#FFEFDD" },
  { value: "$0", label: "gas fees for end users", g1: "#E8FBF1", g2: "#EFE9FF" },
  { value: "Polygon", label: "native mainnet settlement", g1: "#EFE9FF", g2: "#FFE3EC" },
  { value: "Sub-sec", label: "payout execution speed", g1: "#FFEFDD", g2: "#E8FBF1" },
];

const values = [
  { n: "01", bg: "rgba(240,86,140,.12)", color: "#D6336C", title: "The price is the product", body: "Every feature exists to make prediction market prices more accurate, more liquid, and more available." },
  { n: "02", bg: "rgba(23,184,119,.12)", color: "#0E9160", title: "Compliance is a feature", body: "We treat regulation as a design constraint, not an obstacle. Shield exists so our customers sleep." },
  { n: "03", bg: "rgba(122,69,153,.12)", color: "#7A4599", title: "Reliability is the brand", body: "Settlement infrastructure earns trust in years and loses it in seconds. We engineer for the worst day, not the demo." },
];

export default function About() {
  return (
    <div style={{ minHeight: "100vh", background: "#FFFBF7", color: "#1D1832", fontFamily: "'Instrument Sans',sans-serif" }}>
      <Ticker />
      <Navbar />

      <div data-screen-label="About" style={{ maxWidth: "1180px", margin: "0 auto", padding: "72px 32px 96px" }}>
        <div style={{ maxWidth: "680px" }}>
          <div style={{ font: "600 12.5px 'JetBrains Mono',monospace", color: "#D6336C", letterSpacing: "1.6px", marginBottom: "16px" }}>ABOUT</div>
          <h1 style={{ margin: "0 0 20px", font: "800 50px/1.04 'Bricolage Grotesque',sans-serif", letterSpacing: "-2.2px", textWrap: "pretty" }}>The price of a belief should be a public good</h1>
          <p style={{ color: "#6E6787", fontSize: "17.5px", lineHeight: "1.65", margin: "0 0 12px" }}>Markets are the most reliable forecasting instruments available — but operating one carries significant regulatory, financial, and engineering complexity. Probable exists to make launching a prediction market as straightforward as accepting a card payment.</p>
          <p style={{ color: "#6E6787", fontSize: "17.5px", lineHeight: "1.65", margin: 0 }}>Our rails settle prediction market volumes directly on Polygon mainnet — utilizing non-custodial wallet infrastructure, automated token allowances, and regulatory-compliant rails.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", margin: "56px 0" }}>
          {aboutStats.map((a, i) => (
            <div key={i} style={{ background: `linear-gradient(135deg, ${a.g1}, ${a.g2})`, borderRadius: "18px", padding: "26px" }}>
              <div style={{ font: "600 30px 'JetBrains Mono',monospace", letterSpacing: "-2px", marginBottom: "6px" }}>{a.value}</div>
              <div style={{ fontSize: "13.5px", color: "#4A4363" }}>{a.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>
          <div>
            <h2 style={{ margin: "0 0 24px", font: "800 32px 'Bricolage Grotesque',sans-serif", letterSpacing: "-1.2px" }}>How we work</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              {values.map((v, i) => (
                <div key={i} style={{ display: "flex", gap: "16px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: v.bg, display: "flex", alignItems: "center", justifyContent: "center", font: "700 15px 'JetBrains Mono',monospace", color: v.color, flex: "none" }}>{v.n}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "16.5px", marginBottom: "5px" }}>{v.title}</div>
                    <div style={{ color: "#6E6787", fontSize: "14.5px", lineHeight: "1.6" }}>{v.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div id="careers">
            <h2 style={{ margin: "0 0 24px", font: "800 32px 'Bricolage Grotesque',sans-serif", letterSpacing: "-1.2px" }}>Careers</h2>
            <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "28px", lineHeight: 1.6 }}>
              <p style={{ margin: "0 0 16px", fontSize: "14.5px", color: "#6E6787" }}>
                We are a lean, remote-first team building the next generation of settlement and compliance infrastructure for prediction markets. We write TypeScript, Go, Solidity, and manage RPC nodes.
              </p>
              <p style={{ margin: "0 0 20px", fontSize: "14.5px", color: "#6E6787" }}>
                We hire opportunistically for exceptional engineers and designers who enjoy working at the intersection of DeFi protocols and API infrastructure.
              </p>
              <a href="mailto:team@probable.xyz" style={{ display: "inline-block", background: "#1D1633", color: "#fff", textDecoration: "none", font: "700 14px 'Instrument Sans'", padding: "12px 24px", borderRadius: "10px", transition: "opacity 0.2s" }}>
                Get in touch →
              </a>
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
