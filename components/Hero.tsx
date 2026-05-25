import type { EquityPoint, TradeStats } from "@/types/trade";
import HeroChart from "@/components/HeroChart";

const DISPLAY = "'Unbounded', sans-serif";
const BODY    = "'Bricolage Grotesque', sans-serif";

function StatCard({ label, value, color = "#ffffff" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", justifyContent: "center", gap: "6px",
      padding: "0 20px",
      height: "100px",
      backgroundColor: "#14151a",
      borderRadius: "8px",
      flex: "1 1 0", minWidth: 0,
      boxShadow: "0 2px 12px rgba(0,0,0,0.28)",
    }}>
      <span style={{
        fontFamily: BODY, fontSize: "10px", fontWeight: 600,
        color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: BODY, fontSize: "22px", fontWeight: 700,
        color, lineHeight: 1,
      }}>
        {value}
      </span>
    </div>
  );
}

export default function Hero({ equitySeries, stats }: { equitySeries: EquityPoint[]; stats: TradeStats }) {
  const pnlColor = stats.netPnL >= 0 ? "#34d399" : "#f87171";
  const pnlValue = `${stats.netPnL >= 0 ? "+" : ""}${stats.netPnL.toFixed(2)}R`;
  const ddValue  = stats.maxDrawdown > 0 ? `-${stats.maxDrawdown.toFixed(2)}R` : "0.00R";

  return (
    <section id="hero" style={{
      backgroundColor: "#0d0e11",
      minHeight: "100svh",
      display: "flex",
      alignItems: "center",
      padding: "80px 40px 48px",   /* 80 clears the 56px nav + breathing */
      borderBottom: "1px solid #3a3a3f",
    }}>
      <div style={{
        maxWidth: "1360px",
        width: "100%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px",               /* --spacing-24 */
      }}>

        {/* ── Eyebrow + Headline (centered) ── */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            gap: "8px", marginBottom: "16px",   /* --spacing-16 */
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "9999px",
              backgroundColor: "#34d399", display: "inline-block",
            }} />
            <span style={{
              fontFamily: BODY, fontSize: "12px", fontWeight: 600,
              color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              LIVE · GER40 · {new Date().getFullYear()}
            </span>
          </div>

          <h1 style={{
            fontFamily: DISPLAY, fontWeight: 900,
            fontSize: "60px",          /* --text-display from design.md */
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: "#ffffff",
          }}>
            Sneakerhead<br />
            <span style={{ color: "#FFF93C" }}>Diary.</span>
          </h1>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: "flex", gap: "8px", marginTop: "32px" }}>
          <StatCard label="Net P&L"  value={pnlValue}                       color={pnlColor} />
          <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color="#FFF93C"  />
          <StatCard label="Max DD"   value={ddValue}                        color="#f87171"  />
          <StatCard label="Trades"   value={String(stats.totalTrades)}      color="#ffffff"  />
          <StatCard label="Avg RR"   value={`${stats.avgRR >= 0 ? "+" : ""}${stats.avgRR.toFixed(2)}R`} color="#e5e7eb" />
        </div>

        {/* ── Equity chart ── */}
        <div style={{
          height: "600px",
          backgroundColor: "#14151a",
          borderRadius: "8px",
          padding: "16px 20px 16px 0",
          boxShadow: "0 8px 48px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
        }}>
          <HeroChart data={equitySeries} />
        </div>

      </div>
    </section>
  );
}
