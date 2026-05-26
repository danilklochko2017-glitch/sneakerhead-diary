"use client";

import { useState } from "react";
import type { MonthlyReview } from "@/types/trade";

const DISPLAY = "var(--font-space-mono), monospace";
const BODY    = "var(--font-space-mono), monospace";
const MONO    = "var(--font-space-mono), monospace";
const INNER   = "#22242A";

function ReviewCard({ r }: { r: MonthlyReview }) {
  const [open, setOpen] = useState(false);
  const rrColor = r.netRR >= 0 ? "#34d399" : "#f87171";

  return (
    <div style={{
      backgroundColor: INNER,
      borderRadius: "10px", overflow: "hidden",
    }}>
      {/* ── Accordion header ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "16px 20px", cursor: "pointer",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "12px",
          flexWrap: "wrap", textAlign: "left",
        }}
      >
        {/* Left: month heading */}
        <div>
          <h3 style={{
            fontFamily: DISPLAY, fontWeight: 700, fontSize: "18px",
            lineHeight: 1.1, color: "#ffffff", letterSpacing: "-0.01em",
          }}>
            {r.month} {r.year}
          </h3>
        </div>

        {/* Right: quick stats + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          {[
            { l: "Net RR",   v: `${r.netRR >= 0 ? "+" : ""}${r.netRR.toFixed(1)}R`, c: rrColor },
            { l: "Win Rate", v: `${r.winRate.toFixed(1)}%`,                          c: "#e5e7eb" },
            { l: "Trades",   v: String(r.trades),                                    c: "#e5e7eb" },
          ].map((item) => (
            <div key={item.l} style={{ textAlign: "right" }}>
              <div style={{
                fontFamily: BODY, fontSize: "10px", fontWeight: 600,
                color: "#6b7280", marginBottom: "2px",
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                {item.l}
              </div>
              <div style={{ fontFamily: MONO, fontSize: "15px", fontWeight: 700, color: item.c }}>
                {item.v}
              </div>
            </div>
          ))}

          <div style={{
            width: "26px", height: "26px", borderRadius: "9999px",
            border: "1px solid #3a3a3f",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.25s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4.5L6 7.5L10 4.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ borderTop: "1px solid #3a3a3f" }}>
          {/* Best / Worst trade */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "1px", backgroundColor: "#3a3a3f",
            borderBottom: "1px solid #3a3a3f",
          }}>
            {[
              { l: "Best Trade",  v: `+${r.bestTrade.toFixed(1)}R`,  c: "#34d399" },
              { l: "Worst Trade", v: `${r.worstTrade.toFixed(1)}R`, c: "#f87171" },
            ].map((item) => (
              <div key={item.l} style={{ padding: "16px 20px", backgroundColor: INNER }}>
                <div style={{
                  fontFamily: BODY, fontSize: "10px", fontWeight: 600,
                  color: "#6b7280", textTransform: "uppercase",
                  letterSpacing: "0.06em", marginBottom: "6px",
                }}>
                  {item.l}
                </div>
                <div style={{
                  fontFamily: MONO, fontSize: "26px", lineHeight: 1,
                  fontWeight: 700, color: item.c,
                }}>
                  {item.v}
                </div>
              </div>
            ))}
          </div>

          {/* Went well / To improve */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "1px", backgroundColor: "#3a3a3f",
          }}>
            {[
              { l: "What went well",  body: r.wentWell,  accent: "#34d399" },
              { l: "What to improve", body: r.toImprove, accent: "#FFF93C" },
            ].map((item) => (
              <div key={item.l} style={{ padding: "20px", backgroundColor: INNER }}>
                <div style={{
                  fontFamily: BODY, fontSize: "10px", fontWeight: 600,
                  color: item.accent, textTransform: "uppercase",
                  letterSpacing: "0.06em", marginBottom: "10px",
                }}>
                  {item.l}
                </div>
                <p style={{ fontFamily: BODY, fontSize: "13px", lineHeight: "1.65", color: "#6b7280" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface MonthlyReviewsProps {
  reviews: MonthlyReview[];
}

export default function MonthlyReviews({ reviews }: MonthlyReviewsProps) {
  return (
    <div id="reviews" className="card-glow" style={{
      backgroundColor: "#14151a",
      borderRadius: "12px",
      boxShadow: "0 8px 48px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
      padding: "32px",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <p style={{
          fontFamily: BODY, fontSize: "11px", fontWeight: 600,
          color: "#6b7280", marginBottom: "6px",
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          Reflection
        </p>
        <h2 style={{
          fontFamily: DISPLAY, fontWeight: 700, fontSize: "24px",
          lineHeight: 1.1, color: "#ffffff", letterSpacing: "-0.01em",
        }}>
          Monthly Reviews
        </h2>
      </div>

      {reviews.length === 0 ? (
        <div style={{
          borderRadius: "10px", padding: "48px",
          textAlign: "center", fontFamily: BODY, fontSize: "14px",
          color: "#6b7280", backgroundColor: INNER,
        }}>
          No closed trades yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {reviews.map((r, i) => <ReviewCard key={i} r={r} />)}
        </div>
      )}
    </div>
  );
}
