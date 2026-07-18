"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{
      background: "#F8F8FA",
      borderTop: "1px solid rgba(130, 0, 255, 0.08)",
      padding: "64px 32px 48px",
      fontFamily: "'Instrument Sans', sans-serif",
      color: "#120F24"
    }}>
      <div className="footer-layout" style={{
        maxWidth: "1180px",
        margin: "0 auto",
        marginBottom: "64px"
      }}>
        {/* Branding */}
        <div>
          <div style={{ font: "800 22px 'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
            <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "#8200FF" }}></span>
            Probable
          </div>
          <p style={{ color: "#625E77", fontSize: "14px", lineHeight: "1.6", maxWidth: "260px", margin: 0 }}>
            Financial rails and embeddable compliance middleware for prediction markets.
          </p>
        </div>

        {/* Product links */}
        <div>
          <div style={{ font: "600 11px 'JetBrains Mono', monospace", color: "#9490A8", letterSpacing: "1px", marginBottom: "16px" }}>PRODUCT</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link href="/product#embeds" style={{ color: "#625E77", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"} onMouseLeave={(e) => e.currentTarget.style.color = "#625E77"}>Embeds</Link>
            <Link href="/product#rails" style={{ color: "#625E77", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"} onMouseLeave={(e) => e.currentTarget.style.color = "#625E77"}>Settlement Rails</Link>
            <Link href="/product#shield" style={{ color: "#625E77", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"} onMouseLeave={(e) => e.currentTarget.style.color = "#625E77"}>Shield Gating</Link>
            <Link href="/product#pricing" style={{ color: "#625E77", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"} onMouseLeave={(e) => e.currentTarget.style.color = "#625E77"}>Pricing</Link>
          </div>
        </div>

        {/* Resources links */}
        <div>
          <div style={{ font: "600 11px 'JetBrains Mono', monospace", color: "#9490A8", letterSpacing: "1px", marginBottom: "16px" }}>RESOURCES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link href="/docs" style={{ color: "#625E77", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"} onMouseLeave={(e) => e.currentTarget.style.color = "#625E77"}>Documentation</Link>
            <Link href="/docs" style={{ color: "#625E77", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"} onMouseLeave={(e) => e.currentTarget.style.color = "#625E77"}>API Reference</Link>
            <Link href="/docs" style={{ color: "#625E77", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"} onMouseLeave={(e) => e.currentTarget.style.color = "#625E77"}>Sandbox Console</Link>
            <Link href="/status" style={{ color: "#625E77", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"} onMouseLeave={(e) => e.currentTarget.style.color = "#625E77"}>Live Status</Link>
          </div>
        </div>

        {/* Company links */}
        <div>
          <div style={{ font: "600 11px 'JetBrains Mono', monospace", color: "#9490A8", letterSpacing: "1px", marginBottom: "16px" }}>COMPANY</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link href="/about" style={{ color: "#625E77", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"} onMouseLeave={(e) => e.currentTarget.style.color = "#625E77"}>About us</Link>
            <Link href="/about#careers" style={{ color: "#625E77", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"} onMouseLeave={(e) => e.currentTarget.style.color = "#625E77"}>Careers</Link>
            <Link href="/changelog" style={{ color: "#625E77", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"} onMouseLeave={(e) => e.currentTarget.style.color = "#625E77"}>Changelog</Link>
            <Link href="/onboard" style={{ color: "#625E77", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"} onMouseLeave={(e) => e.currentTarget.style.color = "#625E77"}>Compliance Gating</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: "#625E77", fontSize: "14.5px", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8200FF"} onMouseLeave={(e) => e.currentTarget.style.color = "#625E77"}>GitHub</a>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: "1180px",
        margin: "0 auto",
        paddingTop: "32px",
        borderTop: "1px solid rgba(130, 0, 255, 0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "13px",
        color: "#9490A8"
      }}>
        <span>© {new Date().getFullYear()} Probable Technologies, Inc. All rights reserved.</span>
        <div style={{ display: "flex", gap: "24px" }}>
          <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#120F24"} onMouseLeave={(e) => e.currentTarget.style.color = "#9490A8"}>Privacy Policy</span>
          <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#120F24"} onMouseLeave={(e) => e.currentTarget.style.color = "#9490A8"}>Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}
