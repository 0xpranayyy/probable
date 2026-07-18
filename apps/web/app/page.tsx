"use client";

import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Ticker from "../components/Ticker";
import Link from "next/link";
import ProbableEmbed from "../components/ProbableEmbed";
import Footer from "../components/Footer";

const heroMarkets = [
  { cat: "CRYPTO", catColor: "#FF8FB5", q: "Will Ethereum reach $5k by Q3?", spark: "M0 16 Q20 5, 40 18 T100 8", sparkColor: "#FF8FB5", yesStr: "38", noStr: "62", vol: "$1.2M Vol" },
  { cat: "POLITICS", catColor: "#3ADFA5", q: "Next UK Prime Minister?", spark: "M0 24 Q25 24, 50 12 T100 4", sparkColor: "#3ADFA5", yesStr: "71", noStr: "29", vol: "$840K Vol" },
  { cat: "AI", catColor: "#FFCB8E", q: "OpenAI IPO in 2025?", spark: "M0 8 Q30 20, 60 10 T100 22", sparkColor: "#FFCB8E", yesStr: "12", noStr: "88", vol: "$2.1M Vol" },
];

const trustBar = [
  { value: "50ms", label: "Global latency", sub: "Optimized routing" },
  { value: "0", label: "Failed trades", sub: "Atomic settlement" },
  { value: "SOC 2", label: "Type II certified", sub: "Enterprise grade" },
  { value: "24/7", label: "Expert support", sub: "Dedicated engineers" }
];

const features = [
  { glyph: "R", iconBg: "rgba(130,0,255,.15)", iconColor: "#8200FF", title: "Rails", body: "Instant fiat and crypto settlement. We handle KYC, payments, and global compliance.", link: "View settlement docs" },
  { glyph: "E", iconBg: "rgba(255,92,35,.15)", iconColor: "#0E9160", title: "Embeds", body: "Drop live markets into your app with one line of code. Fully customizable UI.", link: "See the widget gallery" },
  { glyph: "S", iconBg: "rgba(255,203,142,.15)", iconColor: "#D4491F", title: "Shield", body: "Automated wash trading prevention and market manipulation monitoring.", link: "Read about compliance" }
];

