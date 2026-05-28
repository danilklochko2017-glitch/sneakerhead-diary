"use client";

import { useState } from "react";
import type { MonthlyReview } from "@/types/trade";

const D = "var(--font-display)";  // Instrument Serif
const M = "var(--font-mono)";     // DM Mono
const B = "var(--font-body)";     // Geist
const AQUA = "#19d0e8";
const INNER = "#141414";

function ReviewCard({ r }: { r: MonthlyReview }) {
  const [open, setOpen] = useState(false);
  const rrColor = r.netRR >= 0 ? "var(--color-win)" : "var(--color-loss)";

  return (
    <div style={{ backgroundColor: INNER, borderRadius: "var(--radius-default)", overflow: "hidden" }}>

      {/* ── Header ── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "0 16px", minHeight: "64px", cursor: "pointer",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "12px",
          flexWrap: "wrap", textAlign: "left",
        }}
      >
        <h3 style={{ fontFamily: D, fontWeight: 400, fontSize: "18px", lineHeight: 1.1, color: "var(--color-near-white)", letterSpacing: "-0.02em" }}>
          {r.month} {r.year}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          {[
            { l: "Net RR",   v: `${r.netRR >= 0 ? "+" : ""}${r.netRR.toFixed(1)}R`,  c: rrColor },
            { l: "Win Rate", v: `${r.winRate.toFixed(1)}%`,                           c: "var(--color-near-white)" },
            { l: "Trades",   v: String(r.trades),                                     c: "var(--color-near-white)" },
          ].map(item => (
            <div key={item.l} style={{ textAlign: "right" }}>
              <div style={{ fontFamily: M, fontSize: "10px", fontWeight: 500, color: "var(--color-ash-gray)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {item.l}
              </div>
              <div style={{ fontFamily: M, fontSize: "11px", fontWeight: 500, color: item.c }}>
                {item.v}
              </div>
            </div>
          ))}

          <div style={{
            width: "24px", height: "24px", borderRadius: "9999px",
            border: "1px solid var(--color-dark-charcoal)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.25s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 4.5L6 7.5L10 4.5" stroke="var(--color-ash-gray)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ borderTop: "1px solid #0a0a0a" }}>

          {/* Best / Worst */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", backgroundColor: "#0a0a0a", borderBottom: "1px solid #0a0a0a" }}>
            {[
              { l: "Best Trade",  v: `+${r.bestTrade.toFixed(1)}R`,  c: "var(--color-win)"  },
              { l: "Worst Trade", v: `${r.worstTrade.toFixed(1)}R`, c: "var(--color-loss)" },
            ].map(item => (
              <div key={item.l} style={{ padding: "14px 16px", backgroundColor: INNER }}>
                <div style={{ fontFamily: M, fontSize: "10px", fontWeight: 500, color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  {item.l}
                </div>
                <div style={{ fontFamily: M, fontSize: "22px", lineHeight: 1, fontWeight: 500, color: item.c }}>
                  {item.v}
                </div>
              </div>
            ))}
          </div>

          {/* Went well / To improve */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", backgroundColor: "#0a0a0a" }}>
            {[
              { l: "What went well",  body: r.wentWell,  accent: "var(--color-win)" },
              { l: "What to improve", body: r.toImprove, accent: AQUA },
            ].map(item => (
              <div key={item.l} style={{ padding: "16px", backgroundColor: INNER }}>
                <div style={{ fontFamily: M, fontSize: "10px", fontWeight: 500, color: item.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  {item.l}
                </div>
                <p style={{ fontFamily: B, fontSize: "13px", lineHeight: "1.65", color: "var(--color-near-white)", letterSpacing: "-0.01em" }}>
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

export default function MonthlyReviews({ reviews }: { reviews: MonthlyReview[] }) {
  return (
    <div id="reviews" className="card-glow" style={{
      backgroundColor: "var(--surface-card)",
      borderRadius: "var(--radius-cards)",
      padding: "var(--card-padding)",
    }}>
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontFamily: M, fontSize: "10px", fontWeight: 500, color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Monthly Reviews
        </p>
      </div>

      {reviews.length === 0 ? (
        <div style={{ borderRadius: "var(--radius-default)", padding: "48px", textAlign: "center", fontFamily: M, fontSize: "12px", color: "var(--color-ash-gray)", backgroundColor: INNER }}>
          No closed trades yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "#0a0a0a", borderRadius: "var(--radius-default)", overflow: "hidden" }}>
          {reviews.map((r, i) => <ReviewCard key={i} r={r} />)}
        </div>
      )}
    </div>
  );
}
