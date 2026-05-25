import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@notionhq/client";
import { fetchTrades } from "@/lib/notion";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
  // Security: accept Bearer token OR ?secret= query param
  const url0 = new URL(request.url);
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const querySecret = url0.searchParams.get("secret");
  const validHeader = authHeader === `Bearer ${secret}`;
  const validQuery  = secret && querySecret === secret;
  if (!validHeader && !validQuery) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviewsDbId = process.env.NOTION_REVIEWS_DB_ID;
  if (!reviewsDbId) return NextResponse.json({ error: "NOTION_REVIEWS_DB_ID not set" }, { status: 500 });

  // Determine month — ?month=2026-05 overrides (for manual testing)
  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month");
  let monthKey: string;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    monthKey = monthParam;
  } else {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year  = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;
    monthKey = `${year}-${String(month).padStart(2, "0")}`;
  }

  // Fetch trades and filter to last month
  const allTrades = await fetchTrades();
  const monthTrades = allTrades.filter(
    (t) => t.date?.startsWith(monthKey) &&
    (t.result === "Win" || t.result === "Loss" || t.result === "BE")
  );

  if (monthTrades.length === 0) {
    return NextResponse.json({ message: `No trades found for ${monthKey}`, allDates: allTrades.map(t => t.date).slice(0, 5) });
  }

  // Stats
  const wins      = monthTrades.filter((t) => t.result === "Win").length;
  const losses    = monthTrades.filter((t) => t.result === "Loss").length;
  const be        = monthTrades.filter((t) => t.result === "BE").length;
  const netRR     = monthTrades.reduce((s, t) => s + t.rr, 0);
  const winRate   = (wins / monthTrades.length) * 100;
  const avgRR     = netRR / monthTrades.length;
  const bestTrade = Math.max(...monthTrades.map((t) => t.rr));
  const worstTrade= Math.min(...monthTrades.map((t) => t.rr));

  const tradeList = monthTrades
    .map((t) => `${t.date} | ${t.direction} | ${t.result} | ${t.rr >= 0 ? "+" : ""}${t.rr.toFixed(2)}R | ${t.notes || "—"}`)
    .join("\n");

  // Call Claude
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `Ты анализируешь торговый дневник трейдера GER40 (германский индекс DAX).

Статистика за ${monthKey}:
- Сделок всего: ${monthTrades.length} (${wins} TP, ${losses} SL, ${be} BE)
- Винрейт: ${winRate.toFixed(1)}%
- Нетто RR: ${netRR >= 0 ? "+" : ""}${netRR.toFixed(2)}R
- Средний RR на сделку: ${avgRR >= 0 ? "+" : ""}${avgRR.toFixed(2)}R
- Лучшая сделка: +${bestTrade.toFixed(2)}R
- Худшая сделка: ${worstTrade.toFixed(2)}R

Список сделок:
${tradeList}

Напиши короткий месячный разбор на русском в двух секциях.
Будь конкретным — используй числа из данных. Никаких общих фраз.
Каждая секция — 2-3 живых предложения, как будто пишет опытный трейдер для себя.

Формат ответа (строго):
WENT_WELL: [текст]
TO_IMPROVE: [текст]`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const wentWellMatch  = text.match(/WENT_WELL:\s*([\s\S]+?)(?=TO_IMPROVE:|$)/);
  const toImproveMatch = text.match(/TO_IMPROVE:\s*([\s\S]+?)$/);

  const wentWell  = wentWellMatch?.[1]?.trim()  ?? "";
  const toImprove = toImproveMatch?.[1]?.trim() ?? "";

  // Save to Notion
  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  // Check if review already exists for this month
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing: any = await notion.databases.query({
    database_id: reviewsDbId,
    filter: { property: "Month", title: { equals: monthKey } },
  });

  if (existing.results.length > 0) {
    await notion.pages.update({
      page_id: existing.results[0].id,
      properties: {
        "Went Well":    { rich_text: [{ text: { content: wentWell   } }] },
        "To Improve":   { rich_text: [{ text: { content: toImprove  } }] },
        "Generated At": { date: { start: new Date().toISOString()    } },
      },
    });
  } else {
    await notion.pages.create({
      parent: { database_id: reviewsDbId },
      properties: {
        "Month":        { title:     [{ text: { content: monthKey   } }] },
        "Went Well":    { rich_text: [{ text: { content: wentWell   } }] },
        "To Improve":   { rich_text: [{ text: { content: toImprove  } }] },
        "Generated At": { date: { start: new Date().toISOString()    } },
      },
    });
  }

  return NextResponse.json({ success: true, month: monthKey, wentWell, toImprove });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[generate-review] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: "Use GET" }, { status: 405 });
}
