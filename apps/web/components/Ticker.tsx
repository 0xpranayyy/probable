"use client";

import React, { useState, useEffect } from "react";
import { sdk } from "../lib/sdk";

interface TickerItem {
  q: string;
  yesStr: string;
  deltaColor: string;
  deltaStr: string;
}

const staticFallback = [
  { q: "ETH > $4k in May?", yesStr: "88", deltaColor: "#3ADFA5", deltaStr: "+2.4%" },
  { q: "Fed cuts rates in June?", yesStr: "32", deltaColor: "#FF8FB5", deltaStr: "-1.1%" },
  { q: "SpaceX Mars landing '29?", yesStr: "14", deltaColor: "#3ADFA5", deltaStr: "+0.8%" },
  { q: "US Election '24 Winner?", yesStr: "52", deltaColor: "#8B84A3", deltaStr: "0.0%" },
  { q: "AI passes Turing test '25?", yesStr: "76", deltaColor: "#3ADFA5", deltaStr: "+4.2%" },
  { q: "BTC > $100k in 2024?", yesStr: "64", deltaColor: "#FF8FB5", deltaStr: "-0.5%" },
  { q: "Apple AR glasses '25?", yesStr: "41", deltaColor: "#3ADFA5", deltaStr: "+1.9%" }
];

export default function Ticker() {
  const [items, setItems] = useState<TickerItem[]>(staticFallback);

  useEffect(() => {
    async function fetchLiveMarkets() {
      try {
        const events = await sdk.live.events({ limit: 12 });
        const mapped = events
          .map((e) => {
            const m = e.markets[0];
            if (!m || m.yesPrice == null) return null;
            const yesCents = Math.round(m.yesPrice * 100);
            const deltaVal = (m.oneDayPriceChange ?? 0) * 100;
            const deltaStr = `${deltaVal >= 0 ? "+" : ""}${deltaVal.toFixed(1)}%`;
            const deltaColor = deltaVal > 0 ? "#3ADFA5" : deltaVal < 0 ? "#FF8FB5" : "#8B84A3";
            let cleanedQ = e.binary ? e.title : `${e.title} — ${m.groupItemTitle}`;
            if (cleanedQ.length > 45) cleanedQ = cleanedQ.substring(0, 42) + "...";
            return { q: cleanedQ, yesStr: yesCents.toString(), deltaColor, deltaStr };
          })
          .filter((x): x is TickerItem => x !== null);
        if (mapped.length) setItems(mapped);
      } catch (err) {
        console.warn("Failed to fetch live Polymarket quotes, using static fallback:", err);
      }
    }
    fetchLiveMarkets();
    
    // Refresh quotes every 60 seconds
    const interval = setInterval(fetchLiveMarkets, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: "#1D1633", overflow: "hidden", height: "36px", display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", whiteSpace: "nowrap", animation: "marquee 45s linear infinite", willChange: "transform" }}>
        {items.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 28px", font: "500 11.5px 'JetBrains Mono',monospace" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3ADFA5", animation: "pulse 2s infinite" }}></span>
            <span style={{ color: "#B9AEDB" }}>{t.q}</span>
            <span style={{ color: "#fff", fontWeight: "600" }}>{t.yesStr}¢</span>
            <span style={{ color: t.deltaColor }}>{t.deltaStr}</span>
          </div>
        ))}
        {/* Duplicate for seamless loop */}
        {items.map((t, i) => (
          <div key={`dup-${i}`} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 28px", font: "500 11.5px 'JetBrains Mono',monospace" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3ADFA5", animation: "pulse 2s infinite" }}></span>
            <span style={{ color: "#B9AEDB" }}>{t.q}</span>
            <span style={{ color: "#fff", fontWeight: "600" }}>{t.yesStr}¢</span>
            <span style={{ color: t.deltaColor }}>{t.deltaStr}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
