import HeroChart from "@/components/HeroChart";
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

// ── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({ label, value, color = "var(--color-near-white)" }: {
  label: string; value: string; color?: string;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "4px",
      padding: "10px 16px",
      backgroundColor: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "var(--radius-default)",
      backdropFilter: "blur(4px)",
    }}>
      <span style={{ fontFamily: M, fontSize: "10px", fontWeight: 500, color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
        {label}
      </span>
      <span style={{ fontFamily: M, fontSize: "16px", fontWeight: 500, color, lineHeight: 1, letterSpacing: "-0.01em" }}>
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
    <div style={{ backgroundColor: "var(--surface-canvas)", minHeight: "100vh" }}>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section style={{
        position: "relative",
        overflow: "hidden",
        padding: "100px 40px 0",
        backgroundImage: "linear-gradient(180deg, rgb(22,22,22) 0%, rgb(10,10,10) 40%, rgb(0,0,0) 100%)",
      }}>
        {/* Spotlight beam from top */}
        <div className="hero-spotlight" />

        <div style={{ maxWidth: "var(--page-max-width)", margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* Eyebrow — centered */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "40px" }}>
            <span className="live-dot" />
            <span style={{ fontFamily: M, fontSize: "10px", fontWeight: 500, color: "var(--color-ash-gray)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Live · {new Date().getFullYear()}
            </span>
          </div>

          {/* Headline — centered, very large */}
          <h1 style={{
            fontFamily: D, fontWeight: 400,
            fontSize: "clamp(64px, 9vw, 120px)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            color: "var(--color-near-white)",
            textAlign: "center",
            marginBottom: "28px",
          }}>
            Your trades.<br />Brutally honest.
          </h1>

          {/* Subtext — centered */}
          <p style={{
            fontFamily: M, fontSize: "12px",
            color: "var(--color-ash-gray)",
            letterSpacing: "0.02em",
            lineHeight: 1.7,
            textAlign: "center",
            margin: "0 auto 48px",
            maxWidth: "380px",
          }}>
            GER40 · Real-time performance tracking.<br />
            Every trade from Notion and MetaTrader 5.
          </p>

          {/* Stat chips — centered row */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "64px" }}>
            <StatChip label="Net P&L"  value={pnlValue}                       color={pnlColor} />
            <StatChip label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color="var(--color-electric-aqua)" />
            <StatChip label="Avg RR"   value={avgValue} />
            <StatChip label="Trades"   value={String(stats.totalTrades)} />
            <StatChip label="Max DD"   value={ddValue}                        color="var(--color-loss)" />
          </div>

          {/* Equity chart — full width, centered, tall */}
          <div style={{
            backgroundColor: "var(--surface-card)",
            borderRadius: "var(--radius-cards)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "20px 16px 16px 0",
            height: "420px",
            display: "flex", flexDirection: "column",
            backgroundImage: "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(25,208,232,0.09) 0%, transparent 70%)",
            boxShadow: "var(--shadow-subtle-2)",
            position: "relative", zIndex: 2,
          }}>
            <HeroChart data={equitySeries} />
          </div>
        </div>

        {/* Giant background text — sits behind chart bottom */}
        <div style={{
          position: "absolute", bottom: "-24px", left: 0, right: 0,
          fontFamily: D, fontWeight: 400,
          fontSize: "clamp(100px, 22vw, 300px)",
          color: "rgba(255,255,255,0.025)",
          textAlign: "center",
          lineHeight: 0.85,
          letterSpacing: "-0.04em",
          userSelect: "none", pointerEvents: "none",
          whiteSpace: "nowrap",
        }}>
          GER40
        </div>
      </section>

      {/* ─── JOURNAL ──────────────────────────────────────────────── */}
      <section style={{ padding: "80px 40px" }}>
        <div style={{ maxWidth: "var(--page-max-width)", margin: "0 auto" }}>

          {/* Section eyebrow */}
          <div style={{ marginBottom: "32px" }}>
            <p style={{ fontFamily: M, fontSize: "10px", fontWeight: 500, color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "8px" }}>
              Every trade, every session
            </p>
            <h2 style={{ fontFamily: D, fontWeight: 400, fontSize: "clamp(32px, 3.5vw, 48px)", lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--color-near-white)", maxWidth: "520px" }}>
              The full record, no filters.
            </h2>
          </div>

          <JournalTable trades={trades} stats={stats} />
        </div>
      </section>

      {/* ─── SETUPS + REVIEWS ─────────────────────────────────────── */}
      <section style={{ padding: "0 40px 100px" }}>
        <div style={{ maxWidth: "var(--page-max-width)", margin: "0 auto" }}>

          {/* Section eyebrow */}
          <div style={{ marginBottom: "32px" }}>
            <p style={{ fontFamily: M, fontSize: "10px", fontWeight: 500, color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "8px" }}>
              Playbook & reflection
            </p>
            <h2 style={{ fontFamily: D, fontWeight: 400, fontSize: "clamp(32px, 3.5vw, 48px)", lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--color-near-white)", maxWidth: "520px" }}>
              The system behind the trades.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", alignItems: "start" }}>
            <SetupsGrid setups={setups} />
            <MonthlyReviews reviews={reviews} />
          </div>
        </div>
      </section>

    </div>
  );
}
