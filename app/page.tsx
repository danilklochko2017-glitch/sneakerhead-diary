import HeroChart from "@/components/HeroChart";
import CandleBackground from "@/components/CandleBackground";
import JournalTable from "@/components/JournalTable";
import SetupsGrid from "@/components/SetupsGrid";
import MonthlyReviews from "@/components/MonthlyReviews";
import { fetchTrades, fetchSetups, fetchAIReviews } from "@/lib/notion";
import { calculateStats, buildEquitySeries } from "@/lib/calculations";
import { buildMonthlyReviews } from "@/lib/reviews";
import type { Trade, SetupCard, MonthlyReview } from "@/types/trade";

export const revalidate = 60;

const D = "var(--font-display)";
const M = "var(--font-mono)";

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = "var(--color-near-white)" }: {
  label: string; value: string; color?: string;
}) {
  return (
    <div className="card-glow" style={{
      backgroundColor: "var(--surface-card)",
      borderRadius: "var(--radius-cards)",
      padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: "6px",
    }}>
      <span style={{
        fontFamily: M, fontSize: "10px", fontWeight: 500,
        color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.12em",
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: M, fontSize: "22px", fontWeight: 500,
        color, lineHeight: 1, letterSpacing: "-0.02em",
      }}>
        {value}
      </span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  let trades: Trade[] = [];
  let setups: SetupCard[] = [];

  try { trades = await fetchTrades(); } catch {}
  try { setups = await fetchSetups(); } catch {}

  const stats        = calculateStats(trades);
  const equitySeries = buildEquitySeries(trades);

  const templateReviews = buildMonthlyReviews(trades);
  const aiReviews = await fetchAIReviews().catch(() => []);
  const reviews: MonthlyReview[] = templateReviews.map((r) => {
    const monthKey = `${r.year}-${String(
      ["January","February","March","April","May","June",
       "July","August","September","October","November","December"]
        .indexOf(r.month) + 1
    ).padStart(2, "0")}`;
    const ai = aiReviews.find((a) => a.monthKey === monthKey);
    if (ai) return { ...r, wentWell: ai.wentWell, toImprove: ai.toImprove };
    return r;
  });

  const pnlColor = stats.netPnL >= 0 ? "var(--color-win)" : "var(--color-loss)";
  const pnlValue = `${stats.netPnL >= 0 ? "+" : ""}${stats.netPnL.toFixed(2)}R`;
  const ddValue  = stats.maxDrawdown > 0 ? `-${stats.maxDrawdown.toFixed(2)}R` : "0.00R";
  const avgValue = `${stats.avgRR >= 0 ? "+" : ""}${stats.avgRR.toFixed(2)}R`;

  return (
    <div style={{
      position: "relative",
      minHeight: "100vh",
      backgroundColor: "var(--surface-canvas)",
      overflow: "hidden",
    }}>

      {/* ─── Content ─────────────────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: "var(--page-max-width)",
        margin: "0 auto",
        padding: "40px 40px 80px",
        display: "flex", flexDirection: "column", gap: "10px",
      }}>

        {/* ── Row 1: Hero card + Chart card ── */}
        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: "10px", alignItems: "stretch" }}>

          {/* Hero text */}
          <div id="hero" className="card-glow" style={{
            backgroundColor: "var(--surface-card)",
            borderRadius: "var(--radius-cards)",
            padding: "36px 40px",
            display: "flex", flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "360px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Animated candlestick background */}
            <CandleBackground />

            {/* Text — above canvas */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="live-dot" />
              <span style={{
                fontFamily: M, fontSize: "10px", fontWeight: 500,
                color: "var(--color-ash-gray)", letterSpacing: "0.15em", textTransform: "uppercase",
              }}>
                Live · {new Date().getFullYear()}
              </span>
            </div>

            <div style={{ position: "relative", zIndex: 1 }}>
              <h1 style={{
                fontFamily: D, fontWeight: 400,
                fontSize: "clamp(48px, 5vw, 76px)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
                color: "var(--color-near-white)",
                marginBottom: "20px",
              }}>
                Trading Journal
              </h1>
              <p style={{
                fontFamily: M, fontSize: "11px",
                color: "var(--color-ash-gray)",
                lineHeight: 1.7, letterSpacing: "0.01em",
              }}>
                GER40 · Real-time performance tracking.<br />
                Every trade from Notion and MetaTrader 5.
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="card-glow" style={{
            backgroundColor: "var(--surface-card)",
            borderRadius: "var(--radius-cards)",
            padding: "20px 16px 16px 0",
            backgroundImage: "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(25,208,232,0.09) 0%, transparent 70%)",
            display: "flex", flexDirection: "column",
          }}>
            <HeroChart data={equitySeries} />
          </div>
        </div>

        {/* ── Row 2: 5 stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          <StatCard label="Net P&L"  value={pnlValue}                       color={pnlColor} />
          <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color="var(--color-electric-aqua)" />
          <StatCard label="Avg RR"   value={avgValue} />
          <StatCard label="Trades"   value={String(stats.totalTrades)} />
          <StatCard label="Max DD"   value={ddValue}                        color="var(--color-loss)" />
        </div>

        {/* ── Row 3: Journal table ── */}
        <JournalTable trades={trades} stats={stats} />

        {/* ── Row 4: Setups + Reviews ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", alignItems: "start" }}>
          <SetupsGrid setups={setups} />
          <MonthlyReviews reviews={reviews} />
        </div>

      </div>
    </div>
  );
}
