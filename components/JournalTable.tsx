"use client";

import { useState, useMemo } from "react";
import type { Trade, TradeStats } from "@/types/trade";
import { formatRR, formatWinRate, calculateStats } from "@/lib/calculations";
import TradeModal from "@/components/TradeModal";

const M = "var(--font-mono)";      // DM Mono
const AQUA = "#19d0e8";

// ── Result tag ────────────────────────────────────────────────────────────────

function ResultTag({ result }: { result: Trade["result"] }) {
  const map = {
    Win:     { label: "TP", color: "var(--color-win)",  bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.3)"  },
    Loss:    { label: "SL", color: "var(--color-loss)", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.3)" },
    BE:      { label: "BE", color: "var(--color-be)",   bg: "rgba(252,211,77,0.10)",  border: "rgba(252,211,77,0.3)"  },
    Pending: { label: "—",  color: "var(--color-ash-gray)", bg: "transparent", border: "var(--color-dark-charcoal)" },
  };
  const s = map[result] ?? map.Pending;
  return (
    <span style={{
      fontFamily: M, fontSize: "12px", fontWeight: 500,
      color: s.color, backgroundColor: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: "var(--radius-buttons)",
      padding: "2px 10px", whiteSpace: "nowrap",
      letterSpacing: "0.05em",
    }}>
      {s.label}
    </span>
  );
}

function SessionTag({ session }: { session: Trade["session"] }) {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    "London":   { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.3)"  },
    "New York": { color: "#f97316", bg: "rgba(249,115,22,0.10)",  border: "rgba(249,115,22,0.3)"  },
    "Asian":    { color: "#a78bfa", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.3)" },
  };
  const s = map[session];
  if (!s) return <span style={{ color: "var(--color-dark-charcoal)" }}>—</span>;
  return (
    <span style={{
      fontFamily: M, fontSize: "12px", fontWeight: 500,
      color: s.color, backgroundColor: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: "var(--radius-buttons)",
      padding: "2px 10px", whiteSpace: "nowrap",
      letterSpacing: "0.05em",
    }}>
      {session}
    </span>
  );
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Table styles ──────────────────────────────────────────────────────────────

const ROW_A = "#191919";  // Carbon Black
const ROW_B = "#141414";  // slightly darker

const TH: React.CSSProperties = {
  fontFamily: M, fontSize: "12px", fontWeight: 500,
  color: "var(--color-ash-gray)", textTransform: "uppercase",
  letterSpacing: "0.12em", padding: "8px 12px",
  textAlign: "left", whiteSpace: "nowrap",
  borderBottom: `1px solid var(--color-dark-charcoal)`,
  borderRight: "1px solid rgba(255,255,255,0.04)",
  backgroundColor: "#1e1e1e",
};

const TD: React.CSSProperties = {
  fontFamily: M, fontSize: "12px",
  color: "var(--color-near-white)", padding: "8px 12px",
  borderBottom: "1px solid #111",
  borderRight: "1px solid rgba(255,255,255,0.03)",
};

const PAGE_SIZE = 10;

type SessionFilter = "All" | "London" | "New York";
const SESSION_TABS: SessionFilter[] = ["All", "London", "New York"];

// ── Pill tab button ───────────────────────────────────────────────────────────

function PillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: M, fontSize: "12px", fontWeight: 500,
      padding: "3px 12px",
      borderRadius: "var(--radius-buttons)",
      border: `1px solid ${active ? "rgba(25,208,232,0.5)" : "var(--color-dark-charcoal)"}`,
      backgroundColor: active ? "rgba(25,208,232,0.10)" : "transparent",
      color: active ? AQUA : "var(--color-ash-gray)",
      cursor: "pointer", transition: "all 0.15s",
      textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      {label}
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function JournalTable({ trades }: { trades: Trade[]; stats: TradeStats }) {
  const [active, setActive]   = useState<Trade | null>(null);
  const [page, setPage]       = useState(1);
  const [session, setSession] = useState<SessionFilter>("All");
  const [month, setMonth]     = useState<string>("all");

  const months = useMemo(() => {
    const seen = new Set<string>();
    trades.forEach(t => { if (t.date) seen.add(t.date.substring(0, 7)); });
    return Array.from(seen).sort().reverse().map(key => {
      const [y, m] = key.split("-");
      const d = new Date(Number(y), Number(m) - 1, 1);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      return { key, label };
    });
  }, [trades]);

  const filtered = useMemo(() => {
    let result = trades;
    if (session !== "All") result = result.filter(t => t.session === session);
    if (month !== "all")   result = result.filter(t => t.date?.startsWith(month));
    return result;
  }, [trades, session, month]);

  const filteredStats: TradeStats = useMemo(() => calculateStats(filtered), [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageTrades = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      {active && <TradeModal trade={active} onClose={() => setActive(null)} />}

      <div id="journal" className="card-glow" style={{
        backgroundColor: "var(--surface-card)",
        borderRadius: "var(--radius-cards)",
        padding: "var(--card-padding)",
      }}>
        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", flexWrap: "wrap",
          gap: "12px", marginBottom: "16px",
        }}>
          <div>
            <p style={{ fontFamily: M, fontSize: "12px", fontWeight: 500, color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              All Trades
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* Session tabs */}
            <div style={{ display: "flex", gap: "4px" }}>
              {SESSION_TABS.map(tab => (
                <PillTab key={tab} label={tab} active={tab === session} onClick={() => { setSession(tab); setPage(1); }} />
              ))}
            </div>

            {/* Separator */}
            {months.length > 0 && (
              <div style={{ width: "1px", height: "16px", backgroundColor: "var(--color-dark-charcoal)", flexShrink: 0 }} />
            )}

            {/* Month tabs */}
            {months.length > 0 && (
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {[{ key: "all", label: "All" }, ...months].map(m => (
                  <PillTab key={m.key} label={m.label} active={m.key === month} onClick={() => { setMonth(m.key); setPage(1); }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ borderRadius: "var(--radius-default)", overflow: "hidden", border: "1px solid #111" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
              <thead>
                <tr>
                  {["Asset", "Date", "Direction", "Session", "Setup", "Note", "RR", "Risk %", "Result"].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pageTrades.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ ...TD, textAlign: "center", color: "var(--color-ash-gray)", padding: "48px", borderBottom: "none" }}>
                      {filtered.length === 0 && session !== "All" ? `No trades for session ${session}` : "No trades"}
                    </td>
                  </tr>
                ) : pageTrades.map((t, i) => {
                  const rowBg = i % 2 === 0 ? ROW_A : ROW_B;
                  return (
                    <tr key={t.id}
                      onClick={() => setActive(t)}
                      style={{ cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => ((c as HTMLTableCellElement).style.backgroundColor = "#282828"))}
                      onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => ((c as HTMLTableCellElement).style.backgroundColor = rowBg))}
                    >
                      {/* Asset */}
                      <td style={{ ...TD, fontSize: "12px", fontWeight: 500, color: "var(--color-ash-gray)", backgroundColor: rowBg, whiteSpace: "nowrap" }}>
                        {t.instrument}
                      </td>
                      {/* Date */}
                      <td style={{ ...TD, fontSize: "12px", color: "var(--color-ash-gray)", backgroundColor: rowBg }}>
                        {formatDate(t.date)}
                      </td>
                      {/* Direction */}
                      <td style={{ ...TD, fontSize: "12px", fontWeight: 500, backgroundColor: rowBg,
                        color: t.direction === "Long" ? "var(--color-win)" : t.direction === "Short" ? "var(--color-loss)" : "var(--color-ash-gray)" }}>
                        {t.direction === "Long" ? "▲ Long" : t.direction === "Short" ? "▼ Short" : "—"}
                      </td>
                      {/* Session */}
                      <td style={{ ...TD, backgroundColor: rowBg }}>
                        <SessionTag session={t.session} />
                      </td>
                      {/* Setup */}
                      <td style={{ ...TD, fontSize: "12px", color: "var(--color-near-white)", backgroundColor: rowBg }}>
                        {t.setup || t.notes || <span style={{ color: "var(--color-dark-charcoal)" }}>—</span>}
                      </td>
                      {/* Note */}
                      <td style={{
                        ...TD, fontSize: "12px", color: "var(--color-ash-gray)", backgroundColor: rowBg,
                        maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }} title={t.note}>
                        {t.note || <span style={{ color: "var(--color-dark-charcoal)" }}>—</span>}
                      </td>
                      {/* RR */}
                      <td style={{
                        ...TD, fontSize: "12px", fontWeight: 500, backgroundColor: rowBg,
                        color: t.rr > 0 ? "var(--color-win)" : t.rr < 0 ? "var(--color-loss)" : "var(--color-ash-gray)",
                      }}>
                        {t.rr > 0 ? "+" : ""}{t.rr.toFixed(2)}R
                      </td>
                      {/* Risk % */}
                      <td style={{ ...TD, fontSize: "12px", color: "var(--color-ash-gray)", backgroundColor: rowBg }}>
                        {t.riskPct != null ? `${t.riskPct}%` : <span style={{ color: "var(--color-dark-charcoal)" }}>—</span>}
                      </td>
                      {/* Result */}
                      <td style={{ ...TD, backgroundColor: rowBg }}>
                        <ResultTag result={t.result} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer */}
              <tfoot>
                <tr style={{ backgroundColor: "#1e1e1e", borderTop: "1px solid var(--color-dark-charcoal)" }}>
                  <td colSpan={6} style={{ ...TD, fontSize: "12px", fontWeight: 500, color: AQUA, borderBottom: "none", backgroundColor: "#1e1e1e" }}>
                    {filteredStats.totalTrades} trades · avg {filteredStats.avgRR >= 0 ? "+" : ""}{filteredStats.avgRR.toFixed(2)}R
                  </td>
                  <td style={{ ...TD, fontSize: "13px", fontWeight: 500, borderBottom: "none", backgroundColor: "#1e1e1e",
                    color: filteredStats.netPnL >= 0 ? "var(--color-win)" : "var(--color-loss)" }}>
                    {formatRR(filteredStats.netPnL)}
                  </td>
                  <td style={{ ...TD, borderBottom: "none", backgroundColor: "#1e1e1e" }} />
                  <td style={{ ...TD, fontSize: "12px", fontWeight: 500, color: "var(--color-near-white)", borderBottom: "none", backgroundColor: "#1e1e1e" }}>
                    {formatWinRate(filteredStats.winRate)} WR
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: "14px", fontFamily: M, fontSize: "12px", color: "var(--color-ash-gray)",
          }}>
            <span>
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                style={{
                  width: "28px", height: "28px", borderRadius: "var(--radius-default)",
                  border: "1px solid var(--color-dark-charcoal)", background: "none",
                  color: safePage === 1 ? "var(--color-dark-charcoal)" : "var(--color-near-white)",
                  cursor: safePage === 1 ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px",
                }}
              >←</button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} style={{
                  width: "28px", height: "28px", borderRadius: "var(--radius-default)",
                  border: `1px solid ${n === safePage ? "rgba(25,208,232,0.5)" : "var(--color-dark-charcoal)"}`,
                  backgroundColor: n === safePage ? "rgba(25,208,232,0.10)" : "transparent",
                  color: n === safePage ? AQUA : "var(--color-ash-gray)",
                  cursor: "pointer", fontFamily: M, fontSize: "12px", fontWeight: 500,
                }}>
                  {n}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                style={{
                  width: "28px", height: "28px", borderRadius: "var(--radius-default)",
                  border: "1px solid var(--color-dark-charcoal)", background: "none",
                  color: safePage === totalPages ? "var(--color-dark-charcoal)" : "var(--color-near-white)",
                  cursor: safePage === totalPages ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px",
                }}
              >→</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
