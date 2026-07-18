"use client";

import React, { useState, useEffect } from "react";

interface ProbableEmbedProps {
  marketId: string;
  theme?: "light" | "dark";
  apiKey?: string;
  onTrade?: (trade: any) => void;
}

export default function ProbableEmbed({ marketId, theme = "dark", apiKey = "sk_test_4Jn8Wz1c", onTrade }: ProbableEmbedProps) {
  const [market, setMarket] = useState<any>(null);
  const [yesPrice, setYesPrice] = useState(50);
  const [noPrice, setNoPrice] = useState(50);
  const [flashType, setFlashType] = useState<"up" | "down" | null>(null);
  const [amount, setAmount] = useState("10");
  const [trading, setTrading] = useState(false);
  const [message, setMessage] = useState("");

  // Load market info
  useEffect(() => {
    async function loadMarket() {
      try {
        const res = await fetch("http://localhost:3001/v1/markets");
        const list = await res.json();
        const found = list.find((m: any) => m.id === marketId);
        if (found) {
          setMarket(found);
        } else {
          // fallback mock if not found
          setMarket({
            id: marketId,
            question: "Will ETH reach $5k by end of year?",
            liquidity: 1200000,
            status: "LIVE"
          });
        }
      } catch (err) {
        console.error("Error loading market for embed:", err);
      }
    }
    loadMarket();
  }, [marketId]);

  // Connect WebSocket
  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket("ws://localhost:3001");
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === "quote_update" && data.marketId === marketId) {
            const oldYes = yesPrice;
            const newYes = data.yes;
            setYesPrice(newYes);
            setNoPrice(data.no);

            if (newYes > oldYes) {
              setFlashType("up");
            } else if (newYes < oldYes) {
              setFlashType("down");
            }
            setTimeout(() => setFlashType(null), 1000);
          }
        } catch (e) {
          // ignore parsing error
        }
      };

      ws.onerror = (e) => {
        console.warn("[Embed WebSocket] Error connecting to quotes server.");
      };
    } catch (e) {
      console.warn("[Embed WebSocket] Failed to initialize socket connection.");
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [marketId, yesPrice]);

  const handleBuy = async (side: "YES" | "NO") => {
    setTrading(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:3001/v1/trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          marketId,
          type: side,
          amount: parseFloat(amount),
          userId: "embed_user_sandbox"
        })
      });

      const result = await res.json();
      if (res.ok) {
        setMessage(`Success: Bought ${amount} shares of ${side}!`);
        if (onTrade) onTrade(result);
      } else {
        setMessage(`Error: ${result.error || "Trade failed"}`);
      }
    } catch (e) {
      setMessage("Error executing trade transaction.");
    } finally {
      setTrading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div style={{
      background: isDark ? "#120D24" : "#ffffff",
      color: isDark ? "#ffffff" : "#1D1832",
      border: "1px solid rgba(29, 24, 50, 0.09)",
      borderRadius: "16px",
      padding: "20px",
      boxShadow: "0 14px 40px rgba(0,0,0,0.08)",
      maxWidth: "360px",
      fontFamily: "'Instrument Sans', sans-serif",
      transition: "background 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <span style={{ font: "600 10px 'JetBrains Mono', monospace", color: isDark ? "#B9AEDB" : "#6E6787", letterSpacing: "1px" }}>
          &lt;probable-embed&gt;
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", font: "600 10px 'JetBrains Mono', monospace", color: "#17B877" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#17B877" }}></span>STREAMING
        </span>
      </div>

      <div style={{ font: "800 17px 'Bricolage Grotesque', sans-serif", letterSpacing: "-0.5px", marginBottom: "16px", lineHeight: "1.3" }}>
        {market?.question || "Loading market statement..."}
      </div>

      {/* Quote Display Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        <div style={{
          background: isDark ? "#1D1633" : "#FFFBF7",
          border: "1px solid rgba(29, 24, 50, 0.06)",
          borderRadius: "12px",
          padding: "12px",
          textAlign: "center",
          transition: "background 0.3s, border-color 0.3s",
          borderColor: flashType === "up" ? "#3ADFA5" : flashType === "down" ? "#FF8FB5" : "rgba(29, 24, 50, 0.06)"
        }}>
          <div style={{ font: "600 11px 'JetBrains Mono', monospace", color: "#0E9160", marginBottom: "4px" }}>YES</div>
          <div style={{ font: "600 24px 'JetBrains Mono', monospace", color: "#0E9160" }}>{yesPrice}¢</div>
        </div>

        <div style={{
          background: isDark ? "#1D1633" : "#FFFBF7",
          border: "1px solid rgba(29, 24, 50, 0.06)",
          borderRadius: "12px",
          padding: "12px",
          textAlign: "center",
          transition: "background 0.3s, border-color 0.3s",
          borderColor: flashType === "down" ? "#3ADFA5" : flashType === "up" ? "#FF8FB5" : "rgba(29, 24, 50, 0.06)"
        }}>
          <div style={{ font: "600 11px 'JetBrains Mono', monospace", color: "#D4491F", marginBottom: "4px" }}>NO</div>
          <div style={{ font: "600 24px 'JetBrains Mono', monospace", color: "#D4491F" }}>{noPrice}¢</div>
        </div>
      </div>

      {/* Trade Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", background: isDark ? "#1D1633" : "#FFFBF7", borderRadius: "10px", padding: "4px 10px", border: "1px solid rgba(29,24,50,.1)" }}>
          <span style={{ font: "600 13px 'JetBrains Mono', monospace", color: isDark ? "#B9AEDB" : "#6E6787", marginRight: "8px" }}>$</span>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={trading}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              color: isDark ? "#ffffff" : "#1D1832",
              font: "600 14px 'JetBrains Mono', monospace",
              outline: "none"
            }}
          />
          <span style={{ font: "500 11px 'JetBrains Mono', monospace", color: "#A9A2BE" }}>USDC</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button 
            onClick={() => handleBuy("YES")}
            disabled={trading || !market}
            style={{
              background: "#0E9160",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 0",
              font: "700 13.5px 'Instrument Sans', sans-serif",
              cursor: "pointer",
              transition: "opacity 0.2s"
            }}>
            {trading ? "..." : "Buy YES"}
          </button>
          <button 
            onClick={() => handleBuy("NO")}
            disabled={trading || !market}
            style={{
              background: "#D4491F",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 0",
              font: "700 13.5px 'Instrument Sans', sans-serif",
              cursor: "pointer",
              transition: "opacity 0.2s"
            }}>
            {trading ? "..." : "Buy NO"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ 
          marginTop: "12px", 
          fontSize: "12px", 
          textAlign: "center", 
          color: message.startsWith("Success") ? "#17B877" : "#F4633A",
          font: "600 12px 'Instrument Sans', sans-serif"
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
