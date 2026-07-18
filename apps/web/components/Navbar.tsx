"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/", bg: "transparent", color: "#1D1832" },
  { label: "Product", href: "/product", bg: "transparent", color: "#1D1832" },
  { label: "Docs", href: "/docs", bg: "transparent", color: "#1D1832" },
  { label: "Dashboard", href: "/dashboard", bg: "transparent", color: "#1D1832" },
  { label: "About", href: "/about", bg: "transparent", color: "#1D1832" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [signInHover, setSignInHover] = useState(false);
  const [getKeysHover, setGetKeysHover] = useState(false);

  // User state loaded on mount
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("probable_user");
    if (cached) {
      setUser(JSON.parse(cached));
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("probable_user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(16px)", background: "rgba(255,251,247,.85)", borderBottom: "1px solid rgba(29,24,50,.08)" }}>
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 32px", height: "66px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
        
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", textDecoration: "none" }}>
          <svg width="30" height="30" viewBox="0 0 30 30">
            <rect width="30" height="30" rx="9" fill="#1D1633"></rect>
            <path d="M7 20.5 L12 13 L16 16.5 L23 8" stroke="#FF8FB5" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"></path>
            <circle cx="23" cy="8" r="2.2" fill="#3ADFA5"></circle>
          </svg>
          <span style={{ font: "700 20px 'Bricolage Grotesque',sans-serif", letterSpacing: "-.5px", color: "#1D1633" }}>Probable</span>
        </Link>
        
        <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
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
                  background: isHovered || isActive ? "rgba(29,24,50,.06)" : n.bg, 
                  border: "none", 
                  color: n.color, 
                  font: "600 14.5px 'Instrument Sans',sans-serif", 
                  padding: "8px 15px", 
                  borderRadius: "999px", 
                  cursor: "pointer", 
                  transition: "background .15s",
                  textDecoration: "none"
                }}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {user ? (
            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(29, 24, 50, 0.05)",
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "14px",
                fontWeight: 600
              }}>
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#F0568C",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px"
                }}>
                  {(user.name || user.email || "U").substring(0, 1).toUpperCase()}
                </div>
                <span>{user.name || user.email}</span>
              </div>
              <button 
                onClick={handleSignOut}
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "#6E6787", 
                  font: "600 14px 'Instrument Sans',sans-serif", 
                  cursor: "pointer",
                  transition: "color .15s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}
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
                  background: "none", 
                  border: "none", 
                  color: signInHover ? "#D6336C" : "#1D1832", 
                  font: "600 14.5px 'Instrument Sans',sans-serif", 
                  cursor: "pointer",
                  transition: "color .15s",
                  textDecoration: "none"
                }}
              >
                Sign in
              </Link>
              <Link
                href="/onboard"
                onMouseEnter={() => setGetKeysHover(true)}
                onMouseLeave={() => setGetKeysHover(false)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "7px", 
                  background: getKeysHover ? "#2E2352" : "#1D1633", 
                  border: "none", 
                  color: "#fff", 
                  font: "600 14.5px 'Instrument Sans',sans-serif", 
                  padding: "10px 20px", 
                  borderRadius: "999px", 
                  cursor: "pointer", 
                  transition: "all .2s",
                  transform: getKeysHover ? "translateY(-1px)" : "none",
                  boxShadow: getKeysHover ? "0 8px 22px rgba(29,22,51,.25)" : "none",
                  textDecoration: "none"
                }}
              >
                Get API keys <span style={{ color: "#FF8FB5" }}>→</span>
              </Link>
            </>
          )}
        </div>
        
      </div>
    </div>
  );
}
