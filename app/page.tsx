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
const AQUA = "#19d0e8";

// ── Stat ticker ────────────────────────────────────────────────────────────────
function StatTicker({ items }: {
  items: { label: string; value: string; color?: string }[];
}) {
  return (
    <div className="card-glow" style={{
      backgroundColor: "var(--surface-card)",
      borderRadius: "var(--radius-cards)",
      display: "flex",
      overflow: "hidden",
    }}>
      {items.map((item, i) => (
        <div key={item.label} style={{
          flex: 1,
          padding: "16px 20px",
          borderRight: i < items.length - 1 ? "1px solid #111" : "none",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}>
          <span style={{
            fontFamily: M, fontSize: "12px", fontWeight: 500,
            color: "var(--color-ash-gray)",
            textTransform: "uppercase", letterSpacing: "0.12em",
          }}>
            {item.label}
          </span>
          <span style={{
            fontFamily: M, fontSize: "16px", fontWeight: 500,
            color: item.color ?? "var(--color-near-white)",
            lineHeight: 1, letterSpacing: "-0.02em",
          }}>
            {item.value}
          </span>
        </div>
      ))}
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

  const now = new Date();

  const pnlColor = stats.netPnL >= 0 ? "var(--color-win)" : "var(--color-loss)";
  const pnlValue = `${stats.netPnL >= 0 ? "+" : ""}${stats.netPnL.toFixed(2)}R`;
  const ddValue  = stats.maxDrawdown > 0 ? `-${stats.maxDrawdown.toFixed(2)}R` : "0.00R";
  const avgValue = `${stats.avgRR >= 0 ? "+" : ""}${stats.avgRR.toFixed(2)}R`;

  const tickerItems = [
    { label: "Net P&L",  value: pnlValue,                         color: pnlColor               },
    { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`,   color: AQUA                   },
    { label: "Avg RR",   value: avgValue                                                         },
    { label: "Trades",   value: String(stats.totalTrades)                                       },
    { label: "Max DD",   value: ddValue,                          color: "var(--color-loss)"    },
  ];

  return (
    <div style={{
      position: "relative",
      minHeight: "100vh",
      backgroundColor: "var(--surface-canvas)",
    }}>
      <div className="page-content">

        {/* ── Row 1: Chart (left, dominant) + Terminal info panel (right) ── */}
        <div className="page-row-hero">

          {/* Equity chart — left 7fr */}
          <div className="card-glow" style={{
            backgroundColor: "var(--surface-card)",
            borderRadius: "var(--radius-cards)",
            padding: "20px 16px 16px 0",
            backgroundImage: "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(25,208,232,0.09) 0%, transparent 70%)",
            display: "flex", flexDirection: "column",
          }}>
            <HeroChart data={equitySeries} />
          </div>

          {/* Terminal info panel — right 5fr */}
          <div id="hero" className="card-glow" style={{
            backgroundColor: "var(--surface-card)",
            borderRadius: "var(--radius-cards)",
            padding: "28px",
            display: "flex", flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "320px",
          }}>
            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="live-dot" />
              <span style={{
                fontFamily: M, fontSize: "12px", fontWeight: 500,
                color: "var(--color-ash-gray)",
                letterSpacing: "0.15em", textTransform: "uppercase",
              }}>
                Live · {now.getFullYear()}
              </span>
            </div>

            {/* Bottom content */}
            <div>
              <h1 style={{
                fontFamily: D, fontWeight: 400,
                fontSize: "clamp(36px, 3.8vw, 60px)",
                lineHeight: 0.95, letterSpacing: "-0.04em",
                color: "var(--color-near-white)",
              }}>
                Trading<br />Journal
              </h1>

            </div>
          </div>
        </div>

        {/* ── Row 2: Stat ticker ── */}
        <StatTicker items={tickerItems} />

        {/* ── Row 3: Journal table ── */}
        <JournalTable trades={trades} stats={stats} />

        {/* ── Row 4: Setups (2fr) + Reviews (1fr) ── */}
        <div className="page-row-bottom">
          <SetupsGrid setups={setups} />
          <MonthlyReviews reviews={reviews} />
        </div>

      </div>
    </div>
  );
}
