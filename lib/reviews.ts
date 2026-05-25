import type { Trade, MonthlyReview } from "@/types/trade";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function generateWentWell(s: {
  winRate: number; netRR: number; bestTrade: number;
  trades: number; wins: number;
}): string {
  const lines: string[] = [];

  if (s.winRate >= 65) {
    lines.push(`Отличный винрейт ${s.winRate.toFixed(0)}% — входы были точечными, структурные confluences чётко соблюдались.`);
  } else if (s.winRate >= 50) {
    lines.push(`Стабильный винрейт ${s.winRate.toFixed(0)}% по ${s.trades} сделкам — исполнение было последовательным.`);
  }

  if (s.bestTrade >= 2) {
    lines.push(`Лучшая сделка принесла ${s.bestTrade.toFixed(1)}R — позиция удерживалась до полного ТП.`);
  }

  if (s.netRR >= 3) {
    lines.push(`Сильный результат месяца: +${s.netRR.toFixed(1)}R — положительное матожидание выдержано на протяжении всего периода.`);
  } else if (s.netRR > 0) {
    lines.push(`Месяц закрыт в плюс: +${s.netRR.toFixed(1)}R.`);
  }

  if (lines.length === 0) {
    lines.push(`Отработано ${s.trades} сделок с соблюдением плана. Продолжаем фокус на качестве входов и точности разметки.`);
  }

  return lines.join(" ");
}

function generateToImprove(s: {
  winRate: number; netRR: number; worstTrade: number;
  trades: number; losses: number;
}): string {
  const lines: string[] = [];

  if (s.winRate < 50) {
    lines.push(`Винрейт ${s.winRate.toFixed(0)}% ниже целевого — пересмотреть триггеры входа, требовать более качественного подтверждения перед открытием позиции.`);
  }

  if (s.worstTrade <= -1.5) {
    lines.push(`Максимальный убыток составил −${Math.abs(s.worstTrade).toFixed(1)}R — пересмотреть логику постановки стопа и убедиться, что риск изначально вписывается в план.`);
  }

  if (s.trades > 20) {
    lines.push(`Высокая активность за месяц (${s.trades} сделок) — приоритет терпению и качеству, а не количеству.`);
  }

  if (s.netRR < 0) {
    lines.push(`Отрицательный результат ${s.netRR.toFixed(1)}R — сделать паузу, разобрать каждый убыток на предмет повторяющихся ошибок, снизить объём до восстановления преимущества.`);
  }

  if (lines.length === 0) {
    lines.push(`Продолжать работу над управлением выходами. Проверить, улучшает ли удержание позиций сверх первого ТП общее распределение RR.`);
  }

  return lines.join(" ");
}

export function buildMonthlyReviews(trades: Trade[]): MonthlyReview[] {
  const closed = trades.filter(
    (t) => t.result === "Win" || t.result === "Loss" || t.result === "BE"
  );

  // Group trades by "YYYY-MM"
  const groups = new Map<string, Trade[]>();
  for (const trade of closed) {
    if (!trade.date) continue;
    const key = trade.date.substring(0, 7); // "2025-05"
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(trade);
  }

  const reviews: MonthlyReview[] = [];

  for (const [key, monthTrades] of Array.from(groups.entries())) {
    const year  = Number(key.substring(0, 4));
    const mIdx  = Number(key.substring(5, 7)) - 1; // 0-indexed

    const wins     = monthTrades.filter((t: Trade) => t.result === "Win").length;
    const losses   = monthTrades.filter((t: Trade) => t.result === "Loss").length;
    const netRR    = monthTrades.reduce((s: number, t: Trade) => s + t.rr, 0);
    const winRate  = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;
    const rrValues = monthTrades.map((t: Trade) => t.rr);
    const bestTrade  = rrValues.length > 0 ? Math.max(...rrValues) : 0;
    const worstTrade = rrValues.length > 0 ? Math.min(...rrValues) : 0;

    const s = {
      winRate: Math.round(winRate * 10) / 10,
      netRR:   Math.round(netRR   * 100) / 100,
      bestTrade:  Math.round(bestTrade  * 100) / 100,
      worstTrade: Math.round(worstTrade * 100) / 100,
      trades: monthTrades.length,
      wins, losses,
    };

    reviews.push({
      month: MONTH_NAMES[mIdx],
      year,
      trades:     s.trades,
      wins:       s.wins,
      losses:     s.losses,
      winRate:    s.winRate,
      netRR:      s.netRR,
      bestTrade:  s.bestTrade,
      worstTrade: s.worstTrade,
      wentWell:   generateWentWell(s),
      toImprove:  generateToImprove(s),
    });
  }

  // Newest first
  return reviews.sort((a, b) => {
    const aMs = new Date(`${a.year}-${String(MONTH_NAMES.indexOf(a.month) + 1).padStart(2, "0")}-01`).getTime();
    const bMs = new Date(`${b.year}-${String(MONTH_NAMES.indexOf(b.month) + 1).padStart(2, "0")}-01`).getTime();
    return bMs - aMs;
  });
}
