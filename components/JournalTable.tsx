"use client";

import { useState, useMemo } from "react";
import type { Trade, TradeStats } from "@/types/trade";
import { formatRR, formatWinRate, calculateStats } from "@/lib/calculations";
import TradeModal from "@/components/TradeModal";

const DISPLAY = "'Unbounded', sans-serif";
const BODY    = "'Bricolage Grotesque', sans-serif";

function Tag({ label, color = "#6b7280" }: { label: string; color?: string }) {
  const isNeutral = color === "#6b7280";
  const bg = isNeutral
    ? "rgba(107,114,128,0.08)"
    : color === "#34d399" ? "rgba(52,211,153,0.12)"
    : color === "#f87171" ? "rgba(248,113,113,0.12)"
    : color === "#fcd34d" ? "rgba(252,211,77,0.12)"
    : color === "#FFF93C" ? "rgba(255,249,60,0.10)"
    : "rgba(107,114,128,0.08)";
  const border = isNeutral ? "rgba(107,114,128,0.25)" : color;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px",
      border: `1px solid ${border}`,
      borderRadius: "9999px", fontSize: "12px",
      fontFamily: BODY, fontWeight: 500, color,
      backgroundColor: bg,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function ResultTag({ result }: { result: Trade["result"] }) {
  if (result === "Win")  return <Tag label="TP" color="#34d399" />;
  if (result === "Loss") return <Tag label="SL" color="#f87171" />;
  if (result === "BE")   return <Tag label="BE" color="#fcd34d" />;
  return <Tag label="—" />;
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const INNER     = "#22242A";
const INNER_ALT = "#282B33"; // zebra — slightly lighter

const TH: React.CSSProperties = {
  fontFamily: BODY, fontSize: "11px",
  color: "#6b7280", fontWeight: 600, textTransform: "uppercase",
  letterSpacing: "0.06em", padding: "12px 16px",
  textAlign: "left", whiteSpace: "nowrap",
  borderBottom: "1px solid #3a3a3f",
  backgroundColor: "#1c1e24",
};

const TD: React.CSSProperties = {
  fontFamily: BODY, fontSize: "14px",
  color: "#e5e7eb", padding: "14px 16px",
  borderBottom: "1px solid #282a36",
  // backgroundColor set per-row for zebra
};

const PAGE_SIZE = 10;

type SessionFilter = "All" | "London" | "New York";
const SESSION_TABS: SessionFilter[] = ["All", "London", "New York"];

export default function JournalTable({ trades }: { trades: Trade[]; stats: TradeStats }) {
  const [active, setActive]         = useState<Trade | null>(null);
  const [page, setPage]             = useState(1);
  const [session, setSession]       = useState<SessionFilter>("All");

  const filtered     = session === "All" ? trades : trades.filter(t => t.session === session);
  const filteredStats: TradeStats = useMemo(() => calculateStats(filtered), [filtered]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const pageTrades  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      {active && <TradeModal trade={active} onClose={() => setActive(null)} />}

      {/* Card — no section wrapper */}
      <div id="journal" className="card-glow" style={{
        backgroundColor: "#14151a",
        borderRadius: "12px",
        boxShadow: "0 8px 48px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
        padding: "32px",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", flexWrap: "wrap",
          gap: "16px", marginBottom: "20px",
        }}>
          <div>
            <p style={{
              fontFamily: BODY, fontSize: "11px", fontWeight: 600,
              color: "#6b7280", marginBottom: "6px",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>All Trades</p>
            <h2 style={{
              fontFamily: DISPLAY, fontWeight: 700,
              fontSize: "24px", lineHeight: 1.1, color: "#ffffff",
              letterSpacing: "-0.01em",
            }}>
              Trade Journal
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            {/* Session tabs */}
            <div style={{ display: "flex", gap: "6px" }}>
              {SESSION_TABS.map(tab => {
                const isActive = tab === session;
                return (
                  <button key={tab} onClick={() => { setSession(tab); setPage(1); }} style={{
                    fontFamily: BODY, fontSize: "11px", fontWeight: 600,
                    padding: "4px 12px", borderRadius: "9999px",
                    border: `1px solid ${isActive ? "rgba(255,249,60,0.4)" : "#3a3a3f"}`,
                    backgroundColor: isActive ? "rgba(255,249,60,0.10)" : "transparent",
                    color: isActive ? "#FFF93C" : "#6b7280",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    {tab === "All" ? "Все" : tab}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table inside inner card */}
        <div style={{ borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
              <thead>
                <tr>
                  {["Date", "Direction", "Session", "Entry Setup", "RR", "Risk %", "Result"].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageTrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...TD, textAlign: "center", color: "#6b7280", padding: "48px", borderBottom: "none" }}>
                      {filtered.length === 0 && session !== "All" ? `Нет сделок по сессии ${session}` : "Нет сделок"}
                    </td>
                  </tr>
                ) : pageTrades.map((t, i) => {
                  const rowBg = i % 2 === 0 ? INNER : INNER_ALT;
                  return (
                  <tr key={t.id}
                    onClick={() => setActive(t)}
                    style={{ cursor: "pointer", transition: "background-color 0.12s" }}
                    onMouseEnter={e => {
                      Array.from(e.currentTarget.cells).forEach(
                        (c) => ((c as HTMLTableCellElement).style.backgroundColor = "#2c2e38")
                      );
                    }}
                    onMouseLeave={e => {
                      Array.from(e.currentTarget.cells).forEach(
                        (c) => ((c as HTMLTableCellElement).style.backgroundColor = rowBg)
                      );
                    }}
                  >
                    <td style={{ ...TD, fontSize: "12px", color: "#6b7280", backgroundColor: rowBg }}>{formatDate(t.date)}</td>
                    <td style={{ ...TD, fontSize: "13px", fontWeight: 500, backgroundColor: rowBg,
                      color: t.direction === "Long" ? "#34d399" : t.direction === "Short" ? "#f87171" : "#6b7280" }}>
                      {t.direction === "Long" ? "▲ Long" : t.direction === "Short" ? "▼ Short" : "—"}
                    </td>
                    <td style={{ ...TD, backgroundColor: rowBg }}>
                      {t.session === "London"   ? <Tag label="London"   color="#60a5fa" /> :
                       t.session === "New York" ? <Tag label="New York" color="#f97316" /> :
                       t.session === "Asian"    ? <Tag label="Asian"    color="#a78bfa" /> :
                       <span style={{ color: "#6b7280" }}>—</span>}
                    </td>
                    <td style={{ ...TD, color: "#6b7280", fontSize: "13px", backgroundColor: rowBg }}>{t.notes || "—"}</td>
                    <td style={{
                      ...TD, fontSize: "14px", fontWeight: 600, backgroundColor: rowBg,
                      color: t.rr > 0 ? "#34d399" : t.rr < 0 ? "#f87171" : "#6b7280",
                    }}>
                      {t.rr > 0 ? "+" : ""}{t.rr.toFixed(2)}R
                    </td>
                    <td style={{ ...TD, fontSize: "12px", color: "#6b7280", backgroundColor: rowBg }}>
                      {t.riskPct != null ? `${t.riskPct}%` : "—"}
                    </td>
                    <td style={{ ...TD, backgroundColor: rowBg }}><ResultTag result={t.result} /></td>
                  </tr>
                  );
                })}
              </tbody>

              {/* Footer */}
              <tfoot>
                <tr style={{ backgroundColor: "#1c1e24", borderTop: "1px solid #3a3a3f" }}>
                  <td colSpan={4} style={{ ...TD, fontSize: "12px", fontWeight: 600, color: "#FFF93C", borderBottom: "none", backgroundColor: "#1c1e24" }}>
                    {filteredStats.totalTrades} trades · avg {filteredStats.avgRR >= 0 ? "+" : ""}{filteredStats.avgRR.toFixed(2)}R
                  </td>
                  <td style={{ ...TD, fontSize: "14px", fontWeight: 700, borderBottom: "none", backgroundColor: "#1c1e24",
                    color: filteredStats.netPnL >= 0 ? "#34d399" : "#f87171" }}>
                    {formatRR(filteredStats.netPnL)}
                  </td>
                  <td style={{ ...TD, borderBottom: "none", color: "#6b7280", backgroundColor: "#1c1e24" }} />
                  <td style={{ ...TD, fontSize: "12px", fontWeight: 600, color: "#e5e7eb", borderBottom: "none", backgroundColor: "#1c1e24" }}>
                    {formatWinRate(filteredStats.winRate)} WR
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: "16px", fontFamily: BODY, fontSize: "12px", color: "#6b7280",
          }}>
            <span>
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} из {filtered.length} сделок
            </span>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  border: "1px solid #3a3a3f", background: "none",
                  color: safePage === 1 ? "#3a3a3f" : "#e5e7eb",
                  cursor: safePage === 1 ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px",
                }}
              >
                ←
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  border: `1px solid ${n === safePage ? "rgba(255,249,60,0.4)" : "#3a3a3f"}`,
                  backgroundColor: n === safePage ? "rgba(255,249,60,0.10)" : "transparent",
                  color: n === safePage ? "#FFF93C" : "#6b7280",
                  cursor: "pointer", fontFamily: BODY, fontSize: "12px", fontWeight: 600,
                }}>
                  {n}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  border: "1px solid #3a3a3f", background: "none",
                  color: safePage === totalPages ? "#3a3a3f" : "#e5e7eb",
                  cursor: safePage === totalPages ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px",
                }}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
