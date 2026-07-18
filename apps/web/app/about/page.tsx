"use client";

import React from "react";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Footer from "../../components/Footer";

const aboutStats = [
  { value: "$2.4B", label: "settled annually", g1: "#FFE3EC", g2: "#FFEFDD" },
  { value: "212", label: "people across 3 offices", g1: "#E8FBF1", g2: "#EFE9FF" },
  { value: "4,900+", label: "platforms building on us", g1: "#EFE9FF", g2: "#FFE3EC" },
  { value: "38", label: "jurisdictions covered", g1: "#FFEFDD", g2: "#E8FBF1" },
];

const values = [
  { n: "01", bg: "rgba(240,86,140,.12)", color: "#D6336C", title: "The price is the product", body: "Every feature exists to make market prices more accurate, more liquid, and more available." },
  { n: "02", bg: "rgba(23,184,119,.12)", color: "#0E9160", title: "Compliance is a feature", body: "We treat regulation as a design constraint, not an obstacle. Shield exists so our customers sleep." },
  { n: "03", bg: "rgba(122,69,153,.12)", color: "#7A4599", title: "Reliability is the brand", body: "Settlement infrastructure earns trust in years and loses it in seconds. We engineer for the worst day, not the demo." },
];

const roles = [
  { title: "Staff Engineer, Settlement", team: "Rails", loc: "SF / Remote" },
  { title: "Product Designer, Embeds", team: "Design", loc: "NYC" },
  { title: "Regulatory Counsel", team: "Shield", loc: "London" },
  { title: "Quant, Market Microstructure", team: "Liquidity", loc: "NYC" },
  { title: "Developer Advocate", team: "DevRel", loc: "Remote" },
];

export default function About() {
  return (
    <div style={{ minHeight: "100vh", background: "#FFFBF7", color: "#1D1832", fontFamily: "'Instrument Sans',sans-serif" }}>
      <Ticker />
      <Navbar />

      <div data-screen-label="About" style={{ maxWidth: "1180px", margin: "0 auto", padding: "72px 32px 96px" }}>
        <div style={{ maxWidth: "680px" }}>
          <div style={{ font: "600 12.5px 'JetBrains Mono',monospace", color: "#D6336C", letterSpacing: "1.6px", marginBottom: "16px" }}>ABOUT</div>
          <h1 style={{ margin: "0 0 20px", font: "800 50px/1.04 'Bricolage Grotesque',sans-serif", letterSpacing: "-2.2px", textWrap: "pretty" as any }}>The price of a belief should be a public good</h1>
          <p style={{ color: "#6E6787", fontSize: "17.5px", lineHeight: "1.65", margin: "0 0 12px" }}>Markets are the most reliable forecasting instruments available — but operating one carries significant regulatory, financial, and engineering complexity. Probable exists to make launching a prediction market as straightforward as accepting a card payment.</p>
          <p style={{ color: "#6E6787", fontSize: "17.5px", lineHeight: "1.65", margin: 0 }}>Our rails settle $2.4B a year for sportsbooks, media platforms, brokerages, and research institutions — on shared liquidity infrastructure and a purpose-built compliance engine.</p>
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
            <h2 style={{ margin: "0 0 24px", font: "800 32px 'Bricolage Grotesque',sans-serif", letterSpacing: "-1.2px" }}>Open roles</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {roles.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "14px", padding: "17px 22px", cursor: "pointer", transition: "all .2s" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15.5px" }}>{r.title}</div>
                    <div style={{ fontSize: "12.5px", color: "#A9A2BE", marginTop: "3px" }}>{r.team} · {r.loc}</div>
                  </div>
                  <span style={{ color: "#D6336C", fontWeight: 700 }}>→</span>
                </div>
              ))}
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
