"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ProbableClient } from "@probable/sdk";
import { usePrivy } from "@privy-io/react-auth";
import { API_BASE_URL } from "../lib/config";
import { sdk } from "../lib/sdk";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Product", href: "/product" },
  { label: "Markets", href: "/markets" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Docs", href: "/docs" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "About", href: "/about" },
];

function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="26" fill="#120F24" />
      <path
        d="M22 72 C 22 72, 40 72, 47 57 C 54 42, 58 44, 65 32"
        stroke="#B87CFF" strokeWidth="14" strokeLinecap="round" fill="none"
      />
      <circle cx="68" cy="27" r="10.5" fill="#FF5C23" />
    </svg>
  );
}

interface CmdKProps {
  onOpen: () => void;
}

function CmdKButton({ onOpen }: CmdKProps) {
  return (
    <button
      onClick={onOpen}
      className="nav-search-btn"
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        background: "rgba(130,0,255,.05)", border: "1px solid rgba(130,0,255,.1)",
        borderRadius: "999px", padding: "7px 10px", cursor: "pointer",
        color: "#9490A8", font: "500 13.5px 'Instrument Sans',sans-serif",
        transition: "all .15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(130,0,255,.28)"; e.currentTarget.style.background = "rgba(130,0,255,.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(130,0,255,.1)"; e.currentTarget.style.background = "rgba(130,0,255,.05)"; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ flex: "none" }}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <span className="nav-search-label" style={{ paddingLeft: "4px" }}>Search markets</span>
      <kbd className="nav-search-kbd" style={{
        display: "inline-flex", alignItems: "center", gap: "2px",
        background: "rgba(130,0,255,.1)", color: "#8200FF",
        font: "600 10.5px 'JetBrains Mono',monospace", padding: "2px 6px",
        borderRadius: "6px", marginLeft: "2px",
      }}>⌘K</kbd>
    </button>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [signInHover, setSignInHover] = useState(false);
  const [getKeysHover, setGetKeysHover] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { logout } = usePrivy();

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Command Palette States
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const cached = localStorage.getItem("probable_session");
    if (cached) {
      setUser(JSON.parse(cached).user);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Global keydown listener for Command Palette (⌘K or Ctrl+K)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, []);

  // Fetch search results from SDK
  useEffect(() => {
    if (searchQuery.trim().length <= 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const delayDebounceFn = setTimeout(() => {
      sdk.live.search(searchQuery)
        .then((res) => {
          setSearchResults(res.slice(0, 5));
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch {}
    const cached = localStorage.getItem("probable_session");
    if (cached) {
      const sdkClient = new ProbableClient({ token: JSON.parse(cached).token, baseUrl: API_BASE_URL });
      await sdkClient.auth.logout().catch(() => {});
    }
    localStorage.removeItem("probable_session");
    setUser(null);
    window.location.href = "/";
  };

  const staticCommands = [
    { label: "Go to Dashboard", type: "nav", href: "/dashboard", desc: "View developer credentials, key managers & settlement metrics" },
    { label: "Go to Markets", type: "nav", href: "/markets", desc: "Explore live Polymarket betting indexes & volumes" },
    { label: "Go to Watchlist", type: "nav", href: "/watchlist", desc: "View saved prediction pools" },
    { label: "Go to Documentation", type: "nav", href: "/docs", desc: "Query API specifications, SDK packages & integrations" },
    { label: "Go to Home", type: "nav", href: "/", desc: "Probable landing page & portal overview" },
    { label: "Get API Keys", type: "action", href: "/onboard", desc: "Create an account or retrieve developer keys" },
  ];

  // Filter static commands based on search
  const filteredCommands = staticCommands.filter(c => 
    c.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Combine lists
  const items = [
    ...filteredCommands.map(c => ({ ...c, isEvent: false })),
    ...searchResults.map(e => ({ 
      label: e.title, 
      type: "event", 
      href: `/market/${e.slug}`, 
      desc: `${e.volume24hr ? `Volume: $${Math.round(e.volume24hr).toLocaleString()}` : "Active prediction pool"}`, 
      isEvent: true, 
      data: e 
    }))
  ];

  const handleSelectItem = (item: any) => {
    setPaletteOpen(false);
    setSearchQuery("");
    router.push(item.href);
  };

  // Keyboard navigation inside Palette
  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery, searchResults]);

  useEffect(() => {
    if (!paletteOpen) return;
    const handlePaletteKeys = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[activeIndex]) {
          handleSelectItem(items[activeIndex]);
        }
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handlePaletteKeys);
    return () => window.removeEventListener("keydown", handlePaletteKeys);
  }, [paletteOpen, activeIndex, items]);

  const initials = (user?.name || user?.email || "U").substring(0, 1).toUpperCase();

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalEnter {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        background: "rgba(248,248,250,.78)",
        borderBottom: scrolled ? "1px solid rgba(130,0,255,.1)" : "1px solid rgba(130,0,255,.04)",
        boxShadow: scrolled ? "0 8px 30px rgba(18,15,36,.06)" : "none",
        transition: "box-shadow .25s ease, border-color .25s ease",
      }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 32px", height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>

          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "11px", cursor: "pointer", textDecoration: "none", flex: "none" }}>
            <Logo size={32} />
            <span style={{ font: "800 19.5px 'Bricolage Grotesque',sans-serif", letterSpacing: "-.6px", color: "#120F24" }}>Probable</span>
          </Link>

          <div style={{ display: "flex", gap: "2px", alignItems: "center", background: "rgba(130,0,255,.03)", padding: "4px", borderRadius: "999px", border: "1px solid rgba(130,0,255,.05)" }}>
            {navItems.map((n, i) => {
              const isActive = pathname === n.href;
              const isHovered = hoveredIndex === i;
              return (
                <Link
                  key={i}
                  href={n.href}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    position: "relative",
                    background: isActive ? "#120F24" : isHovered ? "rgba(130,0,255,.08)" : "transparent",
                    border: "none",
                    color: isActive ? "#fff" : "#120F24",
                    font: "600 13.5px 'Instrument Sans',sans-serif",
                    padding: "7px 14px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    transition: "background .18s ease, color .18s ease",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: "none" }}>
            <CmdKButton onOpen={() => setPaletteOpen(true)} />
            {user ? (
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "#fff", border: "1px solid rgba(130,0,255,.1)",
                  padding: "5px 12px 5px 5px", borderRadius: "999px",
                  fontSize: "13.5px", fontWeight: 600, color: "#120F24",
                  boxShadow: "0 1px 2px rgba(18,15,36,.04)",
                }}>
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: "linear-gradient(135deg,#8200FF,#FF5C23)",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 700, flex: "none",
                  }}>
                    {initials}
                  </div>
                  <span>{user.name || user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    background: "none", border: "none", color: "#9490A8",
                    font: "600 13.5px 'Instrument Sans',sans-serif", cursor: "pointer",
                    transition: "color .15s", padding: "6px 4px",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#9490A8"}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth"
                  onMouseEnter={() => setSignInHover(true)}
                  onMouseLeave={() => setSignInHover(false)}
                  style={{
                    background: "none", border: "none",
                    color: signInHover ? "#8200FF" : "#120F24",
                    font: "600 14px 'Instrument Sans',sans-serif",
                    cursor: "pointer", transition: "color .15s", textDecoration: "none",
                    padding: "8px 6px",
                  }}
                >
                  Sign in
                </Link>
                <Link
                  href="/onboard"
                  onMouseEnter={() => setGetKeysHover(true)}
                  onMouseLeave={() => setGetKeysHover(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: "7px",
                    background: getKeysHover ? "#6A00D6" : "#8200FF",
                    border: "none", color: "#fff",
                    font: "700 14px 'Instrument Sans',sans-serif",
                    padding: "10px 19px", borderRadius: "999px", cursor: "pointer",
                    transition: "all .2s",
                    transform: getKeysHover ? "translateY(-1px)" : "none",
                    boxShadow: getKeysHover ? "0 10px 24px rgba(130,0,255,.35)" : "0 2px 8px rgba(130,0,255,.18)",
                    textDecoration: "none",
                  }}
                >
                  Get API keys <span style={{ color: "#fff", opacity: 0.85 }}>→</span>
                </Link>
              </>
            )}
          </div>

        </div>
      </div>

      {/* COMMAND PALETTE POPUP */}
      {paletteOpen && (
        <div 
          onClick={() => setPaletteOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(18, 15, 36, 0.4)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "14vh",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(255, 255, 255, 0.96)",
              border: "1px solid rgba(130, 0, 255, 0.16)",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "560px",
              boxShadow: "0 30px 80px rgba(18, 15, 36, 0.22)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animation: "modalEnter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {/* Input Wrapper */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderBottom: "1px solid rgba(130, 0, 255, 0.08)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8200FF" strokeWidth="2.5" strokeLinecap="round" style={{ flex: "none" }}>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input 
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search markets, switch tabs, trigger actions..."
                style={{
                  flex: 1,
                  border: "none",
                  background: "none",
                  outline: "none",
                  font: "500 15px 'Instrument Sans',sans-serif",
                  color: "#120F24",
                }}
              />
              <span style={{ fontSize: "10px", color: "#9490A8", fontWeight: 600, background: "rgba(130,0,255,.08)", padding: "3px 7px", borderRadius: "5px" }}>ESC</span>
            </div>

            {/* List Results */}
            <div style={{ maxHeight: "360px", overflowY: "auto", padding: "8px 0" }}>
              {searching ? (
                <div style={{ padding: "18px", fontStyle: "italic", fontSize: "13px", color: "#9490A8", fontFamily: "JetBrains Mono" }}>Searching Polymarket indices...</div>
              ) : items.length === 0 ? (
                <div style={{ padding: "18px", fontSize: "13px", color: "#9490A8" }}>No options or active markets found. Try searching for "politics" or "bitcoin"...</div>
              ) : (
                items.map((item, idx) => {
                  const isSelected = idx === activeIndex;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 16px",
                        borderRadius: "10px",
                        background: isSelected ? "rgba(130, 0, 255, 0.06)" : "transparent",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                        margin: "2px 8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                        {item.type === "nav" && (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isSelected ? "#8200FF" : "#9490A8"} strokeWidth="2.2" strokeLinecap="round" style={{ flex: "none" }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        )}
                        {item.type === "action" && (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isSelected ? "#8200FF" : "#9490A8"} strokeWidth="2.2" strokeLinecap="round" style={{ flex: "none" }}><path d="M12 5v14M5 12h14"/></svg>
                        )}
                        {item.type === "event" && (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isSelected ? "#8200FF" : "#9490A8"} strokeWidth="2.2" strokeLinecap="round" style={{ flex: "none" }}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                          <span style={{
                            fontSize: "13.5px",
                            fontWeight: 600,
                            color: isSelected ? "#8200FF" : "#120F24",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>{item.label}</span>
                          <span style={{
                            fontSize: "11px",
                            color: "#9490A8",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginTop: "2px",
                          }}>{item.desc}</span>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <span style={{ fontSize: "10.5px", color: "#8200FF", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px", flex: "none", marginLeft: "12px" }}>
                          Select <span style={{ font: "600 11px monospace", background: "rgba(130,0,255,.08)", padding: "1px 5px", borderRadius: "3px" }}>↵</span>
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
