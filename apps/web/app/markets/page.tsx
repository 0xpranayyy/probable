"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Footer from "../../components/Footer";
import Star from "../../components/Star";
import { LiveEvent } from "@probable/sdk";
import { useWatchlist } from "../../lib/useWatchlist";
import { sdk } from "../../lib/sdk";

const CATEGORIES: { label: string; slug: string | null }[] = [
  { label: "Trending", slug: null },
  { label: "Politics", slug: "politics" },
  { label: "Crypto", slug: "crypto" },
  { label: "Sports", slug: "sports" },
  { label: "Tech", slug: "tech" },
  { label: "Economy", slug: "economy" },
  { label: "World", slug: "world" },
  { label: "Culture", slug: "pop-culture" },
];

function fmtUsd(n: number) {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K";
  return "$" + Math.round(n);
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtCents(p: number | null) {
  return p == null ? "—" : Math.round(p * 100) + "¢";
}

function OutcomeRow({ label, price }: { label: string; price: number | null }) {
  const pct = Math.round((price ?? 0) * 100);
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: 8, overflow: "hidden", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.06)" }}>
      <div style={{ position: "absolute", inset: 0, width: pct + "%", background: "rgba(240,86,140,.09)" }} />
      <span style={{ position: "relative", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{label}</span>
      <span style={{ position: "relative", font: "600 13px 'JetBrains Mono',monospace", color: "#D6336C" }}>{pct}%</span>
    </div>
  );
}

function EventCard({ event, watched, onToggle }: { event: LiveEvent; watched: boolean; onToggle: () => void }) {
  const m = event.markets[0];
  return (
    <Link href={`/market/${event.slug}`} style={{ textDecoration: "none", color: "#1D1832" }}>
      <div className="premium-card" style={{ background: "#fff", border: "1px solid rgba(29,24,50,.08)", borderRadius: 16, padding: 18, height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {event.image && <img src={event.image} alt="" width={42} height={42} style={{ borderRadius: 10, objectFit: "cover", flex: "none" }} />}
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.35, flex: 1 }}>{event.title}</div>
          <Star watched={watched} onClick={onToggle} />
        </div>
        {event.binary ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ font: "600 30px 'JetBrains Mono',monospace", letterSpacing: "-2px", color: "#0E9160" }}>{fmtCents(m.yesPrice)}</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ font: "600 11px 'JetBrains Mono',monospace", color: "#0E9160" }}>YES</span>
              <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "#A9A2BE" }}>NO {fmtCents(m.yesPrice != null ? 1 - m.yesPrice : null)}</span>
            </div>
            {m.oneDayPriceChange != null && (
              <span style={{ marginLeft: "auto", font: "600 12px 'JetBrains Mono',monospace", color: m.oneDayPriceChange >= 0 ? "#0E9160" : "#D4491F" }}>
                {(m.oneDayPriceChange >= 0 ? "▲" : "▼") + Math.abs(m.oneDayPriceChange * 100).toFixed(1)}
              </span>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {event.markets.slice(0, 3).map((om, i) => <OutcomeRow key={i} label={om.groupItemTitle} price={om.yesPrice} />)}
            {event.markets.length > 3 && <span style={{ fontSize: 11.5, color: "#A9A2BE" }}>+{event.markets.length - 3} more outcomes</span>}
          </div>
        )}
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", font: "500 11.5px 'JetBrains Mono',monospace", color: "#A9A2BE", borderTop: "1px dashed rgba(29,24,50,.08)", paddingTop: 10 }}>
          <span>{fmtUsd(event.volume24hr)} · 24h</span>
          <span>ends {fmtDate(event.endDate)}</span>
        </div>
      </div>
    </Link>
  );
}

export default function MarketsPage() {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { isWatched, toggle } = useWatchlist();

  useEffect(() => {
    setLoading(true);
    setError(null);
    clearTimeout(debounce.current);
    const run = () => {
      const p = query.trim() ? sdk.live.search(query.trim()) : sdk.live.events({ tag: category, limit: 40 });
      p.then(setEvents).catch(() => setError("Could not load markets — check your connection.")).finally(() => setLoading(false));
    };
    if (query.trim()) debounce.current = setTimeout(run, 350);
    else run();
    return () => clearTimeout(debounce.current);
  }, [category, query]);

  return (
    <div style={{ minHeight: "100vh", background: "#FFFBF7", color: "#1D1832", fontFamily: "'Instrument Sans',sans-serif" }}>
      <Ticker />
      <Navbar />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 32px 96px" }}>
        <h1 style={{ margin: "0 0 4px", font: "800 40px 'Bricolage Grotesque'", letterSpacing: "-1.6px" }}>Markets</h1>
        <p style={{ margin: "0 0 24px", color: "#6E6787", fontSize: 15 }}>Live prediction markets, streamed from Polymarket.</p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 26 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets…"
            style={{ flex: "1 1 220px", maxWidth: 320, background: "#fff", border: "1px solid rgba(29,24,50,.12)", borderRadius: 999, padding: "10px 18px", font: "500 13.5px 'Instrument Sans'", color: "#1D1832", outline: "none" }}
          />
          {CATEGORIES.map((cat) => {
            const act = category === cat.slug && !query.trim();
            return (
              <button key={cat.label} onClick={() => { setQuery(""); setCategory(cat.slug); }}
                style={{ background: act ? "rgba(240,86,140,.12)" : "#fff", border: `1px solid ${act ? "#F0568C" : "rgba(29,24,50,.12)"}`, color: act ? "#D6336C" : "#6E6787", font: "600 12px 'Instrument Sans'", padding: "8px 15px", borderRadius: 999, cursor: "pointer", transition: "all .15s" }}>
                {cat.label}
              </button>
            );
          })}
        </div>

        {error && <div style={{ color: "#D4491F", fontSize: 14, marginBottom: 16 }}>{error}</div>}
        {loading ? (
          <div style={{ color: "#A9A2BE", font: "500 13px 'JetBrains Mono',monospace", padding: "40px 0" }}>Loading live markets…</div>
        ) : (
          <div className="markets-grid">
            {events.map((e) => (
              <EventCard key={e.id} event={e} watched={isWatched(e.id)} onToggle={() => toggle(e)} />
            ))}
          </div>
        )}
        {!loading && !events.length && !error && (
          <div style={{ color: "#A9A2BE", fontSize: 14, padding: "40px 0" }}>No markets found{query ? ` for "${query}"` : ""}.</div>
        )}
      </div>
      <Footer />
    </div>
  );
}
