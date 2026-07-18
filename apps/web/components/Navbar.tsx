"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ProbableClient } from "@probable/sdk";
import { usePrivy } from "@privy-io/react-auth";

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

function CmdK() {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/markets");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <button
      onClick={() => router.push("/markets")}
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
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [signInHover, setSignInHover] = useState(false);
  const [getKeysHover, setGetKeysHover] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { logout } = usePrivy();

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

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

  const handleSignOut = async () => {
    try {
      await logout();
    } catch {}
    const cached = localStorage.getItem("probable_session");
    if (cached) {
      const sdk = new ProbableClient({ token: JSON.parse(cached).token, baseUrl: "http://localhost:3001" });
      await sdk.auth.logout().catch(() => {});
    }
    localStorage.removeItem("probable_session");
    setUser(null);
    window.location.href = "/";
  };

  const initials = (user?.name || user?.email || "U").substring(0, 1).toUpperCase();

  return (
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
          <CmdK />
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
  );
}
