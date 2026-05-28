"use client";

import { useEffect, useState, useCallback } from "react";
import type { Trade } from "@/types/trade";

const D = "var(--font-display)";   // Instrument Serif
const M = "var(--font-mono)";      // DM Mono
const AQUA = "#19d0e8";

function fmt(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TradeModal({ trade, onClose }: { trade: Trade; onClose: () => void }) {
  const [urls, setUrls]       = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx]         = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/trade-images/${trade.id}`)
      .then(r => r.json())
      .then(d => { setUrls(d.urls ?? []); setIdx(0); })
      .catch(() => setUrls([]))
      .finally(() => setLoading(false));
  }, [trade.id]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape")      onClose();
    if (e.key === "ArrowRight")  setIdx(i => Math.min(i + 1, urls.length - 1));
    if (e.key === "ArrowLeft")   setIdx(i => Math.max(i - 1, 0));
  }, [onClose, urls.length]);

  useEffect(() => {
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onKey]);

  const resultMap = {
    Win:     { label: "TP", color: "var(--color-win)",  bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.3)"  },
    Loss:    { label: "SL", color: "var(--color-loss)", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.3)" },
    BE:      { label: "BE", color: "var(--color-be)",   bg: "rgba(252,211,77,0.10)",  border: "rgba(252,211,77,0.3)"  },
    Pending: { label: "—",  color: "var(--color-ash-gray)", bg: "transparent", border: "var(--color-dark-charcoal)" },
  };
  const rs = resultMap[trade.result] ?? resultMap.Pending;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      backgroundColor: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: "#191919",
        border: "1px solid var(--color-dark-charcoal)",
        borderRadius: "var(--radius-cards)",
        width: "100%", maxWidth: "1200px",
        maxHeight: "96vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "var(--shadow-sm)",
      }}>
        {/* ── Header ── */}
        <div style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--color-dark-charcoal)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "12px", flexWrap: "wrap",
          backgroundColor: "var(--surface-canvas)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Instrument */}
            <span style={{ fontFamily: D, fontSize: "18px", fontWeight: 400, color: "var(--color-near-white)", letterSpacing: "-0.02em" }}>
              {trade.instrument}
            </span>
            {/* Date */}
            <span style={{ fontFamily: M, fontSize: "12px", color: "var(--color-ash-gray)" }}>{fmt(trade.date)}</span>
            {/* Result tag */}
            <span style={{
              fontFamily: M, fontSize: "12px", fontWeight: 500,
              color: rs.color, border: `1px solid ${rs.border}`,
              backgroundColor: rs.bg,
              borderRadius: "var(--radius-buttons)", padding: "2px 10px", letterSpacing: "0.05em",
            }}>{rs.label}</span>
            {/* RR */}
            <span style={{ fontFamily: M, fontSize: "12px", fontWeight: 500, color: AQUA }}>
              {trade.rr > 0 ? "+" : ""}{trade.rr.toFixed(2)}R
            </span>
            {/* Entry tag */}
            {trade.notes && (
              <span style={{
                fontFamily: M, fontSize: "12px", color: "var(--color-ash-gray)",
                border: "1px solid var(--color-dark-charcoal)",
                backgroundColor: "transparent",
                borderRadius: "var(--radius-buttons)", padding: "2px 10px", letterSpacing: "0.05em",
              }}>{trade.notes}</span>
            )}
          </div>

          <button onClick={onClose} aria-label="Close" style={{
            width: "26px", height: "26px",
            borderRadius: "var(--radius-buttons)",
            border: "1px solid var(--color-dark-charcoal)", background: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="var(--color-ash-gray)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
          {loading ? (
            <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: M, fontSize: "12px", color: "var(--color-ash-gray)" }}>
              Loading…
            </div>
          ) : urls.length === 0 ? (
            <div style={{
              height: "300px", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: M, fontSize: "12px", color: "var(--color-ash-gray)",
              border: "1px solid var(--color-dark-charcoal)", borderRadius: "var(--radius-default)",
              backgroundColor: "var(--surface-canvas)",
            }}>
              No screenshots attached.
            </div>
          ) : (
            <>
              <div style={{
                position: "relative", borderRadius: "var(--radius-default)",
                overflow: "hidden", backgroundColor: "var(--surface-canvas)",
                border: "1px solid var(--color-dark-charcoal)", marginBottom: "10px",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={urls[idx]} src={urls[idx]} alt={`Screenshot ${idx + 1}`}
                  style={{ width: "100%", height: "auto", maxHeight: "72vh", objectFit: "contain", display: "block" }} />

                {urls.length > 1 && <>
                  {[
                    { dir: "left",  icon: "M8 2L3 6.5L8 11", disabled: idx === 0,               action: () => setIdx(i => Math.max(i - 1, 0)) },
                    { dir: "right", icon: "M4 2L9 6.5L4 11", disabled: idx === urls.length - 1, action: () => setIdx(i => Math.min(i + 1, urls.length - 1)) },
                  ].map(btn => (
                    <button key={btn.dir} onClick={btn.action} disabled={btn.disabled}
                      style={{
                        position: "absolute", top: "50%",
                        [btn.dir]: "12px",
                        transform: "translateY(-50%)",
                        width: "32px", height: "32px",
                        borderRadius: "var(--radius-buttons)",
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid var(--color-dark-charcoal)",
                        cursor: btn.disabled ? "default" : "pointer",
                        opacity: btn.disabled ? 0.3 : 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d={btn.icon} stroke="var(--color-ash-gray)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ))}
                </>}
              </div>

              {urls.length > 1 && (
                <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap", marginBottom: "10px" }}>
                  {urls.map((url, i) => (
                    <button key={i} onClick={() => setIdx(i)} style={{
                      width: "72px", height: "46px",
                      borderRadius: "var(--radius-small)", overflow: "hidden",
                      border: `1px solid ${i === idx ? AQUA : "var(--color-dark-charcoal)"}`,
                      padding: 0, cursor: "pointer",
                      opacity: i === idx ? 1 : 0.45, transition: "opacity 0.15s, border-color 0.15s",
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Thumb ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </button>
                  ))}
                </div>
              )}

              <div style={{ textAlign: "center", fontFamily: M, fontSize: "12px", color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {idx + 1} / {urls.length} · ← → navigate · Esc close
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
