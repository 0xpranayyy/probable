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
  { glyph: "R", iconBg: "rgba(255,143,181,.15)", iconColor: "#D6336C", title: "Rails", body: "Instant fiat and crypto settlement. We handle KYC, payments, and global compliance.", link: "View settlement docs" },
  { glyph: "E", iconBg: "rgba(58,223,165,.15)", iconColor: "#0E9160", title: "Embeds", body: "Drop live markets into your app with one line of code. Fully customizable UI.", link: "See the widget gallery" },
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
    <div style={{ minHeight: "100vh", background: "#FFFBF7", color: "#1D1832", fontFamily: "'Instrument Sans',sans-serif" }}>
      <Ticker />
      <Navbar />

      <div data-screen-label="Home">
        <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(115deg,#FFE3EC 0%,#FFEFDD 34%,#E8FBF1 66%,#EFE9FF 100%)", clipPath: "polygon(0 0,100% 0,100% 88%,0 100%)" }}>
          <div style={{ position: "absolute", width: "520px", height: "520px", borderRadius: "50%", background: "radial-gradient(circle,rgba(255,143,181,.5),transparent 70%)", top: "-180px", right: "6%", animation: "drift 16s ease-in-out infinite", filter: "blur(10px)" }}></div>
          <div style={{ position: "absolute", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle,rgba(58,223,165,.35),transparent 70%)", bottom: "-120px", left: "2%", animation: "drift 20s ease-in-out infinite reverse", filter: "blur(10px)" }}></div>
          
          <div style={{ position: "relative", maxWidth: "1180px", margin: "0 auto", padding: "88px 32px 130px", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: "60px", alignItems: "start" }}>
            <div style={{ animation: "fadeUp .7s ease both", paddingTop: "16px" }}>
              <h1 style={{ margin: "0 0 24px", font: "800 62px/1.0 'Bricolage Grotesque',sans-serif", letterSpacing: "-2.6px", textWrap: "pretty" as any }}>Financial infrastructure for prediction markets</h1>
              <p style={{ margin: "0 0 36px", fontSize: "19px", lineHeight: "1.55", color: "#4A4363", maxWidth: "500px", textWrap: "pretty" as any }}>Settlement rails, embeddable markets, and built-in compliance — one API. Add live event markets to your product the way you'd add a checkout.</p>
              
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <Link 
                  href="/docs"
                  onMouseEnter={() => setStartHover(true)} onMouseLeave={() => setStartHover(false)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1D1633", border: "none", color: "#fff", font: "700 16px 'Instrument Sans',sans-serif", padding: "15px 28px", borderRadius: "999px", cursor: "pointer", transition: "all .2s", transform: startHover ? "translateY(-2px)" : "none", boxShadow: startHover ? "0 12px 30px rgba(29,22,51,.3)" : "none", textDecoration: "none" }}>
                  Start building <span style={{ color: "#FF8FB5" }}>→</span>
                </Link>
                <Link 
                  href="/product"
                  onMouseEnter={() => setExploreHover(true)} onMouseLeave={() => setExploreHover(false)}
                  style={{ background: exploreHover ? "#fff" : "rgba(255,255,255,.7)", border: "1px solid rgba(29,24,50,.14)", color: "#1D1832", font: "700 16px 'Instrument Sans',sans-serif", padding: "15px 28px", borderRadius: "999px", cursor: "pointer", backdropFilter: "blur(6px)", transition: "background .2s", textDecoration: "none" }}>
                  Explore the platform
                </Link>
              </div>
              
              <div style={{ display: "flex", gap: "36px", marginTop: "52px" }}>
                <div><div style={{ font: "600 27px 'JetBrains Mono',monospace", letterSpacing: "-1.5px" }}>$2.4B</div><div style={{ fontSize: "13.5px", color: "#6E6787", marginTop: "3px" }}>settled to date</div></div>
                <div style={{ width: "1px", background: "rgba(29,24,50,.12)" }}></div>
                <div><div style={{ font: "600 27px 'JetBrains Mono',monospace", letterSpacing: "-1.5px" }}>99.99%</div><div style={{ fontSize: "13.5px", color: "#6E6787", marginTop: "3px" }}>payout uptime</div></div>
                <div style={{ width: "1px", background: "rgba(29,24,50,.12)" }}></div>
                <div><div style={{ font: "600 27px 'JetBrains Mono',monospace", letterSpacing: "-1.5px" }}>14ms</div><div style={{ fontSize: "13.5px", color: "#6E6787", marginTop: "3px" }}>median quote</div></div>
              </div>
            </div>
            
            {/* TABBED HERO PLAYGROUND WIDGET */}
            <div style={{ animation: "fadeUp .7s .15s ease both", width: "100%", maxWidth: "460px", justifySelf: "center" }}>
              {/* Tab Toggles */}
              <div style={{ display: "flex", gap: "6px", background: "rgba(29, 24, 50, 0.05)", padding: "4px", borderRadius: "10px", marginBottom: "14px" }}>
                <button 
                  onClick={() => setActiveHeroTab("widget")}
                  style={{ flex: 1, background: activeHeroTab === "widget" ? "#fff" : "transparent", border: "none", color: "#1D1832", font: "600 13px 'Instrument Sans',sans-serif", padding: "8px", borderRadius: "7px", cursor: "pointer", transition: "all 0.15s", boxShadow: activeHeroTab === "widget" ? "0 2px 8px rgba(0,0,0,0.05)" : "none" }}>
                  Live Widget Embed
                </button>
                <button 
                  onClick={() => setActiveHeroTab("playground")}
                  style={{ flex: 1, background: activeHeroTab === "playground" ? "#fff" : "transparent", border: "none", color: "#1D1832", font: "600 13px 'Instrument Sans',sans-serif", padding: "8px", borderRadius: "7px", cursor: "pointer", transition: "all 0.15s", boxShadow: activeHeroTab === "playground" ? "0 2px 8px rgba(0,0,0,0.05)" : "none" }}>
                  Interactive API Builder
                </button>
              </div>

              {activeHeroTab === "widget" ? (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <ProbableEmbed marketId="mkt_btc_150k" theme="dark" />
                </div>
              ) : (
                <div style={{ background: "#1D1633", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "26px", color: "#fff", fontFamily: "'Instrument Sans',sans-serif" }}>
                  <div style={{ font: "700 18px 'Bricolage Grotesque'", marginBottom: "16px", color: "#fff" }}>Interactive SDK Playground</div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#B9AEDB", fontWeight: 600, marginBottom: "5px" }}>
                        <span>TRADE AMOUNT</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#FF8FB5" }}>${playAmount} USDC</span>
                      </div>
                      <input 
                        type="range"
                        min="5"
                        max="500"
                        step="5"
                        value={playAmount}
                        onChange={(e) => setPlayAmount(parseInt(e.target.value))}
                        style={{ width: "100%", cursor: "pointer" }}
                      />
                    </div>

                    <div>
                      <div style={{ fontSize: "12px", color: "#B9AEDB", fontWeight: 600, marginBottom: "6px" }}>OUTCOME SIDE</div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                          onClick={() => setPlaySide("YES")}
                          style={{ flex: 1, background: playSide === "YES" ? "#17B877" : "rgba(255,255,255,0.05)", border: "none", color: "#fff", font: "700 13px 'Instrument Sans'", padding: "8px", borderRadius: "8px", cursor: "pointer" }}>
                          YES
                        </button>
                        <button 
                          onClick={() => setPlaySide("NO")}
                          style={{ flex: 1, background: playSide === "NO" ? "#D6336C" : "rgba(255,255,255,0.05)", border: "none", color: "#fff", font: "700 13px 'Instrument Sans'", padding: "8px", borderRadius: "8px", cursor: "pointer" }}>
                          NO
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ font: "600 10px 'JetBrains Mono',monospace", color: "#6E6489", letterSpacing: "1px", marginBottom: "6px" }}>GENERATED SDK CODE</div>
                  <pre style={{ background: "#0E0B1A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px", font: "500 11.5px/1.7 'JetBrains Mono',monospace", color: "#B9AEDB", margin: 0, overflowX: "auto" }}>
                    <code>
                      <span style={{ color: "#F0568C" }}>import</span> {`{ ProbableClient }`} <span style={{ color: "#F0568C" }}>from</span> <span style={{ color: "#3ADFA5" }}>"@probable/sdk"</span>;<br/>
                      <br/>
                      <span style={{ color: "#F0568C" }}>const</span> client = <span style={{ color: "#F0568C" }}>new</span> <span style={{ color: "#FFCB8E" }}>ProbableClient</span>({`{`}<br/>
                      {"  "}apiKey: <span style={{ color: "#3ADFA5" }}>"sk_live_..."</span><br/>
                      {`}`});<br/>
                      <br/>
                      <span style={{ color: "#6E6489" }}>// Execute transaction on Polygon network</span><br/>
                      <span style={{ color: "#F0568C" }}>await</span> client.trades.create({`{`}<br/>
                      {"  "}marketId: <span style={{ color: "#3ADFA5" }}>"{playMarket}"</span>,<br/>
                      {"  "}type: <span style={{ color: "#3ADFA5" }}>"{playSide}"</span>,<br/>
                      {"  "}amount: <span style={{ color: "#FFCB8E" }}>{playAmount}</span><br/>
                      {`}`});
                    </code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TRUST BAR */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "44px 32px 20px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
          {trustBar.map((tb, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "20px 22px" }}>
              <div style={{ font: "600 22px 'JetBrains Mono',monospace", letterSpacing: "-1px", marginBottom: "5px" }}>{tb.value}</div>
              <div style={{ fontWeight: 600, fontSize: "13.5px", marginBottom: "3px" }}>{tb.label}</div>
              <div style={{ fontSize: "12px", color: "#A9A2BE" }}>{tb.sub}</div>
            </div>
          ))}
        </div>

        {/* PRIMITIVES */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "88px 32px 40px" }}>
          <div style={{ font: "600 12.5px 'JetBrains Mono',monospace", color: "#D6336C", letterSpacing: "1.6px", marginBottom: "16px" }}>THE PLATFORM</div>
          <h2 style={{ margin: "0 0 16px", font: "800 44px/1.06 'Bricolage Grotesque',sans-serif", letterSpacing: "-1.8px", maxWidth: "620px" }}>Everything between a question and a payout</h2>
          <p style={{ margin: "0 0 52px", color: "#6E6787", fontSize: "17px", maxWidth: "540px", lineHeight: "1.6" }}>Three primitives compose into any prediction-market product — from one embedded widget to a full exchange.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "18px", padding: "30px", transition: "all .25s", cursor: "pointer" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "13px", background: f.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "22px", font: "700 17px 'JetBrains Mono',monospace", color: f.iconColor }}>{f.glyph}</div>
                <div style={{ font: "700 20px 'Bricolage Grotesque',sans-serif", marginBottom: "10px", letterSpacing: "-.4px" }}>{f.title}</div>
                <div style={{ color: "#6E6787", fontSize: "14.5px", lineHeight: "1.62" }}>{f.body}</div>
                <div style={{ marginTop: "20px", font: "600 13.5px 'Instrument Sans',sans-serif", color: "#D6336C" }}>{f.link} →</div>
              </div>
            ))}
          </div>
        </div>

        {/* CODE */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "72px 32px 96px", display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "60px", alignItems: "center" }}>
          <div>
            <div style={{ font: "600 12.5px 'JetBrains Mono',monospace", color: "#0E9160", letterSpacing: "1.6px", marginBottom: "16px" }}>DEVELOPER FIRST</div>
            <h2 style={{ margin: "0 0 16px", font: "800 40px/1.08 'Bricolage Grotesque',sans-serif", letterSpacing: "-1.6px" }}>Markets as easy as payments</h2>
            <p style={{ color: "#6E6787", fontSize: "16.5px", lineHeight: "1.65", margin: "0 0 28px" }}>Create a market, stream quotes, settle outcomes. Escrow, oracle resolution, and regulatory reporting run under the hood — you ship product.</p>
            <button 
              onMouseEnter={() => setDocsHover(true)} onMouseLeave={() => setDocsHover(false)}
              style={{ background: "#fff", border: "1px solid", borderColor: docsHover ? "#F0568C" : "rgba(29,24,50,.14)", color: docsHover ? "#D6336C" : "#1D1832", font: "700 15px 'Instrument Sans',sans-serif", padding: "13px 24px", borderRadius: "999px", cursor: "pointer", transition: "all .2s" }}>
              Read the docs →
            </button>
          </div>
          <div style={{ background: "#1D1633", borderRadius: "18px", overflow: "hidden", boxShadow: "0 30px 70px rgba(29,22,51,.35)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
              <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#FF8FB5" }}></span>
              <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#FFCB8E" }}></span>
              <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#3ADFA5" }}></span>
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
        <div style={{ background: "linear-gradient(115deg,#FFE3EC,#EFE9FF)", clipPath: "polygon(0 12%,100% 0,100% 100%,0 100%)", marginBottom: "40px" }}>
          <div style={{ maxWidth: "760px", margin: "0 auto", padding: "120px 32px 96px", textAlign: "center" }}>
            <h2 style={{ margin: "0 0 16px", font: "800 46px/1.05 'Bricolage Grotesque',sans-serif", letterSpacing: "-2px" }}>Launch your first market today</h2>
            <p style={{ color: "#4A4363", fontSize: "17px", margin: "0 0 32px" }}>Start in the sandbox. Move to production when you're ready.</p>
            <Link 
              href="/onboard"
              onMouseEnter={() => setOnboardHover(true)} onMouseLeave={() => setOnboardHover(false)}
              style={{ display: "inline-block", background: "#1D1633", border: "none", color: "#fff", font: "700 16px 'Instrument Sans',sans-serif", padding: "16px 34px", borderRadius: "999px", cursor: "pointer", transition: "all .2s", transform: onboardHover ? "translateY(-2px)" : "none", boxShadow: onboardHover ? "0 14px 34px rgba(29,22,51,.3)" : "none", textDecoration: "none" }}>
              Get your API keys <span style={{ color: "#FF8FB5" }}>→</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
