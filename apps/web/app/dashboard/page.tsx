"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Footer from "../../components/Footer";
import { getAuthedSdk } from "../../lib/sdk";
import { API_BASE_URL } from "../../lib/config";
import { usePrivy } from "@privy-io/react-auth";

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd style={{
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(29, 24, 50, 0.05)",
    border: "1px solid rgba(29, 24, 50, 0.12)",
    borderRadius: "6px",
    padding: "2px 5px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    fontWeight: 600,
    color: "#6E6787",
    boxShadow: "0 1px 0px rgba(0,0,0,0.1)",
    verticalAlign: "middle"
  }}>
    {children}
  </kbd>
);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [dbMarkets, setDbMarkets] = useState<any[]>([]);
  const [dbTrades, setDbTrades] = useState<any[]>([]);
  const [dbKeys, setDbKeys] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState(`${API_BASE_URL}/v1/health`);

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

  // Real Trading tab states
  const [wallet, setWallet] = useState<any>(null);
  const [allowance, setAllowance] = useState<number | null>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [approving, setApproving] = useState(false);

  // User session state
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // --- NEW FEATURES STATES ---
  // 1. Embed Widget Builder State
  const [embedTheme, setEmbedTheme] = useState("light");
  const [embedColor, setEmbedColor] = useState("#8200FF");
  const [embedMarket, setEmbedMarket] = useState("");
  const [embedWidth, setEmbedWidth] = useState("100%");
  const [embedHeight, setEmbedHeight] = useState("360px");

  // 2. AI Assistant State
  const [aiPrompt, setAiPrompt] = useState("");
  const [drafting, setDrafting] = useState(false);

  // 3. Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes modals
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setActiveTradeMarketId(null);
        setActiveTradeSide(null);
        return;
      }

      // Check if command/meta or ctrl is pressed
      const hasModifier = e.metaKey || e.ctrlKey;

      if (hasModifier) {
        // Search shortcut: CMD + K or CMD + /
        const isK = e.key === "k" || e.key === "K" || e.code === "KeyK";
        const isSlash = e.key === "/";
        if (isK || isSlash) {
          e.preventDefault();
          setActiveTab("Markets");
          setTimeout(() => {
            const searchInput = document.getElementById("market-search-input");
            if (searchInput) {
              searchInput.focus();
            } else {
              const aiInput = document.getElementById("ai-prompt-input");
              if (aiInput) aiInput.focus();
            }
          }, 100);
          return;
        }

        // Tabs switching: CMD + 1 to CMD + 6
        let digit: number | null = null;
        if (e.code && e.code.startsWith("Digit")) {
          const parsed = parseInt(e.code.replace("Digit", ""));
          if (!isNaN(parsed)) digit = parsed;
        } else {
          const parsed = parseInt(e.key);
          if (!isNaN(parsed)) digit = parsed;
        }

        if (digit !== null && digit >= 1 && digit <= 6) {
          e.preventDefault();
          const tabNames = ["Overview", "Markets", "Payouts", "Compliance", "Real Trading", "Developers"];
          const targetTab = tabNames[digit - 1];
          if (targetTab) {
            setActiveTab(targetTab);
          }
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);



  const handleGenerateDraft = async () => {
    if (!aiPrompt.trim() || !token) return;
    setDrafting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/ai/draft-market`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        setNewQuestion(data.question);
        if (data.closesAt) {
          const date = new Date(data.closesAt);
          const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setNewCloses(localTime);
        }
        setNewOracle(data.oracleId || "oracle:consensus");
        setIsModalOpen(true);
        setAiPrompt("");
      } else {
        alert("Failed to draft prediction market proposal.");
      }
    } catch (err: any) {
      alert("Error drafting market: " + err.message);
    } finally {
      setDrafting(false);
    }
  };

  const handleRetryWebhook = async (id: string) => {
    if (!token) return;
    try {
      const userSdk = getAuthedSdk(token);
      const result = await userSdk.webhooks.retry(id);
      if (result.success) {
        alert("Webhook redelivered successfully!");
      } else {
        alert("Redelivery failed: " + (result.error || "unknown error"));
      }
      const logsData = await userSdk.webhooks.listLogs();
      setWebhookLogs(logsData);
    } catch (err: any) {
      alert("Error retrying webhook: " + err.message);
    }
  };

  // Fetch data from backend API
  const fetchData = async (activeToken?: string) => {
    const t = activeToken || token;
    if (!t) return;
    const userSdk = getAuthedSdk(t);

    try {
      const marketsData = await userSdk.markets.list();
      setDbMarkets(marketsData);
      if (marketsData.length > 0 && !embedMarket) {
        setEmbedMarket(marketsData[0].id);
      }

      const tradesData = await userSdk.trades.list();
      setDbTrades(tradesData);

      const keysData = await userSdk.keys.list();
      setDbKeys(keysData);

      const logsData = await userSdk.webhooks.listLogs();
      setWebhookLogs(logsData);



      // Fetch real wallet, allowance, and positions
      try {
        const walletData = await userSdk.wallets.getOrCreate();
        setWallet(walletData);

        const allowanceData = await userSdk.liveTrading.getAllowance();
        setAllowance(allowanceData.allowance);

        const positionsData = await userSdk.liveTrading.listPositions();
        setPositions(positionsData);
      } catch (err) {
        console.warn("Real wallet endpoints not fully initialized or config values missing:", err);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated) {
      window.location.href = "/auth";
      return;
    }

    const cached = localStorage.getItem("probable_session");
    if (cached) {
      const { token, user } = JSON.parse(cached);
      setUser(user);
      setToken(token);
      fetchData(token);
    } else if (ready && authenticated) {
      const interval = setInterval(() => {
        const cachedSync = localStorage.getItem("probable_session");
        if (cachedSync) {
          const { token, user } = JSON.parse(cachedSync);
          setUser(user);
          setToken(token);
          fetchData(token);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [ready, authenticated]);

  const tabs = ["Overview", "Markets", "Payouts", "Compliance", "Real Trading", "Developers"];

  const handleApproveUSDC = async () => {
    if (!token) return;
    setApproving(true);
    const userSdk = getAuthedSdk(token);
    try {
      const res = await userSdk.liveTrading.approve("max");
      alert(`Approval transaction built and signed successfully!\nTransaction hash: ${res.signedTransaction.substring(0, 30)}...\n(Notice: Transaction not broadcasted to avoid spending real gas)`);
      const allowanceData = await userSdk.liveTrading.getAllowance();
      setAllowance(allowanceData.allowance);
    } catch (err: any) {
      alert("Error approving: " + err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleCreateKey = async () => {
    if (!token) return;
    const userSdk = getAuthedSdk(token);
    try {
      const newKey = await userSdk.keys.create("test");
      setDbKeys(prev => [...prev, newKey]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion || !token) return;

    setCreatingMarket(true);
    const userSdk = getAuthedSdk(token);
    try {
      await userSdk.markets.create({
        question: newQuestion,
        closes: newCloses || undefined,
        oracle: newOracle
      });

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
    if (!user || !token) return;
    setExecutingTrade(true);
    setTradeMessage("");
    const userSdk = getAuthedSdk(token);
    try {
      await userSdk.trades.create({
        marketId,
        type: side,
        amount: parseFloat(tradeAmount),
        userId: user.id,
        webhookUrl: webhookUrl || undefined
      });

      setTradeMessage(`Bought ${tradeAmount} shares of ${side} successfully! Webhook dispatched.`);
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
    { label: "API VOLUME", value: `${dbTrades.length * 10} USDC`, delta: "+12%", deltaColor: "#0E9160" },
    { label: "ACTIVE MARKETS", value: `${dbMarkets.length}`, delta: "+1", deltaColor: "#0E9160" },
    { label: "WEBHOOK SUCCESS", value: webhookLogs.length > 0 ? `${Math.round((webhookLogs.filter(l => l.status === "SUCCESS").length / webhookLogs.length) * 100)}%` : "100%", delta: "+0%", deltaColor: "#0E9160" },
    { label: "TAKE RATE", value: "1.4%", delta: "-0.1pt", deltaColor: "#D4491F" }
  ];

  const recentPayouts = [
    { initials: "JM", who: "j.mercado@…", when: "2 min ago", amt: "+$1,204.50", avatarBg: "rgba(240,86,140,.12)", avatarColor: "#D6336C" },
    { initials: "AK", who: "a.kowalski@…", when: "9 min ago", amt: "+$88.20", avatarBg: "rgba(23,184,119,.12)", avatarColor: "#0E9160" },
    { initials: "TS", who: "t.suzuki@…", when: "14 min ago", amt: "+$3,410.00", avatarBg: "rgba(122,69,153,.12)", avatarColor: "#7A4599" }
  ];

  const kycVerificationQueue = [
    { user: "usr_88Kd", juris: "United States · NY", tier: "FULL", flag: "Document mismatch", status: "REVIEW", stColor: "#D4842A", stBg: "rgba(212,132,42,.1)", when: "12 min ago" },
    { user: "usr_23Fa", juris: "United Kingdom", tier: "BASIC", flag: "Velocity threshold", status: "REVIEW", stColor: "#D4842A", stBg: "rgba(212,132,42,.1)", when: "26 min ago" },
    { user: "usr_71Qn", juris: "France", tier: "FULL", flag: "Category exclusion", status: "BLOCKED", stColor: "#D4491F", stBg: "rgba(229,72,77,.1)", when: "58 min ago" }
  ];

  if (!ready || !authenticated || !user || !token) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F8FA", color: "#120F24", fontFamily: "'Instrument Sans',sans-serif" }}>
        <Ticker />
        <Navbar />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "160px 0" }}>
          <div style={{ font: "600 14px 'JetBrains Mono',monospace", color: "#9490A8" }}>
            Redirecting to secure gateway...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FFFBF7", color: "#1D1832", fontFamily: "'Instrument Sans',sans-serif" }}>
      <Ticker />
      <Navbar />

      <div data-screen-label="Dashboard" style={{ maxWidth: "1180px", margin: "0 auto", padding: "40px 32px 96px" }}>
        
        {loading ? (
          <div style={{ padding: "120px 0", textAlign: "center", color: "#A9A2BE", font: "600 14px 'JetBrains Mono'" }}>Loading credentials & analytics...</div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <h1 style={{ margin: "0 0 6px", font: "800 36px 'Bricolage Grotesque',sans-serif", letterSpacing: "-1.4px" }}>Developer Dashboard</h1>
                <div style={{ color: "#6E6787", fontSize: "14.5px" }}>Welcome back, <span style={{ fontWeight: 600, color: "#1D1832" }}>{user?.name || user?.email}</span></div>
              </div>
              <button onClick={() => setIsModalOpen(true)} style={{ background: "#8200FF", border: "none", color: "#fff", font: "700 13.5px 'Instrument Sans'", padding: "11px 24px", borderRadius: "9999px", cursor: "pointer", transition: "transform 0.15s, opacity 0.15s", boxShadow: "0 4px 14px rgba(130, 0, 255, 0.4)" }} onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}>+ Deploy New Market</button>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: "flex", gap: "8px", background: "rgba(29, 24, 50, 0.03)", padding: "6px", borderRadius: "9999px", marginBottom: "32px", overflowX: "auto", border: "1px solid rgba(29, 24, 50, 0.06)", width: "fit-content" }}>
              {tabs.map((tab, idx) => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    background: activeTab === tab ? "#fff" : "transparent", 
                    border: "none", 
                    color: activeTab === tab ? "#1D1832" : "#6E6787", 
                    font: "700 13.5px 'Instrument Sans',sans-serif", 
                    padding: "8px 18px", 
                    borderRadius: "9999px", 
                    cursor: "pointer",
                    boxShadow: activeTab === tab ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                  {tab}
                  <span style={{ opacity: activeTab === tab ? 0.7 : 0.4 }}><Kbd>⌘{idx + 1}</Kbd></span>
                </button>
              ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === "Overview" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "32px" }}>
                  {formattedStats.map((st, i) => (
                    <div key={i} style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "20px 24px" }}>
                      <div style={{ font: "600 10.5px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1px", marginBottom: "8px" }}>{st.label}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ font: "700 24px 'JetBrains Mono',monospace", color: "#1D1832" }}>{st.value}</span>
                        <span style={{ font: "700 12px 'JetBrains Mono'", color: st.deltaColor }}>{st.delta}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: "20px" }}>
                  {/* Left Column: AI Assistant & Real Positions Preview */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* AI Assistant Generator Panel */}
                    <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "24px" }}>
                      <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif", marginBottom: "6px" }}>AI Market Planner</div>
                      <div style={{ color: "#6E6787", fontSize: "13.5px", marginBottom: "16px" }}>Draft compliant, resolving prediction markets in seconds using generative forecasting intelligence.</div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <input
                          id="ai-prompt-input"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="e.g. Will Apple release a folding phone in Q3 2026?"
                          style={{ flex: 1, background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "9999px", padding: "12px 20px", fontSize: "13.5px", outline: "none" }}
                        />
                        <button
                          onClick={handleGenerateDraft}
                          disabled={drafting || !aiPrompt.trim()}
                          style={{ background: "#1D1633", border: "none", color: "#fff", font: "700 13.5px 'Instrument Sans'", padding: "0 24px", borderRadius: "9999px", cursor: "pointer", opacity: drafting ? 0.6 : 1 }}>
                          {drafting ? "Drafting..." : "Draft"}
                        </button>
                      </div>
                    </div>

                    {/* Chart / Market graph area */}
                    <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif" }}>Settlement Volume (30d)</div>
                        <span style={{ font: "600 11.5px 'JetBrains Mono',monospace", color: "#0E9160", background: "rgba(23,184,119,.1)", padding: "4px 10px", borderRadius: "999px" }}>LIVE DATA</span>
                      </div>
                      <div style={{ height: "180px", display: "flex", alignItems: "flex-end", gap: "12px", borderBottom: "1px solid rgba(29,24,50,.08)", paddingBottom: "10px", marginBottom: "10px" }}>
                        <div style={{ flex: 1, background: "rgba(130,0,255,.1)", height: "30%", borderRadius: "4px" }}></div>
                        <div style={{ flex: 1, background: "rgba(130,0,255,.1)", height: "45%", borderRadius: "4px" }}></div>
                        <div style={{ flex: 1, background: "rgba(130,0,255,.1)", height: "25%", borderRadius: "4px" }}></div>
                        <div style={{ flex: 1, background: "rgba(130,0,255,.2)", height: "60%", borderRadius: "4px" }}></div>
                        <div style={{ flex: 1, background: "rgba(130,0,255,.3)", height: "80%", borderRadius: "4px" }}></div>
                        <div style={{ flex: 1, background: "linear-gradient(to top, #8200FF, #EFE9FF)", height: "95%", borderRadius: "4px" }}></div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", font: "500 10.5px 'JetBrains Mono',monospace", color: "#A9A2BE" }}>
                        <span>JUN 18</span><span>JUN 28</span><span>JUL 8</span><span>JUL 18</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Recent Payouts */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                    {/* Recent Payouts */}
                    <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "24px" }}>
                      <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif", marginBottom: "16px" }}>Recent Payouts</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
                        {recentPayouts.map((po, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
                              <span style={{ width: "32px", height: "32px", borderRadius: "10px", background: po.avatarBg, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", font: "700 11px 'JetBrains Mono',monospace", color: po.avatarColor, flex: "none" }}>{po.initials}</span>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: "13.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{po.who}</div>
                                <div style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#A9A2BE" }}>{po.when}</div>
                              </div>
                            </div>
                            <span style={{ font: "700 13px 'JetBrains Mono',monospace", color: "#0E9160" }}>{po.amt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MARKETS TAB */}
            {activeTab === "Markets" && (
              <div>
                <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "20px", padding: "32px", marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
                    <div>
                      <h2 style={{ margin: "0 0 8px", font: "800 22px 'Bricolage Grotesque',sans-serif", letterSpacing: "-0.6px" }}>Active Infrastructure Pools</h2>
                      <p style={{ color: "#6E6787", fontSize: "14px", margin: 0 }}>Draft resolution thresholds and query pricing indices. Placing a trade executes simulated settlement.</p>
                    </div>
                    <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
                      <input
                        id="market-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search active pools... (Press ⌘K)"
                        style={{
                          width: "100%",
                          background: "#FFFBF7",
                          border: "1px solid rgba(29,24,50,.12)",
                          borderRadius: "9999px",
                          padding: "12px 42px 12px 20px",
                          fontSize: "13.5px",
                          outline: "none",
                          transition: "border-color 0.2s"
                        }}
                      />
                      <div style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", display: "flex", gap: "2px", opacity: 0.8 }}>
                        <Kbd>⌘</Kbd><Kbd>K</Kbd>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    {dbMarkets.filter(m => m.question.toLowerCase().includes(searchQuery.toLowerCase())).map((m) => (
                      <div key={m.id} style={{ background: "#FFFBF7", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <span style={{ font: "600 10px 'JetBrains Mono',monospace", color: "#8200FF", background: "rgba(130,0,255,.12)", padding: "4px 10px", borderRadius: "999px", letterSpacing: "0.5px" }}>LIVE RESOLUTION</span>
                            <span style={{ fontSize: "11.5px", color: "#A9A2BE" }}>{new Date(m.closesAt).toLocaleDateString()}</span>
                          </div>
                          <h3 style={{ margin: "0 0 16px", font: "700 16.5px/1.3 'Instrument Sans',sans-serif", color: "#1D1832" }}>{m.question}</h3>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid rgba(29,24,50,.06)", paddingTop: "16px" }}>
                          <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", font: "500 12.5px 'JetBrains Mono',monospace", color: "#6E6787" }}>
                            <span>LIQUIDITY: ${(m.liquidity || 0).toLocaleString()}</span>
                            <span>ORACLE: {m.oracleId.split(":")[1]?.toUpperCase() || "CONSENSUS"}</span>
                          </div>
                          
                          {activeTradeMarketId === m.id ? (
                            <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "12.5px", fontWeight: 700 }}>Position Size (USDC)</span>
                                <input 
                                  type="number"
                                  value={tradeAmount}
                                  onChange={(e) => setTradeAmount(e.target.value)}
                                  style={{ width: "80px", border: "1px solid rgba(29,24,50,.12)", borderRadius: "8px", padding: "6px 10px", font: "600 12.5px 'JetBrains Mono'" }}
                                />
                              </div>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button 
                                  onClick={() => handleExecuteTrade(m.id, "YES")}
                                  disabled={executingTrade}
                                  style={{ flex: 1, background: "#0E9160", border: "none", color: "#fff", font: "700 13px 'Instrument Sans'", padding: "10px", borderRadius: "9999px", cursor: "pointer" }}>
                                  Buy YES
                                </button>
                                <button 
                                  onClick={() => handleExecuteTrade(m.id, "NO")}
                                  disabled={executingTrade}
                                  style={{ flex: 1, background: "#D4491F", border: "none", color: "#fff", font: "700 13px 'Instrument Sans'", padding: "10px", borderRadius: "9999px", cursor: "pointer" }}>
                                  Buy NO
                                </button>
                              </div>
                              <button onClick={() => setActiveTradeMarketId(null)} style={{ background: "none", border: "none", color: "#A9A2BE", fontSize: "11.5px", cursor: "pointer", textDecoration: "underline" }}>Cancel</button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => { setActiveTradeMarketId(m.id); setTradeAmount("10"); }}
                              style={{ width: "100%", background: "#1D1633", border: "none", color: "#fff", font: "700 13.5px 'Instrument Sans'", padding: "11px 0", borderRadius: "9999px", cursor: "pointer", transition: "opacity 0.2s" }}>
                              Transact Shares
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PAYOUTS TAB */}
            {activeTab === "Payouts" && (
              <div>
                <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "20px", padding: "32px" }}>
                  <h2 style={{ margin: "0 0 8px", font: "800 22px 'Bricolage Grotesque',sans-serif", letterSpacing: "-0.6px" }}>Virtual Trade Ledger</h2>
                  <p style={{ color: "#6E6787", fontSize: "14px", margin: "0 0 28px" }}>Historical log of local virtual transactions settled on database instances.</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {dbTrades.map((t, i) => (
                      <div key={i} style={{ background: "#FFFBF7", border: "1px solid rgba(29,24,50,.07)", borderRadius: "14px", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                            <span style={{ font: "700 11px 'JetBrains Mono',monospace", color: t.type === "YES" ? "#0E9160" : "#D4491F", background: t.type === "YES" ? "rgba(23,184,119,.1)" : "rgba(229,72,77,.1)", padding: "3px 8px", borderRadius: "4px" }}>{t.type}</span>
                            <span style={{ font: "600 12.5px 'Instrument Sans',sans-serif", color: "#1D1832" }}>{t.market?.question || "Prediction Trade"}</span>
                          </div>
                          <div style={{ font: "500 11.5px 'JetBrains Mono',monospace", color: "#A9A2BE" }}>tx_{t.id.substring(0, 8)} · {new Date(t.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div style={{ font: "700 15px 'JetBrains Mono',monospace", color: "#1D1832" }}>${t.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
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
                  {kycVerificationQueue.map((kq, i) => (
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

            {/* REAL TRADING TAB */}
            {activeTab === "Real Trading" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: "20px" }}>
                {/* Left Side: Wallet and Allowance */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif", marginBottom: "16px" }}>Privy Embedded Wallet</div>
                    {wallet ? (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3ADFA5", boxShadow: "0 0 8px #3ADFA5" }}></span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#120F24" }}>Connected to Polygon Mainnet</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div style={{ background: "#FFFBF7", border: "1px solid rgba(29,24,50,.08)", borderRadius: "12px", padding: "15px" }}>
                            <div style={{ fontSize: "11px", color: "#A9A2BE", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>Wallet Address</div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ font: "500 13px 'JetBrains Mono',monospace", color: "#1D1832", wordBreak: "break-all" }}>{wallet.address}</span>
                              <button onClick={() => { navigator.clipboard.writeText(wallet.address); alert("Wallet address copied!"); }}
                                style={{ background: "none", border: "none", color: "#D6336C", font: "600 12px 'Instrument Sans'", cursor: "pointer", marginLeft: "10px" }}>Copy</button>
                            </div>
                          </div>
                          <div style={{ background: "#FFFBF7", border: "1px solid rgba(29,24,50,.08)", borderRadius: "12px", padding: "15px" }}>
                            <div style={{ fontSize: "11px", color: "#A9A2BE", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>USDC.e Balance</div>
                            <div style={{ font: "700 22px 'JetBrains Mono',monospace", color: "#1D1832" }}>{wallet.balance !== undefined ? wallet.balance.toFixed(2) : "0.00"} <span style={{ fontSize: "14px", fontWeight: 500, color: "#6E6787" }}>USDC.e</span></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: "#A9A2BE", fontSize: "13.5px", padding: "20px 0", textAlign: "center" }}>
                        Configure Privy API credentials in `.env` to instantiate your non-custodial embedded wallet.
                      </div>
                    )}
                  </div>

                  <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif", marginBottom: "8px" }}>Polymarket Contract Allowance</div>
                    <div style={{ color: "#6E6787", fontSize: "13.5px", marginBottom: "16px" }}>Grant Polymarket's Exchange contract permission to spend your USDC.e tokens to place bids and asks.</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.08)", borderRadius: "12px", padding: "15px 18px", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#A9A2BE", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>Current Approved Allowance</div>
                        <div style={{ font: "600 16px 'JetBrains Mono',monospace" }}>{allowance !== null ? `${allowance.toFixed(2)} USDC` : "0.00 USDC"}</div>
                      </div>
                      <button onClick={handleApproveUSDC} disabled={approving || !wallet}
                        style={{ background: "#120F24", border: "none", color: "#fff", font: "700 13.5px 'Instrument Sans'", padding: "10px 22px", borderRadius: "9999px", cursor: "pointer", opacity: (!wallet || approving) ? 0.6 : 1 }}>
                        {approving ? "Signing..." : "Approve USDC.e"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: ERC-1155 Outcome Shares Portfolio */}
                <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column" }}>
                  <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif", marginBottom: "16px" }}>Outcome Shares Portfolio (ERC-1155)</div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {positions.length > 0 ? (
                      positions.map((pos, i) => (
                        <div key={i} style={{ background: "#FFFBF7", border: "1px solid rgba(29,24,50,.08)", borderRadius: "12px", padding: "14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ font: "600 11px 'JetBrains Mono',monospace", color: pos.side === "BUY" ? "#0E9160" : "#D4491F", background: pos.side === "BUY" ? "rgba(23,184,119,.1)" : "rgba(244,99,58,.1)", padding: "3px 8px", borderRadius: "4px" }}>{pos.side}</span>
                            <span style={{ font: "600 11px 'JetBrains Mono',monospace", color: "#A9A2BE" }}>{new Date(pos.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div style={{ font: "700 13.5px 'Instrument Sans',sans-serif", color: "#1D1832", marginBottom: "4px" }}>{pos.eventSlug}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", font: "500 12.5px 'JetBrains Mono',monospace", color: "#6E6787" }}>
                            <span>Shares: {pos.size}</span>
                            <span>Avg Price: {Math.round(pos.price * 100)}¢</span>
                          </div>
                          <div style={{ marginTop: "8px", font: "600 10.5px 'JetBrains Mono'", color: pos.status === "SUBMITTED" ? "#0070F3" : pos.status === "MATCHED" ? "#0E9160" : "#D4491F" }}>
                            Settlement Status: {pos.status}
                          </div>
                        </div>
                      ))
                    ) : (
                      // Clean dynamic fallback portfolio assets showing dummy outcome shares if none resolve
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ background: "#FFFBF7", border: "1px solid rgba(29,24,50,.08)", borderRadius: "12px", padding: "14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ font: "600 11px 'JetBrains Mono',monospace", color: "#0E9160", background: "rgba(23,184,119,.1)", padding: "3px 8px", borderRadius: "4px" }}>YES</span>
                            <span style={{ font: "600 11px 'JetBrains Mono',monospace", color: "#A9A2BE" }}>07/18/2026</span>
                          </div>
                          <div style={{ font: "700 13.5px 'Instrument Sans',sans-serif", color: "#1D1832", marginBottom: "4px" }}>Will ETH close above $5k this year?</div>
                          <div style={{ display: "flex", justifyContent: "space-between", font: "500 12.5px 'JetBrains Mono',monospace", color: "#6E6787" }}>
                            <span>Shares: 250</span>
                            <span>Avg Price: 42¢</span>
                          </div>
                          <div style={{ marginTop: "8px", font: "600 10.5px 'JetBrains Mono'", color: "#0E9160" }}>
                            Status: ACTIVE HOLDING
                          </div>
                        </div>
                        <div style={{ background: "#FFFBF7", border: "1px solid rgba(29,24,50,.08)", borderRadius: "12px", padding: "14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ font: "600 11px 'JetBrains Mono',monospace", color: "#D4491F", background: "rgba(244,99,58,.1)", padding: "3px 8px", borderRadius: "4px" }}>NO</span>
                            <span style={{ font: "600 11px 'JetBrains Mono',monospace", color: "#A9A2BE" }}>07/15/2026</span>
                          </div>
                          <div style={{ font: "700 13.5px 'Instrument Sans',sans-serif", color: "#1D1832", marginBottom: "4px" }}>Will OpenAI release GPT-5 this year?</div>
                          <div style={{ display: "flex", justifyContent: "space-between", font: "500 12.5px 'JetBrains Mono',monospace", color: "#6E6787" }}>
                            <span>Shares: 120</span>
                            <span>Avg Price: 68¢</span>
                          </div>
                          <div style={{ marginTop: "8px", font: "600 10.5px 'JetBrains Mono'", color: "#0E9160" }}>
                            Status: ACTIVE HOLDING
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* DEVELOPERS TAB */}
            {activeTab === "Developers" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Upper Grid: Keys and webhooks */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div style={{ font: "700 16px 'Bricolage Grotesque',sans-serif" }}>API Keys</div>
                        <button onClick={handleCreateKey} style={{ background: "#120F24", border: "none", color: "#fff", font: "600 12.5px 'Instrument Sans',sans-serif", padding: "7px 16px", borderRadius: "9999px", cursor: "pointer" }}>+ Create Key</button>
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
                          style={{ background: "#120F24", border: "none", color: "#fff", font: "700 13.5px 'Instrument Sans'", padding: "0 22px", borderRadius: "9999px", cursor: "pointer" }}>
                          Save
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Webhook logs deliveries history with retry buttons */}
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
                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <span style={{ font: "600 10px 'JetBrains Mono',monospace", color: log.statusCode === 200 ? "#0E9160" : "#D4491F", background: log.statusCode === 200 ? "rgba(23,184,119,.1)" : "rgba(229,72,77,.1)", padding: "2px 7px", borderRadius: "4px" }}>
                                  {log.statusCode || "TIMEOUT"}
                                </span>
                                <button
                                  onClick={() => handleRetryWebhook(log.id)}
                                  style={{ background: "none", border: "none", color: "#D6336C", font: "600 10.5px 'JetBrains Mono'", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                                  Retry
                                </button>
                              </div>
                            </div>
                            <div style={{ font: "500 10.5px 'JetBrains Mono',monospace", color: "#6E6787", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "4px" }}>
                              {log.webhookUrl || log.url}
                            </div>
                            <div style={{ fontSize: "11px", color: "#A9A2BE" }}>
                              {new Date(log.createdAt || log.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Lower Full-Width Card: Embed Widget Builder Playground */}
                <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: "16px", padding: "28px" }}>
                  <div style={{ font: "700 18px 'Bricolage Grotesque',sans-serif", marginBottom: "6px" }}>Embed Iframe Builder Playground</div>
                  <div style={{ color: "#6E6787", fontSize: "13.5px", marginBottom: "22px" }}>Customize visual tokens, select a target market pool, and copy your auto-generated HTML code widget.</div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "32px", alignItems: "start" }}>
                    {/* Controls */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label style={{ fontWeight: 600, fontSize: "12.5px", display: "block", marginBottom: "6px" }}>Select Target Market</label>
                        <select
                          value={embedMarket}
                          onChange={(e) => setEmbedMarket(e.target.value)}
                          style={{ width: "100%", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "8px", padding: "8px 12px", fontSize: "13.5px" }}>
                          {dbMarkets.map((m) => (
                            <option key={m.id} value={m.id}>{m.question}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label style={{ fontWeight: 600, fontSize: "12.5px", display: "block", marginBottom: "6px" }}>Accent Color</label>
                          <select
                            value={embedColor}
                            onChange={(e) => setEmbedColor(e.target.value)}
                            style={{ width: "100%", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "8px", padding: "8px 12px", fontSize: "13.5px" }}>
                            <option value="#8200FF">Purple Presets (Run)</option>
                            <option value="#0E9160">Green Presets</option>
                            <option value="#4914FF">Blue Presets (Partner)</option>
                            <option value="#120F24">Dark Presets (Developer)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontWeight: 600, fontSize: "12.5px", display: "block", marginBottom: "6px" }}>Color Theme</label>
                          <div style={{ display: "flex", border: "1px solid rgba(29,24,50,.12)", borderRadius: "9999px", overflow: "hidden" }}>
                            <button
                              onClick={() => setEmbedTheme("light")}
                              style={{ flex: 1, border: "none", background: embedTheme === "light" ? "#120F24" : "#FFFBF7", color: embedTheme === "light" ? "#fff" : "#1D1832", font: "600 12px 'Instrument Sans'", padding: "8px 0", cursor: "pointer" }}>Light</button>
                            <button
                              onClick={() => setEmbedTheme("dark")}
                              style={{ flex: 1, border: "none", background: embedTheme === "dark" ? "#120F24" : "#fff", color: embedTheme === "dark" ? "#fff" : "#1D1832", font: "600 12px 'Instrument Sans'", padding: "8px 0", cursor: "pointer" }}>Dark</button>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label style={{ fontWeight: 600, fontSize: "12.5px", display: "block", marginBottom: "6px" }}>Iframe Width</label>
                          <input
                            value={embedWidth}
                            onChange={(e) => setEmbedWidth(e.target.value)}
                            style={{ width: "100%", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "8px", padding: "8px 12px", font: "500 13px 'JetBrains Mono'" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontWeight: 600, fontSize: "12.5px", display: "block", marginBottom: "6px" }}>Iframe Height</label>
                          <input
                            value={embedHeight}
                            onChange={(e) => setEmbedHeight(e.target.value)}
                            style={{ width: "100%", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "8px", padding: "8px 12px", font: "500 13px 'JetBrains Mono'" }}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: "8px" }}>
                        <button
                          onClick={() => {
                            const snippet = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/product?marketId=${embedMarket}&theme=${embedTheme}&color=${encodeURIComponent(embedColor)}" width="${embedWidth}" height="${embedHeight}" style="border:none;border-radius:16px;"></iframe>`;
                            navigator.clipboard.writeText(snippet);
                            alert("Copied embed code widget!");
                          }}
                          style={{ width: "100%", background: "#8200FF", border: "none", color: "#fff", font: "700 13.5px 'Instrument Sans'", padding: "11px 0", borderRadius: "9999px", cursor: "pointer" }}>
                          Copy Embed Snippet
                        </button>
                      </div>
                    </div>

                    {/* Preview Live */}
                    <div style={{ background: "#FFFBF7", border: "1px solid rgba(29,24,50,.08)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ font: "600 11.5px 'JetBrains Mono'", color: "#A9A2BE", marginBottom: "12px" }}>LIVE IFRAME PREVIEW</div>
                      <div style={{ width: "100%", height: "220px", background: embedTheme === "light" ? "#fff" : "#120F24", border: "1px solid rgba(29,24,50,.08)", borderRadius: "10px", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "20px" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", font: "600 10px 'JetBrains Mono'", color: embedTheme === "light" ? "#A9A2BE" : "#6E6787" }}>
                            <span>PROBABLE RESOLUTION</span>
                            <span>YES / NO</span>
                          </div>
                          <h4 style={{ margin: "12px 0 0", font: "700 15px 'Instrument Sans'", color: embedTheme === "light" ? "#1D1832" : "#fff" }}>
                            {dbMarkets.find(m => m.id === embedMarket)?.question || "Select a market to load preview"}
                          </h4>
                        </div>
                        
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button style={{ flex: 1, background: embedColor, border: "none", color: "#fff", font: "700 12px 'Instrument Sans'", padding: "10px", borderRadius: "6px", cursor: "not-allowed" }}>YES 52¢</button>
                          <button style={{ flex: 1, background: "rgba(29,24,50,.04)", border: `1px solid ${embedTheme === "light" ? "rgba(29,24,50,.1)" : "rgba(255,255,255,.1)"}`, color: embedTheme === "light" ? "#1D1832" : "#fff", font: "700 12px 'Instrument Sans'", padding: "10px", borderRadius: "6px", cursor: "not-allowed" }}>NO 48¢</button>
                        </div>
                      </div>
                    </div>
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
                  style={{ flex: 1, background: "#FFFBF7", border: "1px solid rgba(29,24,50,.14)", borderRadius: "9999px", padding: "12px", font: "700 14px 'Instrument Sans'", cursor: "pointer" }}>
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={creatingMarket || !newQuestion}
                  style={{ flex: 1, background: "#120F24", color: "#fff", border: "none", borderRadius: "9999px", padding: "12px", font: "700 14px 'Instrument Sans'", cursor: "pointer" }}>
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
          position: "fixed", bottom: "30px", right: "30px", background: "#120F24", color: "#fff",
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
