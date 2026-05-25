import type { Trade, TradeStats, EquityPoint } from "@/types/trade";

export function calculateStats(trades: Trade[]): TradeStats {
  const closed = trades.filter((t) => t.result === "Win" || t.result === "Loss" || t.result === "BE");
  const totalTrades = closed.length;

  const netPnL = closed.reduce((sum, t) => sum + t.rr, 0);
  const wins = closed.filter((t) => t.result === "Win").length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const avgRR = totalTrades > 0 ? netPnL / totalTrades : 0;
  const maxDrawdown = calculateMaxDrawdown(closed);

  return { netPnL, winRate, maxDrawdown, totalTrades, avgRR };
}

function calculateMaxDrawdown(trades: Trade[]): number {
  if (trades.length === 0) return 0;

  const sorted = [...trades].reverse().sort((a, b) => a.date.localeCompare(b.date));
  let peak = 0;
  let cumulative = 0;
  let maxDD = 0;

  for (const trade of sorted) {
    cumulative += trade.rr;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDD) maxDD = dd;
  }

  return maxDD;
}

export function buildEquitySeries(trades: Trade[]): EquityPoint[] {
  const closed = trades.filter((t) => t.result === "Win" || t.result === "Loss" || t.result === "BE");
  // Notion returns trades newest-first. Reversing before sort ensures that
  // within the same date the chronological (oldest-first) order is preserved
  // after the stable sort — otherwise same-date trades stay in descending order.
  const sorted = [...closed].reverse().sort((a, b) => a.date.localeCompare(b.date));

  let cumulative = 0;
  let londonCum = 0;
  let newYorkCum = 0;

  return sorted.map((trade) => {
    cumulative += trade.rr;
    const isLondon = trade.session === "London";
    const isNY = trade.session === "New York";

    if (isLondon) londonCum += trade.rr;
    if (isNY) newYorkCum += trade.rr;

    return {
      date: trade.date,
      cumulative: Math.round(cumulative * 100) / 100,
      london: isLondon ? Math.round(londonCum * 100) / 100 : null,
      newYork: isNY ? Math.round(newYorkCum * 100) / 100 : null,
      session: trade.session,
      rr: trade.rr,
    };
  });
}

export function formatRR(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}R`;
}

export function formatWinRate(value: number): string {
  return `${value.toFixed(1)}%`;
}