export default function Home() {
  const [startHover, setStartHover] = useState(false);
  const [exploreHover, setExploreHover] = useState(false);
  const [docsHover, setDocsHover] = useState(false);
  const [onboardHover, setOnboardHover] = useState(false);

  // Tab State: "widget" | "playground"
  const [activeHeroTab, setActiveHeroTab] = useState<"widget" | "playground">("widget");

  // Playground states
  const [playAmount, setPlayAmount] = useState<number>(25);
  const [playSide, setPlaySide] = useState<"YES" | "NO">("YES");
  const [playMarket] = useState<string>("mkt_btc_150k");

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8FA", color: "#120F24", fontFamily: "'Instrument Sans',sans-serif" }}>
      <Ticker />
      <Navbar />

      <div data-screen-label="Home">
        <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(160deg,#F3EBFF 0%,#F8F8FA 38%,#EAF0FF 68%,#FDEAF6 100%)" }}>
          <div style={{ position: "absolute", width: "560px", height: "560px", borderRadius: "50%", background: "radial-gradient(circle,rgba(130,0,255,.16),transparent 70%)", top: "-220px", right: "2%", animation: "drift 18s ease-in-out infinite", filter: "blur(10px)" }}></div>
          <div style={{ position: "absolute", width: "460px", height: "460px", borderRadius: "50%", background: "radial-gradient(circle,rgba(255,92,35,.12),transparent 70%)", bottom: "-160px", left: "0%", animation: "drift 22s ease-in-out infinite reverse", filter: "blur(10px)" }}></div>

          {/* CENTERED HERO TEXT */}
          <div style={{ position: "relative", maxWidth: "780px", margin: "0 auto", padding: "96px 32px 0", textAlign: "center", animation: "fadeUp .7s ease both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(130,0,255,.08)", color: "#8200FF", font: "600 12.5px 'JetBrains Mono',monospace", letterSpacing: "1px", padding: "7px 16px", borderRadius: "999px", marginBottom: "24px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#8200FF" }}></span>
              THE INFRASTRUCTURE LAYER FOR PREDICTION MARKETS
            </div>
            <h1 style={{ margin: "0 0 20px", font: "500 64px/1.02 'Bricolage Grotesque',sans-serif", letterSpacing: "-2.8px", color: "#120F24", textWrap: "pretty" as any }}>
              <span style={{ fontWeight: 800 }}>Embed</span> markets.
            </h1>
            <p style={{ margin: "0 auto 36px", fontSize: "19px", lineHeight: "1.55", color: "#625E77", maxWidth: "520px", textWrap: "pretty" as any }}>
              One integration, one API, one dashboard. Probable is the fully connected rails layer that helps you stream live markets, settle in real USDC, and ship, better.
            </p>
            <div style={{ display: "flex", gap: "14px", alignItems: "center", justifyContent: "center" }}>
              <Link
                href="/onboard"
                onMouseEnter={() => setStartHover(true)} onMouseLeave={() => setStartHover(false)}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "#120F24", border: "none", color: "#fff", font: "700 16px 'Instrument Sans',sans-serif", padding: "15px 30px", borderRadius: "999px", cursor: "pointer", transition: "all .2s", transform: startHover ? "translateY(-2px)" : "none", boxShadow: startHover ? "0 12px 30px rgba(18,15,36,.3)" : "none", textDecoration: "none" }}>
                Get started <span style={{ color: "#B3A8D9" }}>→</span>
              </Link>
              <Link
                href="/product"
                onMouseEnter={() => setExploreHover(true)} onMouseLeave={() => setExploreHover(false)}
                style={{ background: exploreHover ? "#fff" : "rgba(255,255,255,.7)", border: "1px solid rgba(130,0,255,.18)", color: "#120F24", font: "700 16px 'Instrument Sans',sans-serif", padding: "15px 28px", borderRadius: "999px", cursor: "pointer", backdropFilter: "blur(6px)", transition: "background .2s", textDecoration: "none" }}>
                Explore the platform
              </Link>
            </div>
          </div>

          {/* LAYERED DASHBOARD PREVIEW */}
          <div style={{ position: "relative", maxWidth: "1040px", margin: "72px auto 0", padding: "0 32px 0", animation: "fadeUp .7s .15s ease both" }}>
            <div className="hero-preview-stage" style={{ position: "relative", height: "420px" }}>
              {/* Back panel: live embed widget */}
              <div className="hero-back-panel" style={{ position: "absolute", left: "0", top: "70px", width: "300px", zIndex: 1, filter: "drop-shadow(0 30px 60px rgba(18,15,36,.14))" }}>
                <div style={{ background: "#fff", border: "1px solid rgba(130,0,255,.1)", borderRadius: "16px 16px 0 0", padding: "10px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(18,15,36,.12)" }}></span>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(18,15,36,.12)" }}></span>
                  <span style={{ font: "600 11px 'JetBrains Mono',monospace", color: "#9490A8", marginLeft: "6px" }}>probable.embed</span>
                </div>
                <ProbableEmbed marketId="mkt_btc_150k" theme="light" />
              </div>

              {/* Front panel: dashboard preview */}
              <div className="hero-front-panel" style={{ position: "absolute", right: "0", top: "0", width: "680px", maxWidth: "100%", zIndex: 2, background: "#fff", border: "1px solid rgba(130,0,255,.1)", borderRadius: "18px", boxShadow: "0 40px 90px rgba(18,15,36,.16)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid rgba(130,0,255,.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#8200FF" }}></span>
                    <span style={{ font: "700 14px 'Bricolage Grotesque'", color: "#120F24" }}>Probable Dashboard</span>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", font: "600 10.5px 'JetBrains Mono',monospace", color: "#0E9160", background: "rgba(23,184,119,.1)", padding: "4px 10px", borderRadius: "999px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#17B877", animation: "pulse 2s infinite" }}></span>LIVE
                  </span>
                </div>
                <div style={{ padding: "22px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
                  <div style={{ background: "#F8F8FA", border: "1px solid rgba(130,0,255,.06)", borderRadius: "12px", padding: "14px 16px" }}>
                    <div style={{ font: "600 10px 'JetBrains Mono',monospace", color: "#9490A8", letterSpacing: "1px", marginBottom: "6px" }}>TOTAL LIVE MARKETS</div>
                    <div style={{ font: "600 22px 'JetBrains Mono',monospace", color: "#120F24" }}>1,340+</div>
                  </div>
                  <div style={{ background: "#F8F8FA", border: "1px solid rgba(130,0,255,.06)", borderRadius: "12px", padding: "14px 16px" }}>
                    <div style={{ font: "600 10px 'JetBrains Mono',monospace", color: "#9490A8", letterSpacing: "1px", marginBottom: "6px" }}>SETTLED (24H)</div>
                    <div style={{ font: "600 22px 'JetBrains Mono',monospace", color: "#120F24" }}>$2.4M</div>
                  </div>
                  <div style={{ background: "rgba(130,0,255,.06)", border: "1px solid rgba(130,0,255,.12)", borderRadius: "12px", padding: "14px 16px" }}>
                    <div style={{ font: "600 10px 'JetBrains Mono',monospace", color: "#8200FF", letterSpacing: "1px", marginBottom: "6px" }}>MEDIAN QUOTE</div>
                    <div style={{ font: "600 22px 'JetBrains Mono',monospace", color: "#8200FF" }}>14ms</div>
                  </div>
                </div>
                <div style={{ padding: "0 22px 22px" }}>
                  {heroMarkets.map((m, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 4px", borderTop: i === 0 ? "1px solid rgba(130,0,255,.06)" : "none", borderBottom: i < heroMarkets.length - 1 ? "1px solid rgba(130,0,255,.06)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <span style={{ font: "600 9.5px 'JetBrains Mono',monospace", color: m.catColor, background: "rgba(130,0,255,.06)", padding: "3px 8px", borderRadius: "999px", flex: "none" }}>{m.cat}</span>
                        <span style={{ font: "600 13px 'Instrument Sans'", color: "#120F24", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.q}</span>
                      </div>
                      <span style={{ font: "600 13px 'JetBrains Mono',monospace", color: "#0E9160", flex: "none" }}>{m.yesStr}¢</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TRUST BAR */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "56px 32px 20px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
          {trustBar.map((tb, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid rgba(130,0,255,.08)", borderRadius: "16px", padding: "20px 22px" }}>
              <div style={{ font: "600 22px 'JetBrains Mono',monospace", letterSpacing: "-1px", marginBottom: "5px", color: "#120F24" }}>{tb.value}</div>
              <div style={{ fontWeight: 600, fontSize: "13.5px", marginBottom: "3px", color: "#120F24" }}>{tb.label}</div>
              <div style={{ fontSize: "12px", color: "#9490A8" }}>{tb.sub}</div>
            </div>
          ))}
        </div>

        {/* PRIMITIVES */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "88px 32px 40px" }}>
          <div style={{ font: "600 12.5px 'JetBrains Mono',monospace", color: "#8200FF", letterSpacing: "1.6px", marginBottom: "16px" }}>THE PLATFORM</div>
          <h2 style={{ margin: "0 0 16px", font: "800 44px/1.06 'Bricolage Grotesque',sans-serif", letterSpacing: "-1.8px", maxWidth: "620px" }}>Everything between a question and a payout</h2>
          <p style={{ margin: "0 0 52px", color: "#625E77", fontSize: "17px", maxWidth: "540px", lineHeight: "1.6" }}>Three primitives compose into any prediction-market product — from one embedded widget to a full exchange.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid rgba(130,0,255,.08)", borderRadius: "18px", padding: "30px", transition: "all .25s", cursor: "pointer" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "13px", background: f.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "22px", font: "700 17px 'JetBrains Mono',monospace", color: f.iconColor }}>{f.glyph}</div>
                <div style={{ font: "700 20px 'Bricolage Grotesque',sans-serif", marginBottom: "10px", letterSpacing: "-.4px" }}>{f.title}</div>
                <div style={{ color: "#625E77", fontSize: "14.5px", lineHeight: "1.62" }}>{f.body}</div>
                <div style={{ marginTop: "20px", font: "600 13.5px 'Instrument Sans',sans-serif", color: "#8200FF" }}>{f.link} →</div>
              </div>
            ))}
          </div>
        </div>

        {/* CODE */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "72px 32px 96px", display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "60px", alignItems: "center" }}>
          <div>
            <div style={{ font: "600 12.5px 'JetBrains Mono',monospace", color: "#0E9160", letterSpacing: "1.6px", marginBottom: "16px" }}>DEVELOPER FIRST</div>
            <h2 style={{ margin: "0 0 16px", font: "800 40px/1.08 'Bricolage Grotesque',sans-serif", letterSpacing: "-1.6px" }}>Markets as easy as payments</h2>
            <p style={{ color: "#625E77", fontSize: "16.5px", lineHeight: "1.65", margin: "0 0 28px" }}>Create a market, stream quotes, settle outcomes. Escrow, oracle resolution, and regulatory reporting run under the hood — you ship product.</p>
            <button 
              onMouseEnter={() => setDocsHover(true)} onMouseLeave={() => setDocsHover(false)}
              style={{ background: "#fff", border: "1px solid", borderColor: docsHover ? "#8200FF" : "rgba(130,0,255,.16)", color: docsHover ? "#8200FF" : "#120F24", font: "700 15px 'Instrument Sans',sans-serif", padding: "13px 24px", borderRadius: "999px", cursor: "pointer", transition: "all .2s" }}>
              Read the docs →
            </button>
          </div>
          <div style={{ background: "#120F24", borderRadius: "18px", overflow: "hidden", boxShadow: "0 30px 70px rgba(18,15,36,.35)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
              <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#8200FF" }}></span>
              <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#FF5C23" }}></span>
              <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#17B877" }}></span>
              <span style={{ marginLeft: "10px", font: "500 12px 'JetBrains Mono',monospace", color: "#8B84A3" }}>create_market.js</span>
            </div>
            <pre style={{ margin: 0, padding: "24px 26px", font: "500 13.5px/1.8 'JetBrains Mono',monospace", color: "#C9C2E0", overflowX: "auto" }}>
              <code>
                <span style={{ color: "#FF8FB5" }}>const</span> <span style={{ color: "#9ECBFF" }}>market</span> = <span style={{ color: "#FF8FB5" }}>await</span> probable.markets.<span style={{ color: "#FFCB8E" }}>create</span>({`{`}<br/>
                {"  "}<span style={{ color: "#B9AEDB" }}>question</span>: <span style={{ color: "#3ADFA5" }}>"Will BTC close above $150k in 2026?"</span>,<br/>
                {"  "}<span style={{ color: "#B9AEDB" }}>closes</span>: <span style={{ color: "#3ADFA5" }}>"2026-12-31T23:59:59Z"</span>,<br/>
                {"  "}<span style={{ color: "#B9AEDB" }}>oracle</span>: <span style={{ color: "#3ADFA5" }}>"oracle:consensus"</span>,<br/>
                {"  "}<span style={{ color: "#B9AEDB" }}>liquidity</span>: {`{`} <span style={{ color: "#B9AEDB" }}>seed</span>: <span style={{ color: "#FFCB8E" }}>50_000</span> {`}`}<br/>
                {`}`});<br/>
                <span style={{ color: "#6E6489" }}>// → live in 14ms, quotes streaming</span>
              </code>
            </pre>
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: "linear-gradient(115deg,#F3EBFF,#EAF0FF)", clipPath: "polygon(0 12%,100% 0,100% 100%,0 100%)", marginBottom: "40px" }}>
          <div style={{ maxWidth: "760px", margin: "0 auto", padding: "120px 32px 96px", textAlign: "center" }}>
            <h2 style={{ margin: "0 0 16px", font: "800 46px/1.05 'Bricolage Grotesque',sans-serif", letterSpacing: "-2px" }}>Launch your first market today</h2>
            <p style={{ color: "#625E77", fontSize: "17px", margin: "0 0 32px" }}>Start in the sandbox. Move to production when you're ready.</p>
            <Link 
              href="/onboard"
              onMouseEnter={() => setOnboardHover(true)} onMouseLeave={() => setOnboardHover(false)}
              style={{ display: "inline-block", background: "#8200FF", border: "none", color: "#fff", font: "700 16px 'Instrument Sans',sans-serif", padding: "16px 34px", borderRadius: "999px", cursor: "pointer", transition: "all .2s", transform: onboardHover ? "translateY(-2px)" : "none", boxShadow: onboardHover ? "0 14px 34px rgba(130,0,255,.35)" : "none", textDecoration: "none" }}>
              Get your API keys <span style={{ color: "#fff", opacity: 0.85 }}>→</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
