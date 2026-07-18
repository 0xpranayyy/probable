"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Ticker from "../../../components/Ticker";
import Footer from "../../../components/Footer";
import Star from "../../../components/Star";
import { LiveEvent, LiveMarket, PricePoint, OrderBook } from "@probable/sdk";
import { useWatchlist } from "../../../lib/useWatchlist";
import { sdk } from "../../../lib/sdk";
import { WS_BASE_URL } from "../../../lib/config";

const INTERVALS: ["1D" | "1W" | "1M" | "ALL", "1d" | "1w" | "1m" | "max"][] = [
  ["1D", "1d"], ["1W", "1w"], ["1M", "1m"], ["ALL", "max"],
];

function fmtCents(p: number | null) { return p == null ? "—" : Math.round(p * 100) + "¢"; }
function fmtUsd(n: number) {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K";
  return "$" + Math.round(n);
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Chart({ history }: { history: PricePoint[] }) {
  if (!history?.length) {
    return <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#9490A8", font: "500 12px 'JetBrains Mono'" }}>No price history</div>;
  }
  const W = 600, H = 220, PAD = 6;
  const ps = history.map((h) => h.p);
  const min = Math.min(...ps), max = Math.max(...ps);
  const r = (max - min) || 0.01;
  const pts = history.map((h, i) => [
    (i / (history.length - 1)) * W,
    H - PAD - ((h.p - min) / r) * (H - PAD * 2),
  ]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = line + ` L${W} ${H} L0 ${H} Z`;
  const up = ps[ps.length - 1] >= ps[0];
  const color = up ? "#17B877" : "#F4633A";
  return (
    <div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="cgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#cgrad)" />
        <path d={line} fill="none" stroke={color} strokeWidth={2.4} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", font: "500 10.5px 'JetBrains Mono'", color: "#9490A8", marginTop: 6 }}>
        <span>{new Date(history[0].t * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        <span>hi {Math.round(max * 100)}¢ · lo {Math.round(min * 100)}¢</span>
        <span>{new Date(history[history.length - 1].t * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
}

function Book({ book }: { book: OrderBook }) {
  const depth = (side: OrderBook["bids"]) => side.slice(0, 6);
  const maxSize = Math.max(1, ...depth(book.bids).map((l) => l.size), ...depth(book.asks).map((l) => l.size));
  const Row = ({ level, color, bg }: { level: { price: number; size: number }; color: string; bg: string }) => (
    <div style={{ position: "relative", display: "flex", justifyContent: "space-between", padding: "4px 8px", font: "500 12px 'JetBrains Mono'", overflow: "hidden", borderRadius: 6 }}>
      <div style={{ position: "absolute", inset: 0, width: (level.size / maxSize * 100) + "%", background: bg }} />
      <span style={{ position: "relative", color }}>{Math.round(level.price * 100)}¢</span>
      <span style={{ position: "relative", color: "#625E77" }}>{Math.round(level.size).toLocaleString()}</span>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div>
        <div style={{ font: "600 10px 'JetBrains Mono'", color: "#0E9160", letterSpacing: "1px", marginBottom: 6 }}>BIDS</div>
        {depth(book.bids).map((l, i) => <Row key={i} level={l} color="#0E9160" bg="rgba(23,184,119,.1)" />)}
        {!book.bids.length && <div style={{ color: "#9490A8", fontSize: 12 }}>—</div>}
      </div>
      <div>
        <div style={{ font: "600 10px 'JetBrains Mono'", color: "#D4491F", letterSpacing: "1px", marginBottom: 6 }}>ASKS</div>
        {depth(book.asks).map((l, i) => <Row key={i} level={l} color="#D4491F" bg="rgba(244,99,58,.1)" />)}
        {!book.asks.length && <div style={{ color: "#9490A8", fontSize: 12 }}>—</div>}
      </div>
    </div>
  );
}

const card = { background: "#fff", border: "1px solid rgba(130,0,255,.08)", borderRadius: 16, padding: 20 };

export default function MarketDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState(0);
  const [interval_, setInterval_] = useState<"1d" | "1w" | "1m" | "max">("1w");
  const [history, setHistory] = useState<PricePoint[] | null>(null);
  const [book, setBook] = useState<OrderBook>({ bids: [], asks: [] });
  const { isWatched, toggle, setAlert, items } = useWatchlist();

  useEffect(() => {
    setEvent(null); setError(null); setSel(0);
    sdk.live.bySlug(slug).then(setEvent).catch(() => setError("Market not found."));
  }, [slug]);

  const market: LiveMarket | undefined = event?.markets[sel];

  useEffect(() => {
    if (!market?.yesToken) return;
    setHistory(null);
    sdk.live.priceHistory(market.yesToken, interval_).then(setHistory).catch(() => setHistory([]));
  }, [market?.yesToken, interval_]);

  useEffect(() => {
    if (!market?.yesToken) return;

    // Fetch initial book immediately
    sdk.live.book(market.yesToken).then(setBook).catch(() => {});

    // Open WebSockets connection for streaming events
    const ws = new WebSocket(WS_BASE_URL);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "subscribe",
        tokenIds: [market.yesToken]
      }));
    };

    ws.onmessage = (eventMsg) => {
      try {
        const msg = JSON.parse(eventMsg.data);
        if (msg.event === "quote_update" && msg.tokenId === market.yesToken) {
          setEvent(prev => {
            if (!prev) return null;
            return {
              ...prev,
              markets: prev.markets.map((m, idx) => {
                if (idx === sel) {
                  return { ...m, yesPrice: msg.price };
                }
                return m;
              })
            };
          });
        } else if (msg.event === "book_update" && msg.tokenId === market.yesToken) {
          sdk.live.book(market.yesToken!).then(setBook).catch(() => {});
        } else if (msg.event === "trade" && msg.tokenId === market.yesToken) {
          sdk.live.book(market.yesToken!).then(setBook).catch(() => {});
          setEvent(prev => {
            if (!prev) return null;
            return {
              ...prev,
              markets: prev.markets.map((m, idx) => {
                if (idx === sel) {
                  return { ...m, yesPrice: msg.price };
                }
                return m;
              })
            };
          });
        }
      } catch (e) {
        console.warn("Failed to parse websocket message:", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [market?.yesToken, sel]);

  const watched = event ? isWatched(event.id) : false;
  const watchItem = useMemo(() => items.find((i) => i.eventId === String(event?.id)), [items, event]);
  const [above, setAbove] = useState("");
  const [below, setBelow] = useState("");
  useEffect(() => {
    setAbove(watchItem?.above != null ? String(Math.round(watchItem.above * 100)) : "");
    setBelow(watchItem?.below != null ? String(Math.round(watchItem.below * 100)) : "");
  }, [watchItem?.above, watchItem?.below]);

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: "100vh", background: "#F8F8FA", color: "#120F24", fontFamily: "'Instrument Sans',sans-serif" }}>
      <Ticker /><Navbar />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 32px 96px" }}>{children}</div>
      <Footer />
    </div>
  );

  if (error) return shell(<div style={{ color: "#D4491F" }}>{error} <Link href="/markets">← Back to markets</Link></div>);
  if (!event) return shell(<div style={{ color: "#9490A8", font: "500 13px 'JetBrains Mono'" }}>Loading market…</div>);

  return shell(
    <>
      <Link href="/markets" style={{ font: "600 13px 'Instrument Sans'" }}>← Markets</Link>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", margin: "14px 0 20px" }}>
        {event.image && <img src={event.image} alt="" width={56} height={56} style={{ borderRadius: 14, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, font: "800 28px/1.15 'Bricolage Grotesque'", letterSpacing: "-1px" }}>{event.title}</h1>
          <div style={{ display: "flex", gap: 14, marginTop: 8, font: "500 12px 'JetBrains Mono'", color: "#9490A8", flexWrap: "wrap" }}>
            <span>{fmtUsd(event.volume24hr)} · 24h vol</span>
            <span>{fmtUsd(event.liquidity)} liquidity</span>
            <span>ends {fmtDate(event.endDate)}</span>
          </div>
        </div>
        <Star watched={watched} onClick={() => toggle(event)} size={24} />
      </div>

      <div className="detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ font: "600 34px 'JetBrains Mono'", letterSpacing: "-2px", color: "#0E9160" }}>{fmtCents(market?.yesPrice ?? null)}</span>
                <span style={{ font: "600 13px 'Instrument Sans'", color: "#625E77" }}>{event.binary ? "YES" : market?.groupItemTitle}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {INTERVALS.map(([label, val]) => (
                  <button key={val} onClick={() => setInterval_(val)}
                    style={{ background: interval_ === val ? "rgba(130,0,255,.12)" : "transparent", border: "none", color: interval_ === val ? "#8200FF" : "#9490A8", font: "600 11px 'JetBrains Mono'", padding: "5px 11px", borderRadius: 999, cursor: "pointer" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {history === null
              ? <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#9490A8", font: "500 12px 'JetBrains Mono'" }}>Loading chart…</div>
              : <Chart history={history} />}
          </div>

          {!event.binary && (
            <div style={{ ...card, padding: 12 }}>
              {event.markets.map((m, i) => (
                <button key={m.id} onClick={() => setSel(i)}
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: sel === i ? "rgba(130,0,255,.07)" : "transparent", border: "none", borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ font: "600 14px 'Instrument Sans'", color: "#120F24" }}>{m.groupItemTitle}</span>
                  <span style={{ display: "flex", gap: 12, font: "600 13px 'JetBrains Mono'" }}>
                    <span style={{ color: "#0E9160" }}>YES {fmtCents(m.yesPrice)}</span>
                    <span style={{ color: "#9490A8" }}>NO {fmtCents(m.yesPrice != null ? 1 - m.yesPrice : null)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {event.description && (
            <div style={card}>
              <div style={{ font: "700 15px 'Bricolage Grotesque'", marginBottom: 8 }}>Resolution</div>
              <div style={{ color: "#625E77", fontSize: 13.5, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                {event.description.length > 900 ? event.description.slice(0, 900) + "…" : event.description}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card}>
            <div style={{ font: "700 15px 'Bricolage Grotesque'", marginBottom: 12 }}>Order book · {event.binary ? "YES" : market?.groupItemTitle}</div>
            <Book book={book} />
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed rgba(130,0,255,.1)", display: "flex", justifyContent: "space-between", font: "500 11.5px 'JetBrains Mono'", color: "#9490A8" }}>
              <span>bid {market?.bestBid != null ? fmtCents(market.bestBid) : "—"}</span>
              <span>ask {market?.bestAsk != null ? fmtCents(market.bestAsk) : "—"}</span>
            </div>
          </div>

          <div style={card}>
            <div style={{ font: "700 15px 'Bricolage Grotesque'", marginBottom: 4 }}>Price alert</div>
            <div style={{ color: "#625E77", fontSize: 12.5, marginBottom: 12 }}>
              {watched ? "Notify when YES crosses a threshold (while the app is open)." : "Add to watchlist to set alerts."}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input value={above} onChange={(e) => setAbove(e.target.value.replace(/\D/g, ""))} placeholder="above ¢" disabled={!watched}
                style={{ width: 82, background: "#F8F8FA", border: "1px solid rgba(130,0,255,.12)", borderRadius: 9, padding: "9px 12px", font: "500 13px 'JetBrains Mono'", outline: "none" }} />
              <input value={below} onChange={(e) => setBelow(e.target.value.replace(/\D/g, ""))} placeholder="below ¢" disabled={!watched}
                style={{ width: 82, background: "#F8F8FA", border: "1px solid rgba(130,0,255,.12)", borderRadius: 9, padding: "9px 12px", font: "500 13px 'JetBrains Mono'", outline: "none" }} />
              <button disabled={!watched || !event}
                onClick={() => event && setAlert(String(event.id), above ? Number(above) / 100 : null, below ? Number(below) / 100 : null)}
                style={{ background: "#120F24", border: "none", color: "#fff", font: "600 12.5px 'Instrument Sans'", padding: "9px 16px", borderRadius: 999, cursor: watched ? "pointer" : "default", opacity: watched ? 1 : .4 }}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
