"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Ticker from "../../components/Ticker";
import Link from "next/link";
import Footer from "../../components/Footer";
import { getAuthedSdk } from "../../lib/sdk";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [entityType, setEntityType] = useState(0);
  const [useCaseCard, setUseCaseCard] = useState(0);
  const [expectedVolume, setExpectedVolume] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("United States");
  const [generatedApiKey, setGeneratedApiKey] = useState("sk_test_4Jn8Wz1cQm7RtY2vBx5A");

  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("probable_session");
    if (cached) {
      const { token, user } = JSON.parse(cached);
      setUser(user);
      setToken(token);
      setCompanyName(user.name || user.email.split("@")[0]);
    }
  }, []);

  const steps = ["Company", "Use case", "Compliance", "API keys"];
  const entChips = ["C-Corp", "LLC", "Ltd / GmbH", "Nonprofit"];
  const ucCards = [
    { title: "Embed markets", body: "Add live markets to an existing product with the widget." },
    { title: "Settlement rails", body: "Run your own book on our escrow, oracle, and payout stack." },
    { title: "Full exchange", body: "Launch a complete market venue on dedicated infrastructure." }
  ];
  const volChips = ["< $100K", "$100K – $1M", "$1M – $10M", "$10M +"];

  const shieldChecks = [
    { title: "Business verification", sub: "Registry lookup + EIN match", status: "QUEUED", stColor: "#D4842A", stBg: "rgba(212,132,42,.1)" },
    { title: "Beneficial ownership", sub: "UBO declaration, 25% threshold", status: "QUEUED", stColor: "#D4842A", stBg: "rgba(212,132,42,.1)" },
    { title: "Sanctions screening", sub: "OFAC, EU, UN consolidated lists", status: "PASSED", stColor: "#0E9160", stBg: "rgba(23,184,119,.1)" },
    { title: "Bank account", sub: "For fee debits and reserve top-ups", status: "OPTIONAL", stColor: "#A9A2BE", stBg: "rgba(29,24,50,.06)" }
  ];

  const handleNextStep = async () => {
    if (step === 2 && token) {
      try {
        const client = getAuthedSdk(token);
        const keyData = await client.keys.create("test");
        setGeneratedApiKey(keyData.key);
      } catch (e) {
        console.warn("Failed to contact backend key generator, using sandbox default:", e);
      }
    }
    setStep(prev => prev + 1);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFFBF7", color: "#1D1832", fontFamily: "'Instrument Sans',sans-serif" }}>
      <Ticker />
      <Navbar />

      <div data-screen-label="Onboarding" style={{ maxWidth: "760px", margin: "0 auto", padding: "64px 32px 120px" }}>
        <div style={{ textAlign: "center", marginBottom: "38px" }}>
          <h1 style={{ margin: "0 0 12px", font: "800 38px 'Bricolage Grotesque',sans-serif", letterSpacing: "-1.5px" }}>Activate your account</h1>
          <p style={{ color: "#6E6787", fontSize: "15.5px", margin: 0 }}>Four steps. Most accounts are live the same day.</p>
        </div>

        {/* Steps Progress */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: "36px" }}>
          {steps.map((label, i) => {
            const done = i < step;
            const act = i === step;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "110px" }}>
                  <div style={{ 
                    width: "34px", 
                    height: "34px", 
                    borderRadius: "50%", 
                    background: done ? "#17B877" : act ? "#1D1633" : "#fff", 
                    color: done || act ? "#fff" : "#A9A2BE", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    font: "700 13px 'JetBrains Mono',monospace", 
                    border: done ? "2px solid #17B877" : act ? "2px solid #1D1633" : "2px solid rgba(29,24,50,.15)", 
                    transition: "all .3s" 
                  }}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span style={{ font: "600 12px 'Instrument Sans',sans-serif", color: act ? "#1D1832" : "#A9A2BE" }}>{label}</span>
                </div>
                {i < 3 && (
                  <div style={{ width: "56px", height: "2px", background: done ? "#17B877" : "rgba(29,24,50,.12)", margin: "0 -18px 26px", transition: "background .3s" }}></div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ background: "#fff", border: "1px solid rgba(29,24,50,.09)", borderRadius: "22px", padding: "40px", boxShadow: "0 20px 50px rgba(74,42,90,.08)" }}>
          
          {/* STEP 1: Company details */}
          {step === 0 && (
            <div>
              <div style={{ font: "700 21px 'Bricolage Grotesque',sans-serif", marginBottom: "24px" }}>Company details</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13.5px", marginBottom: "7px" }}>Legal company name</div>
                  <input 
                    placeholder="Acme, Inc." 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{ width: "100%", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "11px", padding: "12px 16px", font: "500 14.5px 'Instrument Sans',sans-serif", color: "#1D1832", outline: "none" }} 
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13.5px", marginBottom: "7px" }}>Website</div>
                    <input 
                      placeholder="https://acme.com" 
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      style={{ width: "100%", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "11px", padding: "12px 16px", font: "500 14.5px 'Instrument Sans',sans-serif", color: "#1D1832", outline: "none" }} 
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13.5px", marginBottom: "7px" }}>Country of incorporation</div>
                    <input 
                      placeholder="United States" 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      style={{ width: "100%", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.12)", borderRadius: "11px", padding: "12px 16px", font: "500 14.5px 'Instrument Sans',sans-serif", color: "#1D1832", outline: "none" }} 
                    />
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13.5px", marginBottom: "9px" }}>Entity type</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {entChips.map((label, i) => (
                      <button 
                        key={i} 
                        onClick={() => setEntityType(i)} 
                        style={{ background: entityType === i ? "rgba(240,86,140,.1)" : "#FFFBF7", border: entityType === i ? "1.5px solid #F0568C" : "1.5px solid rgba(29,24,50,.12)", color: entityType === i ? "#D6336C" : "#4A4363", font: "600 13px 'Instrument Sans',sans-serif", padding: "9px 18px", borderRadius: "999px", cursor: "pointer", transition: "all .15s" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Use case details */}
          {step === 1 && (
            <div>
              <div style={{ font: "700 21px 'Bricolage Grotesque',sans-serif", marginBottom: "24px" }}>What are you building?</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "26px" }}>
                {ucCards.map((uc, i) => (
                  <button 
                    key={i}
                    onClick={() => setUseCaseCard(i)} 
                    style={{ textAlign: "left", background: useCaseCard === i ? "rgba(240,86,140,.06)" : "#FFFBF7", border: useCaseCard === i ? "1.5px solid #F0568C" : "1.5px solid rgba(29,24,50,.1)", borderRadius: "15px", padding: "18px", cursor: "pointer", transition: "all .15s" }}>
                    <div style={{ font: "700 15px 'Bricolage Grotesque',sans-serif", color: "#1D1832", marginBottom: "6px" }}>{uc.title}</div>
                    <div style={{ font: "400 12.5px 'Instrument Sans',sans-serif", color: "#6E6787", lineHeight: 1.5 }}>{uc.body}</div>
                  </button>
                ))}
              </div>
              <div style={{ fontWeight: 600, fontSize: "13.5px", marginBottom: "9px" }}>Expected monthly settled volume</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {volChips.map((label, i) => (
                  <button 
                    key={i}
                    onClick={() => setExpectedVolume(i)} 
                    style={{ background: expectedVolume === i ? "rgba(240,86,140,.1)" : "#FFFBF7", border: expectedVolume === i ? "1.5px solid #F0568C" : "1.5px solid rgba(29,24,50,.12)", color: expectedVolume === i ? "#D6336C" : "#4A4363", font: "600 13px 'JetBrains Mono',monospace", padding: "9px 18px", borderRadius: "999px", cursor: "pointer", transition: "all .15s" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Compliance review */}
          {step === 2 && (
            <div>
              <div style={{ font: "700 21px 'Bricolage Grotesque',sans-serif", marginBottom: "8px" }}>Compliance review</div>
              <div style={{ color: "#6E6787", fontSize: "14px", marginBottom: "24px" }}>Shield runs these checks automatically. Nothing to upload for sandbox access.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                {shieldChecks.map((sc, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFBF7", border: "1px solid rgba(29,24,50,.08)", borderRadius: "13px", padding: "16px 20px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14.5px", marginBottom: "3px" }}>{sc.title}</div>
                      <div style={{ fontSize: "12.5px", color: "#A9A2BE" }}>{sc.sub}</div>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", font: "600 11px 'JetBrains Mono',monospace", color: sc.stColor, background: sc.stBg, padding: "5px 12px", borderRadius: "999px", flex: "none" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: sc.stColor }}></span>{sc.status}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ background: "linear-gradient(115deg,#FFE3EC,#EFE9FF)", borderRadius: "13px", padding: "16px 20px", fontSize: "13px", color: "#4A4363", lineHeight: 1.55 }}>
                Production activation requires business verification — typically approved within one business day. Sandbox keys are issued immediately.
              </div>
            </div>
          )}

          {/* STEP 4: API keys ready */}
          {step === 3 && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "26px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(23,184,119,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: "24px", color: "#0E9160", fontWeight: 700 }}>✓</div>
                <div style={{ font: "700 23px 'Bricolage Grotesque',sans-serif", marginBottom: "6px" }}>Your keys are ready</div>
                <div style={{ color: "#6E6787", fontSize: "14px" }}>Sandbox is live now. Production unlocks after review.</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "8px" }}>
                <div style={{ background: "#1D1633", borderRadius: "13px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px" }}>
                  <div>
                    <div style={{ font: "600 10px 'JetBrains Mono',monospace", color: "#8B84A3", letterSpacing: "1px", marginBottom: "6px" }}>SANDBOX SECRET</div>
                    <div style={{ font: "600 13.5px 'JetBrains Mono',monospace", color: "#3ADFA5", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "280px" }}>{generatedApiKey}</div>
                  </div>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(generatedApiKey); alert("API Key copied!"); }}
                    style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", color: "#fff", font: "600 12px 'Instrument Sans',sans-serif", padding: "8px 16px", borderRadius: "999px", cursor: "pointer", flex: "none" }}>Copy</button>
                </div>
                <div style={{ background: "#FFFBF7", border: "1px dashed rgba(29,24,50,.2)", borderRadius: "13px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px" }}>
                  <div>
                    <div style={{ font: "600 10px 'JetBrains Mono',monospace", color: "#A9A2BE", letterSpacing: "1px", marginBottom: "6px" }}>PRODUCTION SECRET</div>
                    <div style={{ font: "600 13.5px 'JetBrains Mono',monospace", color: "#A9A2BE" }}>sk_live_ ································ pending review</div>
                  </div>
                  <span style={{ font: "600 10.5px 'JetBrains Mono',monospace", color: "#D4842A", background: "rgba(212,132,42,.1)", padding: "5px 12px", borderRadius: "999px", flex: "none" }}>IN REVIEW</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(29,24,50,.07)" }}>
            {step > 0 && step < 3 && (
              <button onClick={() => setStep(prev => prev - 1)} style={{ background: "none", border: "none", color: "#6E6787", font: "600 14px 'Instrument Sans',sans-serif", cursor: "pointer" }}>← Back</button>
            )}
            {step < 3 ? (
              <button 
                onClick={handleNextStep}
                disabled={step === 0 && !companyName}
                style={{ marginLeft: "auto", background: "#1D1633", border: "none", color: "#fff", font: "700 14.5px 'Instrument Sans',sans-serif", padding: "12px 26px", borderRadius: "999px", cursor: "pointer", transition: "all .2s", opacity: (step === 0 && !companyName) ? 0.5 : 1 }}>
                Continue <span style={{ color: "#FF8FB5" }}>→</span>
              </button>
            ) : (
              <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
                <Link href="/docs" style={{ background: "#fff", border: "1px solid rgba(29,24,50,.14)", color: "#1D1832", font: "700 14px 'Instrument Sans',sans-serif", padding: "12px 22px", borderRadius: "999px", cursor: "pointer", textDecoration: "none" }}>
                  Read the docs
                </Link>
                <Link href="/dashboard" style={{ background: "#1D1633", border: "none", color: "#fff", font: "700 14px 'Instrument Sans',sans-serif", padding: "12px 22px", borderRadius: "999px", cursor: "pointer", textDecoration: "none" }}>
                  Open dashboard <span style={{ color: "#FF8FB5" }}>→</span>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 32px" }}>
        <Footer />
      </div>
    </div>
  );
}
