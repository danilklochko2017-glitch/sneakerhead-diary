import HeroChart from "@/components/HeroChart";
import JournalTable from "@/components/JournalTable";
import SetupsGrid from "@/components/SetupsGrid";
import MonthlyReviews from "@/components/MonthlyReviews";
import { fetchTrades, fetchSetupPage, fetchAIReviews } from "@/lib/notion";
import { calculateStats, buildEquitySeries } from "@/lib/calculations";
import { buildMonthlyReviews } from "@/lib/reviews";
import type { Trade, SetupCard, MonthlyReview } from "@/types/trade";

export const revalidate = 60;

const DISPLAY = "var(--font-space-grotesk), sans-serif";
const BODY    = "var(--font-space-grotesk), sans-serif";
const MONO    = "var(--font-space-mono), monospace";

const CARD: React.CSSProperties = {
  backgroundColor: "#14151a",
  borderRadius: "12px",
  boxShadow: "0 8px 48px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
};

function StatCard({ label, value, color = "#ffffff" }: {
  label: string; value: string; color?: string;
}) {
  return (
    <div className="card-glow" style={{ ...CARD, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={{
        fontFamily: BODY, fontSize: "10px", fontWeight: 600,
        color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        {label}
      </span>
      <span style={{
        display: "inline-block",
        fontFamily: MONO, fontSize: "18px", fontWeight: 700, color, lineHeight: 1,
      }}>
        {value}
      </span>
    </div>
  );
}

export default async function HomePage() {
  let trades: Trade[] = [];
  let setup: SetupCard | null = null;

  try { trades = await fetchTrades(); } catch {}
  try { setup = await fetchSetupPage(); } catch {}

  const stats = calculateStats(trades);
  const equitySeries = buildEquitySeries(trades);
  const setups: SetupCard[] = setup ? [setup] : [];

  // Build reviews: prefer AI-generated text from Notion when available
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

  const pnlColor = stats.netPnL >= 0 ? "#34d399" : "#f87171";
  const pnlValue = `${stats.netPnL >= 0 ? "+" : ""}${stats.netPnL.toFixed(2)}R`;
  const ddValue  = stats.maxDrawdown > 0 ? `-${stats.maxDrawdown.toFixed(2)}R` : "0.00R";
  const avgValue = `${stats.avgRR >= 0 ? "+" : ""}${stats.avgRR.toFixed(2)}R`;

  return (
    <div style={{ minHeight: "100vh", padding: "40px 40px 64px" }}>
      <div style={{ maxWidth: "1360px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* ── Row 1: Hero text + Chart ───────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: "16px", alignItems: "stretch" }}>

          {/* Text card */}
          <div id="hero" className="card-glow" style={{
            ...CARD,
            padding: "36px 40px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            minHeight: "380px",
          }}>
            {/* Top: eyebrow */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="live-dot" />
              <span style={{
                fontFamily: BODY, fontSize: "11px", fontWeight: 600,
                color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                LIVE · {new Date().getFullYear()}
              </span>
            </div>

            {/* Bottom: headline + desc */}
            <div>
              <h1 style={{
                fontFamily: DISPLAY, fontWeight: 900,
                fontSize: "54px", lineHeight: 1.0, letterSpacing: "-0.02em",
                marginBottom: "16px",
                background: "linear-gradient(180deg, #ffffff 0%, #ffffff 30%, #FFF93C 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Sneakerhead<br />Trading<br />Journal.
              </h1>
              <p style={{
                fontFamily: BODY, fontSize: "14px", lineHeight: 1.6,
                color: "#6b7280", maxWidth: "300px",
              }}>
                Каждая сделка на GER40 — без правок и отбора. Честные данные с реальных сессий.
              </p>
            </div>
          </div>

          {/* Chart card */}
          <div className="card-glow" style={{
            ...CARD,
            padding: "24px 20px 20px 0",
            backgroundImage: "radial-gradient(ellipse 80% 55% at 50% 105%, rgba(255,249,60,0.09) 0%, transparent 70%)",
            display: "flex", flexDirection: "column",
          }}>
            <HeroChart data={equitySeries} />
          </div>
        </div>

        {/* ── Row 2: Stat cards ──────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
          <StatCard label="Net P&L"  value={pnlValue} color={pnlColor} />
          <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color="#FFF93C" />
          <StatCard label="Max DD"   value={ddValue}  color="#f87171" />
          <StatCard label="Trades"   value={String(stats.totalTrades)} />
          <StatCard label="Avg RR"   value={avgValue} color="#e5e7eb" />
        </div>

        {/* ── Row 3: Journal (full width) ─────────────── */}
        <JournalTable trades={trades} stats={stats} />

        {/* ── Row 4: Setups + Reviews ─────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
          <SetupsGrid setups={setups} />
          <MonthlyReviews reviews={reviews} />
        </div>

      </div>
    </div>
  );
}
