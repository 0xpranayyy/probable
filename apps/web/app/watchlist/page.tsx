"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Footer from "../../components/Footer";
import Star from "../../components/Star";
import { LiveEvent } from "@probable/sdk";
import { useWatchlist } from "../../lib/useWatchlist";
import { sdk } from "../../lib/sdk";

function fmtCents(p: number | null) { return p == null ? "—" : Math.round(p * 100) + "¢"; }
function fmtUsd(n: number) {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K";
  return "$" + Math.round(n);
}

export default function WatchlistPage() {
  const { items, loading, toggle, signedIn } = useWatchlist();
  const [live, setLive] = useState<Record<string, LiveEvent>>({});

  useEffect(() => {
    if (!items.length) return;
    let alive = true;
    const load = () => sdk.live.byIds(items.map((i) => i.eventId))
      .then((evs) => alive && setLive(Object.fromEntries(evs.map((e) => [String(e.id), e]))))
      .catch(() => {});
    load();
    const iv = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(iv); };
  }, [items.map((i) => i.eventId).join(",")]);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8FA", color: "#120F24", fontFamily: "'Instrument Sans',sans-serif" }}>
      <Ticker /><Navbar />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 32px 96px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ margin: "0 0 4px", font: "800 40px 'Bricolage Grotesque'", letterSpacing: "-1.6px" }}>Watchlist</h1>
            <p style={{ margin: 0, color: "#625E77", fontSize: 15 }}>
              {signedIn ? "Synced to your account." : "Stored on this device — sign in to sync across devices."}
            </p>
          </div>
          <button onClick={() => "Notification" in window && Notification.requestPermission()}
            style={{ background: "#fff", border: "1px solid rgba(130,0,255,.14)", color: "#120F24", font: "600 12.5px 'Instrument Sans'", padding: "9px 16px", borderRadius: 999, cursor: "pointer" }}>
            Enable notifications
          </button>
        </div>

        {loading ? (
          <div style={{ color: "#9490A8", font: "500 13px 'JetBrains Mono'", padding: "40px 0" }}>Loading…</div>
        ) : !items.length ? (
          <div style={{ padding: "48px 0", color: "#625E77", fontSize: 14.5 }}>
            Nothing here yet — star a market from the <Link href="/markets">markets feed</Link>.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
            {items.map((it) => {
              const ev = live[it.eventId];
              const m = ev?.markets[0];
              return (
                <div key={it.eventId} style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1px solid rgba(130,0,255,.08)", borderRadius: 14, padding: "14px 18px" }}>
                  {it.image && <img src={it.image} alt="" width={38} height={38} style={{ borderRadius: 9, objectFit: "cover", flex: "none" }} />}
                  <Link href={`/market/${it.slug}`} style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "#120F24" }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</div>
                    <div style={{ font: "500 11.5px 'JetBrains Mono'", color: "#9490A8", marginTop: 3 }}>
                      {ev ? `${fmtUsd(ev.volume24hr)} · 24h` : "…"}
                      {(it.above != null || it.below != null) && (
                        <span style={{ color: it.fired ? "#0E9160" : "#D4842A" }}>
                          {"  ·  alert "}
                          {it.above != null && `≥${Math.round(it.above * 100)}¢`}
                          {it.above != null && it.below != null && " / "}
                          {it.below != null && `≤${Math.round(it.below * 100)}¢`}
                          {it.fired && " ✓ fired"}
                        </span>
                      )}
                    </div>
                  </Link>
                  <span style={{ font: "600 20px 'JetBrains Mono'", letterSpacing: "-1px", color: "#0E9160", flex: "none" }}>
                    {m ? fmtCents(m.yesPrice) : "—"}
                  </span>
                  <Star watched onClick={() => toggle({ id: it.eventId, slug: it.slug, title: it.title, image: it.image })} />
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
