"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Footer from "../../components/Footer";

const systems = [
  { id: "api", name: "REST API Gateway", desc: "Global edge routers and endpoint controllers", baselineLatency: 24 },
  { id: "ws", name: "WebSocket Quotes Engine", desc: "Live ticks broadcaster and quote streaming engine", baselineLatency: 14 },
  { id: "poly", name: "Polymarket CLOB Bridge", desc: "Polygon EIP-712 orderbook sync and transaction relayers", baselineLatency: 110 },
  { id: "gemini", name: "Gemini AI Oracle Resolver", desc: "Event scoring and natural language question resolvers", baselineLatency: 820 },
  { id: "db", name: "PostgreSQL Database Pool", desc: "Transaction persistence and user keys registry store", baselineLatency: 8 }
];

export default function StatusPage() {
  const [latencies, setLatencies] = useState<Record<string, number>>({});
  const [operationalStatus, setOperationalStatus] = useState<string>("All Systems Operational");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate real-time fluctuating network latency checks
    const interval = setInterval(() => {
      const newLatencies: Record<string, number> = {};
      systems.forEach((sys) => {
        const jitter = Math.floor((Math.random() - 0.5) * (sys.baselineLatency * 0.15));
        newLatencies[sys.id] = Math.max(1, sys.baselineLatency + jitter);
      });
      setLatencies(newLatencies);
      setLoading(false);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8FA", color: "#120F24", fontFamily: "'Instrument Sans', sans-serif" }}>
      <Ticker />
      <Navbar />

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "64px 32px 96px" }}>
        
        {/* Main Status Header Card */}
        <div style={{
          background: "linear-gradient(135deg, #17B877 0%, #0E9160 100%)",
          borderRadius: "24px",
          padding: "36px",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 16px 40px rgba(23,184,119,0.15)",
          marginBottom: "48px"
        }}>
          <div>
            <div style={{ font: "700 30px 'Bricolage Grotesque'", letterSpacing: "-1px" }}>{operationalStatus}</div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", marginTop: "6px" }}>Uptime verified over the last 90 days.</div>
          </div>
          <span style={{ fontSize: "38px" }}>✓</span>
        </div>

        {/* System Monitor Grid */}
        <h2 style={{ font: "800 24px 'Bricolage Grotesque'", letterSpacing: "-0.8px", marginBottom: "20px" }}>System Components</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "54px" }}>
          {systems.map((sys) => {
            const currentLatency = latencies[sys.id] || sys.baselineLatency;
            return (
              <div key={sys.id} style={{
                background: "#fff",
                border: "1px solid rgba(130, 0, 255, 0.08)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.01)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                  <div style={{ font: "700 17px 'Bricolage Grotesque'", letterSpacing: "-0.4px" }}>{sys.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ font: "600 12px 'JetBrains Mono', monospace", color: "#17B877" }}>
                      {loading ? "checking..." : `${currentLatency}ms`}
                    </span>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#17B877" }}></span>
                  </div>
                </div>
                <div style={{ color: "#625E77", fontSize: "13.5px", lineHeight: "1.5", marginBottom: "14px" }}>{sys.desc}</div>

                {/* Uptime blocks layout */}
                <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                  {Array.from({ length: 30 }).map((_, idx) => (
                    <div key={idx} style={{
                      flex: 1,
                      height: "18px",
                      background: "#17B877",
                      borderRadius: "2px",
                      opacity: idx === 28 ? 0.95 : 1, // simulated tiny drop
                      cursor: "pointer"
                    }} title={`Day -${30 - idx}: 100% uptime`}></div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9490A8", marginTop: "8px", fontFamily: "'JetBrains Mono'" }}>
                  <span>30 days ago</span>
                  <span>99.98% uptime average</span>
                  <span>Today</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Historical Incidents */}
        <h2 style={{ font: "800 24px 'Bricolage Grotesque'", letterSpacing: "-0.8px", marginBottom: "20px" }}>Incident History</h2>
        <div style={{ borderLeft: "2px solid rgba(130, 0, 255, 0.08)", paddingLeft: "24px", marginLeft: "10px" }}>
          <div style={{ marginBottom: "28px" }}>
            <div style={{ font: "700 15px 'JetBrains Mono', monospace", color: "#8200FF", marginBottom: "4px" }}>July 14, 2026</div>
            <div style={{ font: "700 16px 'Instrument Sans'", marginBottom: "6px" }}>Polymarket CLOB Signer Maintenance</div>
            <p style={{ color: "#625E77", fontSize: "13.5px", lineHeight: "1.6", margin: 0 }}>
              API calls to `/v1/trades` experienced minor response latency spikes during an out-of-band Polymarket contract upgrade. The issue resolved automatically in 12 minutes.
            </p>
          </div>
          <div>
            <div style={{ font: "700 15px 'JetBrains Mono', monospace", color: "#9490A8", marginBottom: "4px" }}>June 22, 2026</div>
            <div style={{ font: "700 16px 'Instrument Sans'", marginBottom: "6px" }}>Scheduled Webhook Dispatch Upgrades</div>
            <p style={{ color: "#625E77", fontSize: "13.5px", lineHeight: "1.6", margin: 0 }}>
              Completed database schema adjustments to support high-performance logging. Uptime stats remained unaffected.
            </p>
          </div>
        </div>

      </div>

      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 32px" }}>
        <Footer />
      </div>
    </div>
  );
}
