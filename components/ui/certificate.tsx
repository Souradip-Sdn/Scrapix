"use client";

import React, { useEffect, useRef, useState } from "react";

export interface CertificateProps {
  customerName: string;
  pickupDate?: string | Date;
  billNo?: string;
  weightKg?: number;
  category?: string;
}

/* A4 landscape aspect ratio (297 x 210 mm -> 1.4142 : 1) */
const ASPECT_PADDING = (210 / 297) * 100;

const ScrapixCertificate: React.FC<CertificateProps> = ({
  customerName,
  pickupDate,
  billNo,
  weightKg,
  category,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(900);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => setCw(e[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const formattedDate = (() => {
    const d = pickupDate ? new Date(pickupDate) : new Date();
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  })();

  const s = (px: number) => `${(px / 900) * cw}px`;

  // Gracefully format all-caps names into title case for script font elegance
  const displayName = (() => {
    if (!customerName) return "Valued Contributor";
    const trimmed = customerName.trim();
    if (trimmed === trimmed.toUpperCase()) {
      return trimmed
        .toLowerCase()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
    return trimmed;
  })();

  // Dynamically calculate font size so long names never wrap into two lines
  const nameFontSize =
    displayName.length > 28 ? s(28) : displayName.length > 18 ? s(32) : s(37);

  const certId = billNo ? `SPX-ECO-${billNo.replace(/\D/g, "").slice(-8) || "2026"}` : "SPX-ECO-2026-HERO";

  const co2Saved = weightKg ? Math.max(1, Math.round(weightKg * 1.8)) : null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
          `,
        }}
      />
      <div
        ref={wrapRef}
        id="scrapix-certificate"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          paddingBottom: `${ASPECT_PADDING}%`,
          fontFamily: "'Inter', sans-serif",
          userSelect: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(145deg, #fbfbf6 0%, #f2f8f3 40%, #eaf4ed 100%)",
            overflow: "hidden",
          }}
        >
          {/* Outer gold border */}
          <div
            style={{
              position: "absolute",
              inset: s(9),
              border: `${s(2.5)} solid #b8933f`,
              borderRadius: s(4),
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          {/* Inner emerald border */}
          <div
            style={{
              position: "absolute",
              inset: s(17),
              border: `${s(1.5)} solid #0a3a20`,
              borderRadius: s(2),
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          {/* Delicate eco dashed pinstripe */}
          <div
            style={{
              position: "absolute",
              inset: s(21),
              border: `1px dashed rgba(16,185,129,0.32)`,
              borderRadius: s(2),
              pointerEvents: "none",
              zIndex: 2,
            }}
          />

          {/* Botanical leaf corner ornaments */}
          {[
            { top: s(8), left: s(8) },
            { top: s(8), right: s(8), transform: "scaleX(-1)" },
            { bottom: s(8), left: s(8), transform: "scaleY(-1)" },
            { bottom: s(8), right: s(8), transform: "scale(-1,-1)" },
          ].map((pos, i) => (
            <svg
              key={i}
              width={s(66)}
              height={s(66)}
              viewBox="0 0 65 65"
              style={{ position: "absolute", zIndex: 3, pointerEvents: "none", ...pos }}
            >
              <path d="M4 4 L26 4 L4 26 Z" fill="#b8933f" opacity="0.85" />
              <path d="M4 4 L44 4" stroke="#b8933f" strokeWidth="1.5" fill="none" />
              <path d="M4 4 L4 44" stroke="#b8933f" strokeWidth="1.5" fill="none" />
              <circle cx="4" cy="4" r="3" fill="#0a3a20" />
              <path
                d="M10 10 Q28 24 48 48"
                stroke="#15803d"
                strokeWidth="1.2"
                fill="none"
                opacity="0.8"
              />
              <path d="M18 16 C14 10 17 8 20 13 C22 17 20 20 18 16Z" fill="#15803d" />
              <path d="M22 24 C28 20 26 17 22 20 C18 23 18 26 22 24Z" fill="#16a34a" />
              <path d="M30 28 C26 22 29 20 32 25 C34 29 32 32 30 28Z" fill="#15803d" />
              <path d="M36 36 C42 32 40 29 36 32 C32 35 32 38 36 36Z" fill="#16a34a" />
              <circle cx="48" cy="48" r="2" fill="#b8933f" />
            </svg>
          ))}

          {/* Eco watermark (Circular recycling loops + delicate foliage) */}
          <svg
            viewBox="0 0 300 300"
            style={{
              position: "absolute",
              right: "3%",
              bottom: "7%",
              width: s(280),
              height: s(280),
              opacity: 0.042,
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <circle cx="150" cy="150" r="130" stroke="#0a3a20" strokeWidth="4" strokeDasharray="8,6" fill="none" />
            <path
              d="M150 40 C210 40 260 90 260 150 C260 210 210 260 150 260 C90 260 40 210 40 150 C40 90 90 40 150 40 Z"
              fill="none"
              stroke="#0a3a20"
              strokeWidth="2"
            />
            <path d="M150 75 C115 110 115 170 150 215 C185 170 185 110 150 75 Z" fill="#0a3a20" />
            <path d="M75 150 C110 115 170 115 215 150 C170 185 110 185 75 150 Z" fill="#0a3a20" />
          </svg>

          {/* Left vertical eco ribbon stripe */}
          <div
            style={{
              position: "absolute",
              left: s(27),
              top: s(25),
              bottom: s(25),
              width: s(4),
              background:
                "linear-gradient(to bottom, transparent, #b8933f 15%, #15803d 40%, #0a3a20 60%, #b8933f 85%, transparent)",
              borderRadius: s(2),
              zIndex: 2,
            }}
          />

          {/* CONTENT LAYER */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingLeft: s(48),
              paddingRight: s(36),
              paddingTop: s(18),
              paddingBottom: s(22),
              zIndex: 5,
              boxSizing: "border-box",
            }}
          >
            {/* Header: Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: s(10),
                marginBottom: s(4),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Scrapix Logo"
                style={{ height: s(42), width: "auto", display: "block" }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-text.png"
                alt="Scrapix"
                style={{ height: s(28), width: "auto", display: "block" }}
              />
            </div>

            {/* Gold-green header divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: s(10),
                width: "68%",
                marginBottom: s(5),
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background:
                    "linear-gradient(to right, transparent, #b8933f 40%, #15803d)",
                }}
              />
              <span style={{ color: "#15803d", fontSize: s(11) }}>✦</span>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background:
                    "linear-gradient(to left, transparent, #b8933f 40%, #15803d)",
                }}
              />
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: s(25),
                fontWeight: 700,
                letterSpacing: s(4.5),
                color: "#0a3a20",
                margin: 0,
                textTransform: "uppercase",
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              Certificate
            </h1>
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: s(10),
                letterSpacing: s(5),
                color: "#b8933f",
                margin: `${s(2)} 0 ${s(5)}`,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              of Appreciation
            </p>

            {/* Eco leaf ornamental rule */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: s(8),
                marginBottom: s(6),
                width: "55%",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "#c5a05970" }} />
              <svg width={s(16)} height={s(16)} viewBox="0 0 20 20">
                <path
                  d="M10 2 C6 5 2 9 10 18 C18 9 14 5 10 2Z"
                  fill="#15803d"
                  opacity="0.8"
                />
                <line x1="10" y1="3" x2="10" y2="17" stroke="#b8933f" strokeWidth="0.8" opacity="0.7" />
              </svg>
              <div style={{ flex: 1, height: "1px", background: "#c5a05970" }} />
            </div>

            {/* Presented to */}
            <p
              style={{
                fontSize: s(8.5),
                fontWeight: 600,
                letterSpacing: s(2.2),
                color: "#406437",
                textTransform: "uppercase",
                margin: `0 0 ${s(2)}`,
              }}
            >
              This Certificate is Proudly Presented to
            </p>

            {/* CUSTOMER NAME - Sized harmoniously with leaf sprigs flanking */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: s(10),
                width: "82%",
                margin: `0 0 ${s(2)}`,
              }}
            >
              {/* Left botanical flourish */}
              <svg
                width={s(46)}
                height={s(16)}
                viewBox="0 0 50 18"
                fill="none"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M48 9 C35 9 12 9 2 9"
                  stroke="#b8933f"
                  strokeWidth="0.8"
                  strokeDasharray="2,2"
                />
                <path
                  d="M12 9 C8 4 3 6 4 9 C5 12 10 13 12 9Z"
                  fill="#15803d"
                  opacity="0.85"
                />
                <path
                  d="M23 9 C19 3 14 5 15 9 C16 13 21 14 23 9Z"
                  fill="#16a34a"
                  opacity="0.8"
                />
                <path
                  d="M34 9 C30 4 25 6 26 9 C27 13 32 14 34 9Z"
                  fill="#15803d"
                  opacity="0.75"
                />
                <circle cx="49" cy="9" r="1.8" fill="#b8933f" />
              </svg>

              <h2
                style={{
                  fontFamily: "'Great Vibes', cursive",
                  fontSize: nameFontSize,
                  fontWeight: 400,
                  color: "#0a3a20",
                  margin: 0,
                  lineHeight: 1.15,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  textShadow: "1px 1px 4px rgba(184,147,63,0.18)",
                }}
              >
                {displayName}
              </h2>

              {/* Right botanical flourish (mirrored) */}
              <svg
                width={s(46)}
                height={s(16)}
                viewBox="0 0 50 18"
                fill="none"
                style={{ flexShrink: 0, transform: "scaleX(-1)" }}
              >
                <path
                  d="M48 9 C35 9 12 9 2 9"
                  stroke="#b8933f"
                  strokeWidth="0.8"
                  strokeDasharray="2,2"
                />
                <path
                  d="M12 9 C8 4 3 6 4 9 C5 12 10 13 12 9Z"
                  fill="#15803d"
                  opacity="0.85"
                />
                <path
                  d="M23 9 C19 3 14 5 15 9 C16 13 21 14 23 9Z"
                  fill="#16a34a"
                  opacity="0.8"
                />
                <path
                  d="M34 9 C30 4 25 6 26 9 C27 13 32 14 34 9Z"
                  fill="#15803d"
                  opacity="0.75"
                />
                <circle cx="49" cy="9" r="1.8" fill="#b8933f" />
              </svg>
            </div>

            {/* Name underline divider */}
            <div
              style={{
                width: "48%",
                height: "1px",
                background:
                  "linear-gradient(to right, transparent, #b8933f 20%, #15803d 50%, #b8933f 80%, transparent)",
                marginBottom: s(6),
              }}
            />

            {/* Body copy */}
            <p
              style={{
                fontSize: s(9.2),
                color: "#2f4f28",
                lineHeight: 1.65,
                textAlign: "center",
                maxWidth: "72%",
                margin: `0 0 ${s(10)}`,
                fontWeight: 300,
              }}
            >
              in formal recognition of outstanding environmental stewardship and active
              participation in the{" "}
              <strong style={{ fontWeight: 600, color: "#0a3a20" }}>
                Scrapix Circular Economy Initiative
              </strong>
              {category ? ` for scientific recycling of ${category} scrap` : ""} —
              diverting hazardous electronic waste from landfills and championing a greener,
              sustainable India.
            </p>

            {/* ── GO-GREEN IMPACT & ECO ARTISTRY SECTION (Free-standing enlarged photos + verified metrics) ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "94%",
                marginBottom: s(12),
                gap: s(10),
              }}
            >
              {/* Left Flank: E-Waste Circular Globe PNG (Free-standing, significantly enlarged, cleanly placed) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  width: s(172),
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/go-green.png"
                  alt="E-Waste Circular Planet"
                  style={{
                    height: s(168),
                    width: s(172),
                    maxWidth: s(172),
                    objectFit: "contain",
                    display: "block",
                    filter: "drop-shadow(0 8px 20px rgba(21,128,61,0.28))",
                  }}
                />
              </div>

              {/* Center: Verified Impact & Eco Records Plaque */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: `${s(8)} ${s(12)} ${s(8)}`,
                  background:
                    "linear-gradient(135deg, rgba(236,253,245,0.85) 0%, rgba(240,253,244,0.65) 50%, rgba(254,252,232,0.72) 100%)",
                  border: "1px dashed rgba(22,163,74,0.36)",
                  borderRadius: s(12),
                  boxShadow: "0 2px 10px rgba(22,163,74,0.06)",
                }}
              >
                {/* Top strip banner */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    marginBottom: s(6),
                    paddingBottom: s(4),
                    borderBottom: "1px solid rgba(22,163,74,0.2)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: s(5) }}>
                    <span style={{ fontSize: s(9.5) }}>🌿</span>
                    <span
                      style={{
                        fontSize: s(7.2),
                        letterSpacing: s(1.5),
                        fontWeight: 700,
                        color: "#0f5132",
                        textTransform: "uppercase",
                      }}
                    >
                      Verified Environmental Impact Record
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: s(6.8),
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: "#0a3a20",
                      background: "rgba(22,163,74,0.12)",
                      padding: `${s(1.5)} ${s(6)}`,
                      borderRadius: s(6),
                      letterSpacing: s(0.6),
                    }}
                  >
                    {certId}
                  </span>
                </div>

                {/* 4 Catchy Eco-Achievement Metric Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: s(6),
                    width: "100%",
                  }}
                >
                  {/* 1: E-Waste Diverted */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #16a34a44",
                      borderRadius: s(9),
                      padding: `${s(5)} ${s(6)}`,
                      display: "flex",
                      alignItems: "center",
                      gap: s(6),
                      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                    }}
                  >
                    <svg width={s(22)} height={s(22)} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="11" fill="#ecfdf5" stroke="#16a34a" strokeWidth="1.2" />
                      <path d="M12 5 L14 8 H10 Z M18 14 L17 11 L14 13 Z M6 14 L9 13 L8 11 Z" fill="#15803d" />
                      <path
                        d="M12 7 C15 7 17 9 17 12 M16 15 C14 17 10 17 8 15 M7 12 C7 9 9 7 11 7"
                        stroke="#15803d"
                        strokeWidth="1.4"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: s(7.8), fontWeight: 800, color: "#0f5132" }}>
                        {weightKg ? `${weightKg} KG` : "100%"}
                      </span>
                      <span style={{ fontSize: s(6), color: "#16a34a", fontWeight: 600 }}>
                        Recycled
                      </span>
                    </div>
                  </div>

                  {/* 2: Carbon Footprint Reduced */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #10b98144",
                      borderRadius: s(9),
                      padding: `${s(5)} ${s(6)}`,
                      display: "flex",
                      alignItems: "center",
                      gap: s(6),
                      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                    }}
                  >
                    <svg width={s(22)} height={s(22)} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="11" fill="#f0fdf4" stroke="#10b981" strokeWidth="1.2" />
                      <path d="M12 17 C12 11 16 7 19 6 C19 10 17 15 12 17 Z" fill="#16a34a" />
                      <path d="M12 17 C12 12 9 9 6 8 C6 12 8 16 12 17 Z" fill="#22c55e" />
                      <path d="M12 17 V7" stroke="#0f5132" strokeWidth="1" />
                    </svg>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: s(7.8), fontWeight: 800, color: "#065f46" }}>
                        {co2Saved ? `${co2Saved} KG` : "OFFSET"}
                      </span>
                      <span style={{ fontSize: s(6), color: "#059669", fontWeight: 600 }}>
                        CO₂ Saved
                      </span>
                    </div>
                  </div>

                  {/* 3: Toxic Leach Avoided */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #0284c744",
                      borderRadius: s(9),
                      padding: `${s(5)} ${s(6)}`,
                      display: "flex",
                      alignItems: "center",
                      gap: s(6),
                      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                    }}
                  >
                    <svg width={s(22)} height={s(22)} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="11" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.2" />
                      <path d="M12 3 L18 6 V11 C18 15 12 19 12 19 C12 19 6 15 6 11 V6 Z" fill="#0284c7" opacity="0.2" stroke="#0284c7" strokeWidth="1.2" />
                      <path d="M9 11 L11 13 L15 9" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: s(7.8), fontWeight: 800, color: "#0369a1" }}>
                        LEAD & HG
                      </span>
                      <span style={{ fontSize: s(6), color: "#0284c7", fontWeight: 600 }}>
                        Neutralized
                      </span>
                    </div>
                  </div>

                  {/* 4: Eco Hero Honor */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #b8933f44",
                      borderRadius: s(9),
                      padding: `${s(5)} ${s(6)}`,
                      display: "flex",
                      alignItems: "center",
                      gap: s(6),
                      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                    }}
                  >
                    <svg width={s(22)} height={s(22)} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="11" fill="#fffbeb" stroke="#b8933f" strokeWidth="1.2" />
                      <path d="M12 4 L14 9 H19 L15 12 L16.5 17 L12 14 L7.5 17 L9 12 L5 9 H10 Z" fill="#b8933f" />
                    </svg>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: s(7.8), fontWeight: 800, color: "#78350f" }}>
                        ECO HERO
                      </span>
                      <span style={{ fontSize: s(6), color: "#b45309", fontWeight: 600 }}>
                        Citizen Honor
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom compliance pledge quote */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: s(5),
                    marginTop: s(5),
                    paddingTop: s(3),
                    width: "100%",
                  }}
                >
                  <span style={{ color: "#b8933f", fontSize: s(7) }}>✦</span>
                  <span
                    style={{
                      fontSize: s(6.4),
                      fontWeight: 500,
                      color: "#275e38",
                      fontStyle: "italic",
                      textAlign: "center",
                    }}
                  >
                    Executed under ISO 14001 Standards & CPCB E-Waste Management Rules
                  </span>
                  <span style={{ color: "#b8933f", fontSize: s(7) }}>✦</span>
                </div>
              </div>

              {/* Right Flank: Go-Green Circular Earth PNG (Free-standing, enlarged, cleanly placed) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  width: s(160),
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/go-green-2.png"
                  alt="Go Green Circular Earth"
                  style={{
                    height: s(156),
                    width: s(156),
                    maxWidth: s(156),
                    objectFit: "contain",
                    display: "block",
                    filter: "drop-shadow(0 8px 20px rgba(22,163,74,0.26))",
                  }}
                />
              </div>
            </div>

            {/* Footer: Signatures + Prestigious Eco Seal */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                width: "74%",
                marginTop: "auto",
              }}
            >
              {/* Director signature */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: s(135),
                }}
              >
                <div
                  style={{
                    height: s(42),
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    marginBottom: s(2),
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/sign.png"
                    alt="Director Signature"
                    style={{
                      height: s(42),
                      width: "auto",
                      maxHeight: s(42),
                      maxWidth: s(115),
                      objectFit: "contain",
                      display: "block",
                      pointerEvents: "none",
                    }}
                  />
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "1px",
                    background: "#b8933f",
                    marginBottom: s(4),
                  }}
                />
                <span
                  style={{
                    fontSize: s(7.8),
                    fontWeight: 700,
                    letterSpacing: s(1.8),
                    color: "#0a3a20",
                    textTransform: "uppercase",
                  }}
                >
                  Director
                </span>
              </div>

              {/* Center: Prestigious Gold & Emerald Seal with Ribbon Tails */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  paddingBottom: s(2),
                }}
              >
                {/* Dual green ribbon tails hanging underneath */}
                <svg
                  width={s(46)}
                  height={s(26)}
                  viewBox="0 0 50 28"
                  style={{
                    position: "absolute",
                    bottom: s(10),
                    zIndex: 0,
                    pointerEvents: "none",
                  }}
                >
                  <path d="M17 0 L7 24 L14 20 L21 24 L22 0 Z" fill="#0f5132" />
                  <path d="M33 0 L29 24 L36 20 L43 24 L33 0 Z" fill="#15803d" />
                </svg>

                {/* Circular Gold-Emerald Seal */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <svg width={s(66)} height={s(66)} viewBox="0 0 80 80">
                    {/* 16-point Gold sunburst teeth */}
                    {Array.from({ length: 16 }).map((_, i) => {
                      const angle = (i / 16) * 360;
                      const r1 = 38,
                        r2 = 33;
                      const a1 = ((angle - 6) * Math.PI) / 180;
                      const a2 = ((angle + 6) * Math.PI) / 180;
                      const pts = [
                        `${40 + r1 * Math.cos(a1)},${40 + r1 * Math.sin(a1)}`,
                        `${40 + r1 * Math.cos(a2)},${40 + r1 * Math.sin(a2)}`,
                        `${40 + r2 * Math.cos(a2)},${40 + r2 * Math.sin(a2)}`,
                        `${40 + r2 * Math.cos(a1)},${40 + r2 * Math.sin(a1)}`,
                      ].join(" ");
                      return <polygon key={i} points={pts} fill="#b8933f" />;
                    })}

                    {/* Dark forest green center */}
                    <circle cx="40" cy="40" r="29" fill="#0a3a20" />
                    <circle
                      cx="40"
                      cy="40"
                      r="25.5"
                      fill="none"
                      stroke="#b8933f"
                      strokeWidth="1.2"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="23"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="0.8"
                      strokeDasharray="2,2"
                    />

                    {/* Center radiant recycling leaf icon */}
                    <g transform="translate(40,40)">
                      <path
                        d="M0 -12 C-8 -7 -7 5 0 12 C7 5 8 -7 0 -12Z"
                        fill="#22c55e"
                      />
                      <line
                        x1="0"
                        y1="-12"
                        x2="0"
                        y2="12"
                        stroke="#0a3a20"
                        strokeWidth="1"
                        opacity="0.8"
                      />
                      <path
                        d="M0 -3 L-5 2"
                        stroke="#0a3a20"
                        strokeWidth="0.8"
                        opacity="0.7"
                      />
                      <path
                        d="M0 3 L5 -2"
                        stroke="#0a3a20"
                        strokeWidth="0.8"
                        opacity="0.7"
                      />
                    </g>
                  </svg>
                </div>
                <span
                  style={{
                    position: "relative",
                    zIndex: 2,
                    fontSize: s(6.8),
                    fontWeight: 700,
                    letterSpacing: s(1.4),
                    color: "#b8933f",
                    textTransform: "uppercase",
                    marginTop: s(1),
                  }}
                >
                  Certified Green
                </span>
              </div>

              {/* Date */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: s(135),
                }}
              >
                <div
                  style={{
                    height: s(42),
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    marginBottom: s(2),
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Great Vibes', cursive",
                      fontSize: s(20),
                      color: "#0a3a20",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formattedDate}
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "1px",
                    background: "#b8933f",
                    marginBottom: s(4),
                  }}
                />
                <span
                  style={{
                    fontSize: s(7.8),
                    fontWeight: 700,
                    letterSpacing: s(1.8),
                    color: "#0a3a20",
                    textTransform: "uppercase",
                  }}
                >
                  Date
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScrapixCertificate;

