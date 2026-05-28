import HeroChart from "@/components/HeroChart";
import JournalTable from "@/components/JournalTable";
import SetupsGrid from "@/components/SetupsGrid";
import MonthlyReviews from "@/components/MonthlyReviews";
import { fetchTrades, fetchSetups, fetchAIReviews } from "@/lib/notion";
import { calculateStats, buildEquitySeries } from "@/lib/calculations";
import { buildMonthlyReviews } from "@/lib/reviews";
import type { Trade, SetupCard, MonthlyReview } from "@/types/trade";

export const revalidate = 60;

// ── Design tokens ─────────────────────────────────────────────────────────────
const D = "var(--font-display)";   // Instrument Serif
const M = "var(--font-mono)";      // DM Mono

const CARD: React.CSSProperties = {
  backgroundColor: "var(--surface-card)",   // #191919
  borderRadius: "var(--radius-cards)",       // 10px
  boxShadow: "var(--shadow-subtle-2)",
};

function StatCard({ label, value, color = "var(--color-near-white)" }: {
  label: string; value: string; color?: string;
}) {
  return (
    <div className="card-glow" style={{
      ...CARD,
      padding: "var(--card-padding)",
      display: "flex", flexDirection: "column",
      gap: "var(--element-gap)",
    }}>
      <span style={{
        fontFamily: M,
        fontSize: "var(--text-caption)",   // 10px
        fontWeight: 500,
        color: "var(--color-ash-gray)",    // #7f7f7f
        textTransform: "uppercase",
        letterSpacing: "var(--tracking-caption)",  // 0.2px
        lineHeight: "var(--leading-caption)",
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: M,
        fontSize: "20px",
        fontWeight: 500,
        color,
        lineHeight: 1,
        letterSpacing: "-0.01em",
      }}>
        {value}
      </span>
    </div>
  );
}

export default async function HomePage() {
  let trades: Trade[] = [];
  let setups: SetupCard[] = [];

  try { trades = await fetchTrades(); } catch {}
  try { setups = await fetchSetups(); } catch {}

  const stats = calculateStats(trades);
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
    <div style={{ minHeight: "100vh", padding: "40px 40px 64px", backgroundColor: "var(--surface-canvas)" }}>
      <div style={{ maxWidth: "var(--page-max-width)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--section-gap)" }}>

        {/* ── Row 1: Hero + Chart ─────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: "10px", alignItems: "stretch" }}>

          {/* Hero text card */}
          <div id="hero" className="card-glow" style={{
            ...CARD,
            backgroundImage: "var(--gradient-deep-graphite)",
            padding: "var(--card-padding)",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            minHeight: "360px",
          }}>
            {/* Eyebrow */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="live-dot" />
              <span style={{
                fontFamily: M,
                fontSize: "var(--text-caption)",
                fontWeight: 500,
                color: "var(--color-ash-gray)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                LIVE · {new Date().getFullYear()}
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1 style={{
                fontFamily: D,
                fontWeight: 400,
                fontSize: "clamp(56px, 8vw, 96px)",
                lineHeight: "var(--leading-display)",
                letterSpacing: "var(--tracking-display)",
                color: "var(--color-near-white)",
              }}>
                Trading<br />Journal
              </h1>
              <p style={{
                fontFamily: M,
                fontSize: "var(--text-caption)",
                color: "var(--color-ash-gray)",
                marginTop: "16px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}>
                GER40 · Personal Performance
              </p>
            </div>
          </div>

          {/* Chart card */}
          <div className="card-glow" style={{
            ...CARD,
            padding: "16px 12px 12px 0",
            backgroundImage: "radial-gradient(ellipse 80% 55% at 50% 105%, rgba(25,208,232,0.07) 0%, transparent 70%)",
            display: "flex", flexDirection: "column",
          }}>
            <HeroChart data={equitySeries} />
          </div>
        </div>

        {/* ── Row 2: Stat cards ──────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          <StatCard label="Net P&L"  value={pnlValue}                           color={pnlColor} />
          <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`}     color="var(--color-electric-aqua)" />
          <StatCard label="Max DD"   value={ddValue}                            color="var(--color-loss)" />
          <StatCard label="Trades"   value={String(stats.totalTrades)} />
          <StatCard label="Avg RR"   value={avgValue} />
        </div>

        {/* ── Row 3: Journal ─────────────────────────────── */}
        <JournalTable trades={trades} stats={stats} />

        {/* ── Row 4: Setups + Reviews ─────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", alignItems: "start" }}>
          <SetupsGrid setups={setups} />
          <MonthlyReviews reviews={reviews} />
        </div>

      </div>
    </div>
  );
}
