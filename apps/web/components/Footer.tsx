"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{
      background: "#FFFBF7",
      borderTop: "1px solid rgba(29, 24, 50, 0.08)",
      padding: "64px 32px 48px",
      fontFamily: "'Instrument Sans', sans-serif",
      color: "#1D1832"
    }}>
      <div className="footer-layout" style={{
        maxWidth: "1180px",
        margin: "0 auto",
        marginBottom: "64px"
      }}>
        {/* Branding */}
        <div>
          <div style={{ font: "800 22px 'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
            <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "#F0568C" }}></span>
            Probable
          </div>
          <p style={{ color: "#6E6787", fontSize: "14px", lineHeight: "1.6", maxWidth: "260px", margin: 0 }}>
            Financial rails and embeddable compliance middleware for prediction markets.
          </p>
        </div>

        {/* Product links */}
        <div>
          <div style={{ font: "600 11px 'JetBrains Mono', monospace", color: "#A9A2BE", letterSpacing: "1px", marginBottom: "16px" }}>PRODUCT</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link href="/product#embeds" style={{ color: "#6E6787", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"} onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}>Embeds</Link>
            <Link href="/product#rails" style={{ color: "#6E6787", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"} onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}>Settlement Rails</Link>
            <Link href="/product#shield" style={{ color: "#6E6787", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"} onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}>Shield Gating</Link>
            <Link href="/product#pricing" style={{ color: "#6E6787", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"} onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}>Pricing</Link>
          </div>
        </div>

        {/* Resources links */}
        <div>
          <div style={{ font: "600 11px 'JetBrains Mono', monospace", color: "#A9A2BE", letterSpacing: "1px", marginBottom: "16px" }}>RESOURCES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link href="/docs" style={{ color: "#6E6787", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"} onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}>Documentation</Link>
            <Link href="/docs" style={{ color: "#6E6787", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"} onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}>API Reference</Link>
            <Link href="/docs" style={{ color: "#6E6787", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"} onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}>Sandbox Console</Link>
            <Link href="/status" style={{ color: "#6E6787", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"} onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}>Live Status</Link>
          </div>
        </div>

        {/* Company links */}
        <div>
          <div style={{ font: "600 11px 'JetBrains Mono', monospace", color: "#A9A2BE", letterSpacing: "1px", marginBottom: "16px" }}>COMPANY</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link href="/about" style={{ color: "#6E6787", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"} onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}>About us</Link>
            <Link href="/about#careers" style={{ color: "#6E6787", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"} onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}>Careers</Link>
            <Link href="/changelog" style={{ color: "#6E6787", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"} onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}>Changelog</Link>
            <Link href="/onboard" style={{ color: "#6E6787", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"} onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}>Compliance Gating</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: "#6E6787", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#D6336C"} onMouseLeave={(e) => e.currentTarget.style.color = "#6E6787"}>GitHub</a>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: "1180px",
        margin: "0 auto",
        paddingTop: "32px",
        borderTop: "1px solid rgba(29, 24, 50, 0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "13px",
        color: "#A9A2BE"
      }}>
        <span>© {new Date().getFullYear()} Probable Technologies, Inc. All rights reserved.</span>
        <div style={{ display: "flex", gap: "24px" }}>
          <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#1D1832"} onMouseLeave={(e) => e.currentTarget.style.color = "#A9A2BE"}>Privacy Policy</span>
          <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#1D1832"} onMouseLeave={(e) => e.currentTarget.style.color = "#A9A2BE"}>Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}
