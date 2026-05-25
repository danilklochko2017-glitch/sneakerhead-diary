"use client";

import { useEffect, useState, useCallback } from "react";
import type { Trade } from "@/types/trade";

const BODY = "'Bricolage Grotesque', sans-serif";
const MONO: React.CSSProperties = {
  fontFamily: "'Bricolage Grotesque', sans-serif",
};

function fmt(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TradeModal({ trade, onClose }: { trade: Trade; onClose: () => void }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/trade-images/${trade.id}`)
      .then(r => r.json())
      .then(d => { setUrls(d.urls ?? []); setIdx(0); })
      .catch(() => setUrls([]))
      .finally(() => setLoading(false));
  }, [trade.id]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowRight") setIdx(i => Math.min(i + 1, urls.length - 1));
    if (e.key === "ArrowLeft")  setIdx(i => Math.max(i - 1, 0));
  }, [onClose, urls.length]);

  useEffect(() => {
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onKey]);

  const resultColor =
    trade.result === "Win"  ? "#34d399" :
    trade.result === "Loss" ? "#f87171" :
    trade.result === "BE"   ? "#fcd34d" : "#6b7280";
  const resultBg =
    trade.result === "Win"  ? "rgba(52,211,153,0.12)" :
    trade.result === "Loss" ? "rgba(248,113,113,0.12)" :
    trade.result === "BE"   ? "rgba(252,211,77,0.12)" : "rgba(107,114,128,0.08)";
  const resultBorder =
    trade.result === "Win"  ? "rgba(52,211,153,0.4)" :
    trade.result === "Loss" ? "rgba(248,113,113,0.4)" :
    trade.result === "BE"   ? "rgba(252,211,77,0.4)" : "rgba(107,114,128,0.25)";
  const resultLabel = trade.result === "Win" ? "TP" : trade.result === "Loss" ? "SL" : trade.result;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      backgroundColor: "rgba(0,0,0,0.80)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: "#14151a",
        border: "1px solid #3a3a3f",
        borderRadius: "8px",
        width: "100%", maxWidth: "1200px",
        maxHeight: "96vh",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "rgba(0,0,0,0.25) 0px 25px 50px -12px",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #3a3a3f",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "12px", flexWrap: "wrap",
          backgroundColor: "#0d0e11",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <span style={{ ...MONO, fontSize: "17px", fontWeight: 600, color: "#ffffff" }}>{trade.instrument}</span>
            <span style={{ fontFamily: BODY, fontSize: "13px", color: "#6b7280" }}>{fmt(trade.date)}</span>
            <span style={{
              fontFamily: BODY, fontSize: "12px", fontWeight: 600,
              color: resultColor,
              border: `1px solid ${resultBorder}`,
              backgroundColor: resultBg,
              borderRadius: "9999px", padding: "2px 10px",
            }}>{resultLabel}</span>
            <span style={{ ...MONO, fontSize: "13px", fontWeight: 500, color: "#FFF93C" }}>
              {trade.rr > 0 ? "+" : ""}{trade.rr.toFixed(2)}R
            </span>
            {trade.notes && (
              <span style={{
                fontFamily: BODY, fontSize: "12px", color: "#6b7280",
                border: "1px solid rgba(107,114,128,0.25)",
                backgroundColor: "rgba(107,114,128,0.08)",
                borderRadius: "9999px", padding: "2px 10px",
              }}>{trade.notes}</span>
            )}
          </div>

          <button onClick={onClose} aria-label="Close" style={{
            width: "28px", height: "28px", borderRadius: "9999px",
            border: "1px solid #3a3a3f", background: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {loading ? (
            <div style={{
              height: "300px", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: BODY, fontSize: "14px", color: "#6b7280",
            }}>
              Loading…
            </div>
          ) : urls.length === 0 ? (
            <div style={{
              height: "300px", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: BODY, fontSize: "14px", color: "#6b7280",
              border: "1px solid #3a3a3f", borderRadius: "8px",
              backgroundColor: "#0d0e11",
            }}>
              No screenshots attached.
            </div>
          ) : (
            <>
              <div style={{
                position: "relative", borderRadius: "8px",
                overflow: "hidden", backgroundColor: "#0d0e11",
                border: "1px solid #3a3a3f", marginBottom: "12px",
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
                        width: "36px", height: "36px", borderRadius: "9999px",
                        backgroundColor: "rgba(13,14,17,0.85)",
                        border: "1px solid #3a3a3f",
                        cursor: btn.disabled ? "default" : "pointer",
                        opacity: btn.disabled ? 0.3 : 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d={btn.icon} stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ))}
                </>}
              </div>

              {urls.length > 1 && (
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "12px" }}>
                  {urls.map((url, i) => (
                    <button key={i} onClick={() => setIdx(i)} style={{
                      width: "80px", height: "50px",
                      borderRadius: "4px", overflow: "hidden",
                      border: `1px solid ${i === idx ? "#FFF93C" : "#3a3a3f"}`,
                      padding: 0, cursor: "pointer",
                      opacity: i === idx ? 1 : 0.5, transition: "opacity 0.15s, border-color 0.15s",
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Thumb ${i + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </button>
                  ))}
                </div>
              )}

              <div style={{ textAlign: "center", ...MONO, fontSize: "12px", color: "#6b7280" }}>
                {idx + 1} / {urls.length} · ← → navigate · Esc close
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
