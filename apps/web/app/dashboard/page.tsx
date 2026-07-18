"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Footer from "../../components/Footer";
import { ProbableClient } from "@probable/sdk";

const sdk = new ProbableClient({ apiKey: "sk_test_4Jn8Wz1c", baseUrl: "http://localhost:3001" });

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [dbMarkets, setDbMarkets] = useState<any[]>([]);
  const [dbTrades, setDbTrades] = useState<any[]>([]);
  const [dbKeys, setDbKeys] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:3001/v1/health"); // default local checker

  // New Market Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newCloses, setNewCloses] = useState("");
  const [newOracle, setNewOracle] = useState("oracle:consensus");
  const [creatingMarket, setCreatingMarket] = useState(false);

  // Trade Executor State
  const [tradeAmount, setTradeAmount] = useState<string>("10");
  const [activeTradeMarketId, setActiveTradeMarketId] = useState<string | null>(null);
  const [activeTradeSide, setActiveTradeSide] = useState<"YES" | "NO" | null>(null);
  const [executingTrade, setExecutingTrade] = useState(false);
  const [tradeMessage, setTradeMessage] = useState("");

  // User Session state
  const [user, setUser] = useState<{ id: string; email: string; name: string; apiKey: string } | null>(null);

  // Fetch data from backend API
  const fetchData = async (userKey?: string) => {
    const activeKey = userKey || user?.apiKey;
    if (!activeKey) return;
    const userSdk = new ProbableClient({ apiKey: activeKey, baseUrl: "http://localhost:3001" });

    try {
      const marketsData = await userSdk.markets.list();
      setDbMarkets(marketsData);

      const tradesData = await userSdk.trades.list();
      setDbTrades(tradesData);

      const keysData = await userSdk.keys.list();
      setDbKeys(keysData);

      const logsData = await userSdk.webhooks.listLogs();
      setWebhookLogs(logsData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem("probable_user");
    if (cached) {
      const parsed = JSON.parse(cached);
      setUser(parsed);
      fetchData(parsed.apiKey);
    } else {
      setLoading(false);
    }
  }, []);

  const tabs = ["Overview", "Markets", "Payouts", "Compliance", "Developers"];

  const handleCreateKey = async () => {
    if (!user) return;
    const userSdk = new ProbableClient({ apiKey: user.apiKey, baseUrl: "http://localhost:3001" });
    try {
      const newKey = await userSdk.keys.create(user.id);
      setDbKeys(prev => [...prev, newKey]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion || !user) return;

    setCreatingMarket(true);
    const userSdk = new ProbableClient({ apiKey: user.apiKey, baseUrl: "http://localhost:3001" });
    try {
      await userSdk.markets.create({
        question: newQuestion,
        closes: newCloses || undefined,
        oracle: newOracle
      });

      // Refresh market list
      await fetchData();
      setIsModalOpen(false);
      setNewQuestion("");
      setNewCloses("");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error creating market.");
    } finally {
      setCreatingMarket(false);
    }
  };

  const handleExecuteTrade = async (marketId: string, side: "YES" | "NO") => {
    if (!user) return;
    setExecutingTrade(true);
    setTradeMessage("");
    const userSdk = new ProbableClient({ apiKey: user.apiKey, baseUrl: "http://localhost:3001" });
    try {
      await userSdk.trades.create({
        marketId,
        type: side,
        amount: parseFloat(tradeAmount),
        userId: user.id,
        webhookUrl: webhookUrl || undefined
      });

      setTradeMessage(`Bought ${tradeAmount} shares of ${side} successfully! Webhook dispatched.`);
      // Refresh trades, markets, and webhook logs list
      await fetchData();
      setTimeout(() => {
        setActiveTradeMarketId(null);
        setTradeMessage("");
      }, 1800);
    } catch (e: any) {
      setTradeMessage(`Error: ${e.message || "Trade failed"}`);
    } finally {
      setExecutingTrade(false);
    }
  };

  const formattedStats = [
    { label: "SETTLED (30D)", value: "$4.8M", delta: "+18.2%", deltaColor: "#0E9160" },
    { label: "OPEN INTEREST", value: `$${(dbMarkets.reduce((acc, m) => acc + m.liquidity, 0) / 1000000).toFixed(1)}M`, delta: "+4.1%", deltaColor: "#0E9160" },
    { label: "ACTIVE TRADERS", value: (28400 + dbTrades.length).toLocaleString(), delta: "+11.7%", deltaColor: "#0E9160" },
    { label: "TAKE RATE", value: "1.4%", delta: "-0.1pt", deltaColor: "#D4491F" }
  ];

  const mockPayouts = [
    { initials: "JM", who: "j.mercado@…", when: "2 min ago", amt: "+$1,204.50", avatarBg: "rgba(240,86,140,.12)", avatarColor: "#D6336C" },
    { initials: "AK", who: "a.kowalski@…", when: "9 min ago", amt: "+$88.20", avatarBg: "rgba(23,184,119,.12)", avatarColor: "#0E9160" },
    { initials: "TS", who: "t.suzuki@…", when: "14 min ago", amt: "+$3,410.00", avatarBg: "rgba(122,69,153,.12)", avatarColor: "#7A4599" }
  ];

  const mockKycQueue = [
    { user: "usr_88Kd", juris: "United States · NY", tier: "FULL", flag: "Document mismatch", status: "REVIEW", stColor: "#D4842A", stBg: "rgba(212,132,42,.1)", when: "12 min ago" },
    { user: "usr_23Fa", juris: "United Kingdom", tier: "BASIC", flag: "Velocity threshold", status: "REVIEW", stColor: "#D4842A", stBg: "rgba(212,132,42,.1)", when: "26 min ago" },
    { user: "usr_71Qn", juris: "France", tier: "FULL", flag: "Category exclusion", status: "BLOCKED", stColor: "#D4491F", stBg: "rgba(229,72,77,.1)", when: "58 min ago" }
  ];

  if (!user && !loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#FFFBF7", color: "#1D1832", fontFamily: "'Instrument Sans',sans-serif" }}>
        <Ticker />
        <Navbar />
        <div style={{ maxWidth: "550px", margin: "140px auto 180px", padding: "44px 38px", background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "24px", textAlign: "center", boxShadow: "0 20px 48px rgba(74,42,90,.05)" }}>
          <div style={{ display: "inline-flex", background: "rgba(240, 86, 140, 0.1)", color: "#F0568C", font: "600 12px 'JetBrains Mono'", padding: "6px 14px", borderRadius: "999px", marginBottom: "22px", letterSpacing: "0.8px" }}>RESTRICTED ACCESS</div>
          <h2 style={{ margin: "0 0 12px", font: "800 32px 'Bricolage Grotesque'", letterSpacing: "-1.2px" }}>Sign in to access your dashboard</h2>
          <p style={{ color: "#6E6787", fontSize: "15px", lineHeight: "1.6", margin: "0 0 28px" }}>
            To create custom prediction markets, buy Yes/No contract shares, generate sandbox API keys, and monitor webhooks, please authenticate.
          </p>
          <a href="/auth" style={{ display: "inline-block", background: "#1D1633", color: "#fff", font: "700 15px 'Instrument Sans'", padding: "13px 32px", borderRadius: "10px", textDecoration: "none" }}>
            Sign In / Sign Up →
          </a>
        </div>
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 32px" }}>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FFFBF7", color: "#1D1832", fontFamily: "'Instrument Sans',sans-serif" }}>
      <Ticker />
      <Navbar />

      <div data-screen-label="Dashboard" style={{ maxWidth: "1180px", margin: "0 auto", padding: "40px 32px 96px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1 style={{ margin: 0, font: "800 32px 'Bricolage Grotesque',sans-serif", letterSpacing: "-1.2px" }}>
                {user?.name || user?.email.split("@")[0] || "Acme Sportsbook"}
              </h1>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", font: "600 11px 'JetBrains Mono',monospace", color: "#0E9160", background: "rgba(23,184,119,.1)", border: "1px solid rgba(23,184,119,.3)", padding: "5px 12px", borderRadius: "999px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#17B877", animation: "pulse 2s infinite" }}></span>LIVE MODE
              </span>
            </div>
            <div style={{ color: "#6E6787", fontSize: "14px", marginTop: "6px" }}>
              ID: {user?.id || "acct_9K2mPx"} · Sandbox Account
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ background: "#1D1633", border: "none", color: "#fff", font: "600 14px 'Instrument Sans',sans-serif", padding: "11px 20px", borderRadius: "999px", cursor: "pointer" }}>
            + New market
          </button>
        </div>

        {/* Tabs Bar */}
        <div style={{ display: "flex", gap: "4px", margin: "24px 0 26px", borderBottom: "1px solid rgba(29,24,50,.09)" }}>
          {tabs.map((tab, i) => (
            <button 
              key={i} 
              onClick={() => setActiveTab(tab)} 
              style={{ background: "none", border: "none", borderBottom: activeTab === tab ? "2.5px solid #F0568C" : "2.5px solid transparent", color: activeTab === tab ? "#1D1832" : "#A9A2BE", font: "600 14px 'Instrument Sans',sans-serif", padding: "10px 16px", cursor: "pointer", marginBottom: "-1px" }}>
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", font: "600 16px 'Instrument Sans',sans-serif" }}>Loading dashboard analytics...</div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "Overview" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "22px" }}>
                  {formattedStats.map((s, i) => (
                    <div key={i} style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "20px 22px" }}>
                      <div style={{ font: "600 10.5px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1px", marginBottom: "10px" }}>{s.label}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                        <span style={{ font: "600 26px 'JetBrains Mono',monospace", letterSpacing: "-1.5px" }}>{s.value}</span>
                        <span style={{ font: "600 12px 'JetBrains Mono',monospace", color: s.deltaColor }}>{s.delta}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px", marginBottom: "22px" }}>
                  <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif", marginBottom: "18px" }}>Settled volume</div>
                    <svg width="100%" height="180" viewBox="0 0 600 180" preserveAspectRatio="none">
                      <path d="M0 150 L100 120 L200 130 L300 80 L400 90 L500 50 L600 40 L600 180 L0 180 Z" fill="url(#pgrad)" opacity="0.9"></path>
                      <path d="M0 150 L100 120 L200 130 L300 80 L400 90 L500 50 L600 40" fill="none" stroke="#F0568C" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round"></path>
                      <defs>
                        <linearGradient id="pgrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(240,86,140,.22)"></stop>
                          <stop offset="100%" stopColor="rgba(240,86,140,0)"></stop>
                        </linearGradient>
                      </defs>
                    </svg>
                    <div style={{ display: "flex", justifyContent: "space-between", font: "500 10.5px 'JetBrains Mono',monospace", color: "#A9A2BE", marginTop: "8px" }}>
                      <span>JUN 18</span><span>JUN 28</span><span>JUL 8</span><span>JUL 18</span>
                    </div>
                  </div>

                  {/* Recent Payouts */}
                  <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif", marginBottom: "16px" }}>Recent Payouts</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
                      {mockPayouts.map((po, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
                            <span style={{ width: "32px", height: "32px", borderRadius: "10px", background: po.avatarBg, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", font: "700 11px 'JetBrains Mono',monospace", color: po.avatarColor, flex: "none" }}>{po.initials}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: "13.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{po.who}</div>
                              <div style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#A9A2BE" }}>{po.when}</div>
                            </div>
                          </div>
                          <span style={{ font: "600 13.5px 'JetBrains Mono',monospace", color: "#0E9160", flex: "none" }}>{po.amt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active Markets Table */}
                <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 14px" }}>
                    <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif" }}>Active markets</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2.4fr .8fr .8fr 1fr .9fr", gap: "14px", padding: "10px 24px", font: "600 10.5px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1px", borderBottom: "1px solid rgba(29,24,50,.07)" }}>
                    <span>MARKET</span><span>YES</span><span>NO</span><span>LIQUIDITY</span><span>STATUS</span>
                  </div>
                  {dbMarkets.map((dm, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "2.4fr .8fr .8fr 1fr .9fr", gap: "14px", padding: "15px 24px", borderBottom: "1px solid rgba(29,24,50,.05)", alignItems: "center", fontSize: "14px" }}>
                      <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dm.question}</span>
                      <span style={{ font: "600 13.5px 'JetBrains Mono',monospace", color: "#0E9160" }}>50¢</span>
                      <span style={{ font: "600 13.5px 'JetBrains Mono',monospace", color: "#D4491F" }}>50¢</span>
                      <span style={{ font: "500 13.5px 'JetBrains Mono',monospace", color: "#6E6787" }}>${dm.liquidity.toLocaleString()}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", font: "600 11px 'JetBrains Mono',monospace", color: "#0E9160", background: "rgba(23,184,119,.1)", padding: "4px 11px", borderRadius: "999px", width: "fit-content" }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#0E9160" }}></span>{dm.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MARKETS TAB: Fully Live Trade Executor */}
            {activeTab === "Markets" && (
              <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr .6fr .6fr .8fr 1.6fr .9fr", gap: "12px", padding: "12px 24px", font: "600 10.5px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1px", borderBottom: "1px solid rgba(29,24,50,.07)" }}>
                  <span>MARKET</span><span>ORACLE</span><span>YES</span><span>NO</span><span>LIQUIDITY</span><span>BUY ACTION</span><span>STATUS</span>
                </div>
                {dbMarkets.map((dm, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr .6fr .6fr .8fr 1.6fr .9fr", gap: "12px", padding: "15px 24px", borderBottom: "1px solid rgba(29,24,50,.05)", alignItems: "center", fontSize: "13.5px" }}>
                    <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dm.question}</span>
                    <span style={{ font: "600 11px 'JetBrains Mono',monospace", color: "#7A4599" }}>{dm.oracleId}</span>
                    <span style={{ font: "600 13px 'JetBrains Mono',monospace", color: "#0E9160" }}>50¢</span>
                    <span style={{ font: "600 13px 'JetBrains Mono',monospace", color: "#D4491F" }}>50¢</span>
                    <span style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#6E6787" }}>${dm.liquidity.toLocaleString()}</span>
                    
                    {/* Inline Buy Form */}
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {activeTradeMarketId === dm.id ? (
                        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                          <input 
                            type="number"
                            value={tradeAmount}
                            onChange={(e) => setTradeAmount(e.target.value)}
                            disabled={executingTrade}
                            style={{ width: "50px", background: "#FFFBF7", border: "1px solid #1D2432", borderRadius: "5px", padding: "4px", font: "600 12px 'JetBrains Mono', monospace" }}
                          />
                          <button 
                            onClick={() => handleExecuteTrade(dm.id, activeTradeSide || "YES")}
                            disabled={executingTrade}
                            style={{ background: "#1D1633", border: "none", color: "#fff", font: "700 11px 'Instrument Sans'", padding: "5px 8px", borderRadius: "5px", cursor: "pointer" }}>
                            {executingTrade ? "..." : "Confirm"}
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => { setActiveTradeMarketId(dm.id); setActiveTradeSide("YES"); }}
                            style={{ background: "rgba(23,184,119,.1)", border: "1px solid rgba(23,184,119,.35)", color: "#0E9160", font: "700 11px 'JetBrains Mono',monospace", padding: "4px 8px", borderRadius: "6px", cursor: "pointer" }}>
                            YES
                          </button>
                          <button 
                            onClick={() => { setActiveTradeMarketId(dm.id); setActiveTradeSide("NO"); }}
                            style={{ background: "rgba(244,99,58,.08)", border: "1px solid rgba(244,99,58,.32)", color: "#D4491F", font: "700 11px 'JetBrains Mono',monospace", padding: "4px 8px", borderRadius: "6px", cursor: "pointer" }}>
                            NO
                          </button>
                        </>
                      )}
                    </div>

                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", font: "600 10.5px 'JetBrains Mono',monospace", color: "#0E9160", background: "rgba(23,184,119,.1)", padding: "4px 10px", borderRadius: "999px", width: "fit-content" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#0E9160" }}></span>{dm.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* PAYOUTS TAB */}
            {activeTab === "Payouts" && (
              <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 14px" }}>
                  <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif" }}>Order Execution history</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 2fr .8fr .9fr .9fr .8fr", gap: "12px", padding: "10px 24px", font: "600 10.5px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1px", borderBottom: "1px solid rgba(29,24,50,.07)" }}>
                  <span>TRADER</span><span>MARKET</span><span>TYPE</span><span>AMOUNT</span><span>PRICE</span><span>TIME</span>
                </div>
                {dbTrades.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "#A9A2BE" }}>No orders executed yet. Try buying a share in the Markets tab!</div>
                ) : (
                  dbTrades.map((pr, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 2fr .8fr .9fr .9fr .8fr", gap: "12px", padding: "15px 24px", borderBottom: "1px solid rgba(29,24,50,.05)", alignItems: "center", fontSize: "13.5px" }}>
                      <span style={{ fontWeight: 600 }}>{pr.userId}</span>
                      <span style={{ color: "#6E6787", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pr.market?.question || "Prediction market question"}</span>
                      <span style={{ font: "600 11px 'JetBrains Mono',monospace", color: pr.type === "YES" ? "#0E9160" : "#D4491F" }}>{pr.type}</span>
                      <span style={{ font: "600 13px 'JetBrains Mono',monospace", color: "#0E9160" }}>${pr.amount}</span>
                      <span style={{ display: "inline-flex", font: "600 10.5px 'JetBrains Mono',monospace" }}>{pr.price}¢</span>
                      <span style={{ font: "500 12px 'JetBrains Mono',monospace", color: "#A9A2BE" }}>{new Date(pr.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* COMPLIANCE TAB */}
            {activeTab === "Compliance" && (
              <div>
                <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", overflow: "hidden", marginBottom: "22px" }}>
                  <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif", padding: "20px 24px 14px" }}>Review queue</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr .8fr .9fr .9fr .8fr", gap: "12px", padding: "10px 24px", font: "600 10.5px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1px", borderBottom: "1px solid rgba(29,24,50,.07)" }}>
                    <span>USER</span><span>JURISDICTION</span><span>TIER</span><span>FLAG</span><span>STATUS</span><span>SUBMITTED</span>
                  </div>
                  {mockKycQueue.map((kq, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr .8fr .9fr .9fr .8fr", gap: "12px", padding: "15px 24px", borderBottom: "1px solid rgba(29,24,50,.05)", alignItems: "center", fontSize: "13.5px" }}>
                      <span style={{ font: "600 13px 'JetBrains Mono',monospace" }}>{kq.user}</span>
                      <span style={{ color: "#6E6787" }}>{kq.juris}</span>
                      <span style={{ font: "600 11px 'JetBrains Mono',monospace", color: "#7A4599" }}>{kq.tier}</span>
                      <span style={{ color: "#6E6787", fontSize: "12.5px" }}>{kq.flag}</span>
                      <span style={{ display: "inline-flex", font: "600 10.5px 'JetBrains Mono',monospace", color: kq.status === "REVIEW" ? "#D4842A" : "#D4491F", background: kq.stBg, padding: "4px 10px", borderRadius: "999px", width: "fit-content" }}>{kq.status}</span>
                      <span style={{ font: "500 12px 'JetBrains Mono',monospace", color: "#A9A2BE" }}>{kq.when}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DEVELOPERS TAB */}
            {activeTab === "Developers" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: "20px" }}>
                
                {/* Left Side: Keys and webhooks configuration */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif" }}>API Keys</div>
                      <button onClick={handleCreateKey} style={{ background: "#1D1633", border: "none", color: "#fff", font: "600 12px 'Instrument Sans',sans-serif", padding: "7px 14px", borderRadius: "999px", cursor: "pointer" }}>+ Create Key</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {dbKeys.map((ak, i) => (
                        <div key={i} style={{ background: "#FFFBF7", border: "1px solid rgba(29,24,50,.08)", borderRadius: "12px", padding: "15px 18px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                            <span style={{ fontWeight: 700, fontSize: "13.5px" }}>key_{i + 1}</span>
                            <span style={{ font: "600 10px 'JetBrains Mono',monospace", color: ak.isActive ? "#0E9160" : "#D4491F", background: ak.isActive ? "rgba(23,184,119,.1)" : "rgba(229,72,77,.1)", padding: "3px 9px", borderRadius: "999px" }}>{ak.isActive ? "ACTIVE" : "INACTIVE"}</span>
                          </div>
                          <div style={{ font: "500 12.5px 'JetBrains Mono',monospace", color: "#6E6787", marginBottom: "7px" }}>{ak.key}</div>
                          <div style={{ fontSize: "11.5px", color: "#A9A2BE" }}>Created {new Date(ak.createdAt).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Webhook Endpoint Input */}
                  <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif", marginBottom: "8px" }}>Webhook Subscriptions</div>
                    <div style={{ color: "#6E6787", fontSize: "13.5px", marginBottom: "14px" }}>Enter target endpoint to notify on trade execution events.</div>
                    
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input 
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://webhook.site/..."
                        style={{ width: "100%", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "10px", padding: "10px 14px", font: "500 13px 'JetBrains Mono',monospace" }}
                      />
                      <button 
                        onClick={() => alert("Webhook target URL saved!")}
                        style={{ background: "#1D1633", border: "none", color: "#fff", font: "700 13px 'Instrument Sans'", padding: "0 18px", borderRadius: "10px", cursor: "pointer" }}>
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Webhook log attempts */}
                <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column" }}>
                  <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif", marginBottom: "14px" }}>Webhook Delivery Logs</div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "380px", overflowY: "auto" }}>
                    {webhookLogs.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px", color: "#A9A2BE", fontSize: "12.5px" }}>No webhooks dispatched yet. Trigger a trade to see logs!</div>
                    ) : (
                      webhookLogs.map((log, i) => (
                        <div key={i} style={{ background: "#FFFBF7", border: "1px solid rgba(29,24,50,.08)", borderRadius: "10px", padding: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ font: "600 11.5px 'JetBrains Mono',monospace", color: "#7A4599" }}>{log.event}</span>
                            <span style={{ font: "600 10px 'JetBrains Mono',monospace", color: log.statusCode === 200 ? "#0E9160" : "#D4491F", background: log.statusCode === 200 ? "rgba(23,184,119,.1)" : "rgba(229,72,77,.1)", padding: "2px 7px", borderRadius: "4px" }}>
                              {log.statusCode}
                            </span>
                          </div>
                          <div style={{ font: "500 10.5px 'JetBrains Mono',monospace", color: "#6E6787", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "4px" }}>
                            {log.url}
                          </div>
                          <div style={{ fontSize: "11px", color: "#A9A2BE" }}>
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </div>

      {/* NEW MARKET CREATION MODAL */}
      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(29, 22, 51, 0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#ffffff", padding: "40px", borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)", width: "100%", maxWidth: "460px",
            fontFamily: "'Instrument Sans', sans-serif"
          }}>
            <h2 style={{ font: "800 24px 'Bricolage Grotesque'", marginBottom: "20px" }}>Create New Market</h2>
            
            <form onSubmit={handleCreateMarket} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: "13px", display: "block", marginBottom: "6px" }}>Question Statement</label>
                <input 
                  type="text" 
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g. Will OpenAI release GPT-5 this year?"
                  required
                  disabled={creatingMarket}
                  style={{ width: "100%", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "10px", padding: "12px 14px", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 600, fontSize: "13px", display: "block", marginBottom: "6px" }}>Closing Date (Optional)</label>
                <input 
                  type="datetime-local" 
                  value={newCloses}
                  onChange={(e) => setNewCloses(e.target.value)}
                  disabled={creatingMarket}
                  style={{ width: "100%", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "10px", padding: "12px 14px", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 600, fontSize: "13px", display: "block", marginBottom: "6px" }}>Oracle Resolver</label>
                <select 
                  value={newOracle}
                  onChange={(e) => setNewOracle(e.target.value)}
                  disabled={creatingMarket}
                  style={{ width: "100%", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "10px", padding: "12px 14px", fontSize: "14px" }}>
                  <option value="oracle:consensus">Consensus Oracle</option>
                  <option value="oracle:gemini">Gemini Verification Oracle</option>
                  <option value="oracle:custom">Webhook Override</option>
                </select>
              </div>

              {creatingMarket && (
                <div style={{ font: "600 12px 'JetBrains Mono'", color: "#D6336C", margin: "4px 0", textAlign: "center" }}>
                  Calling Gemini AI models to analyze parameters...
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={creatingMarket}
                  style={{ flex: 1, background: "#FFFBF7", border: "1px solid rgba(29,24,50,.14)", borderRadius: "10px", padding: "12px", font: "700 14px 'Instrument Sans'", cursor: "pointer" }}>
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={creatingMarket || !newQuestion}
                  style={{ flex: 1, background: "#1D1633", color: "#fff", border: "none", borderRadius: "10px", padding: "12px", font: "700 14px 'Instrument Sans'", cursor: "pointer" }}>
                  {creatingMarket ? "Analyzing..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trade Alert Message */}
      {tradeMessage && (
        <div style={{
          position: "fixed", bottom: "30px", right: "30px", background: "#1D1633", color: "#fff",
          padding: "16px 24px", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          zIndex: 2000, font: "600 14px 'Instrument Sans'", borderLeft: "4px solid #17B877"
        }}>
          {tradeMessage}
        </div>
      )}
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 32px" }}>
        <Footer />
      </div>
    </div>
  );
}
