import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

export const dynamic = "force-dynamic";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MT5Payload {
  symbol:      string;   // "GER40"
  direction:   string;   // "Long" | "Short"
  open_price:  number;
  close_price: number;
  sl:          number;   // stop loss price (0 if not set)
  tp:          number;   // take profit price (0 if not set)
  volume:      number;   // lot size
  profit:      number;   // realised P&L in account currency
  open_time:   string;   // ISO 8601 UTC "2026-05-28T09:15:00Z"
  close_time:  string;   // ISO 8601 UTC
  comment?:    string;   // trade comment / entry tag
  magic?:      number;
  risk_pct?:   number;   // risk % if known
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Determine session from UTC close hour */
function inferSession(closeTimeUtc: string): "London" | "New York" | "Asian" | "Other" {
  const date = new Date(closeTimeUtc);
  const hour = date.getUTCHours();
  // London: 07:00–15:59 UTC
  if (hour >= 7 && hour < 16) return "London";
  // New York: 13:00–21:59 UTC (overlaps London in the afternoon)
  if (hour >= 13 && hour < 22) return "New York";
  // Asian: 00:00–06:59 UTC
  if (hour < 7 || hour >= 22) return "Asian";
  return "Other";
}

/** Calculate RR from trade data */
function calcRR(payload: MT5Payload): { result: "Win" | "Loss" | "BE"; rr: number } {
  const { direction, open_price, close_price, sl, profit } = payload;

  // Determine result from profit
  const BE_THRESHOLD = 2; // account currency — treat as BE if |profit| < this
  if (Math.abs(profit) < BE_THRESHOLD) return { result: "BE", rr: 0 };
  if (profit < 0)                       return { result: "Loss", rr: -1 };

  // Win — compute RR from SL distance
  if (sl > 0) {
    const slDist = Math.abs(open_price - sl);
    if (slDist > 0) {
      const exitDist = Math.abs(close_price - open_price);
      const rrRaw = exitDist / slDist;
      // Only count as real RR if direction is correct
      const isCorrectDir =
        (direction === "Long"  && close_price > open_price) ||
        (direction === "Short" && close_price < open_price);
      return { result: "Win", rr: isCorrectDir ? Math.round(rrRaw * 100) / 100 : 1 };
    }
  }

  // No SL info — still a win, default RR to 1
  return { result: "Win", rr: 1 };
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret = process.env.MT5_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "MT5_SECRET not configured" }, { status: 500 });
  }
  const incoming = request.headers.get("x-api-secret") ?? "";
  if (incoming !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let payload: MT5Payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Basic validation
  const required: (keyof MT5Payload)[] = [
    "symbol", "direction", "open_price", "close_price", "profit", "open_time", "close_time",
  ];
  for (const key of required) {
    if (payload[key] === undefined || payload[key] === null) {
      return NextResponse.json({ error: `Missing field: ${key}` }, { status: 400 });
    }
  }

  // ── Business logic ────────────────────────────────────────────────────────
  const { result, rr } = calcRR(payload);
  const session         = inferSession(payload.close_time);
  const closeDateOnly   = payload.close_time.substring(0, 10); // "YYYY-MM-DD"

  // Notion result select value
  const notionResult = result === "Win" ? "TP" : result === "Loss" ? "SL" : "BE";

  // Direction normalised
  const direction =
    /long|buy/i.test(payload.direction)  ? "Long" :
    /short|sell/i.test(payload.direction) ? "Short" : payload.direction;

  // Note: entry tag from comment, or fallback
  const entryTag = payload.comment?.trim() || "";

  // ── Create Notion page ────────────────────────────────────────────────────
  const dbId = process.env.NOTION_DATABASE_ID;
  if (!dbId) {
    return NextResponse.json({ error: "NOTION_DATABASE_ID not configured" }, { status: 500 });
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  // Build properties — only set fields that exist as plain (non-relation) columns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: Record<string, any> = {
    // Title — "Pair" column
    "Pair": {
      title: [{ text: { content: payload.symbol || "GER40" } }],
    },
    // Date column
    "Date": {
      date: { start: closeDateOnly },
    },
    // Result select
    "Result": {
      select: { name: notionResult },
    },
    // RR number
    "RR": {
      number: Math.abs(rr),
    },
    // Direction is a relation in this DB — filled manually in Notion
    // Entry tag (e.g. "1M CISD") — select field
    ...(entryTag ? { "Entry": { select: { name: entryTag } } } : {}),
    // Risk %
    ...(payload.risk_pct != null
      ? { "Risk (%)": { number: payload.risk_pct } }
      : {}),
    // Auto-note with trade summary
    "Note": {
      rich_text: [{
        text: {
          content: [
            direction,
            `Open: ${payload.open_price} → Close: ${payload.close_price}`,
            payload.sl ? `SL: ${payload.sl}` : "",
            `Vol: ${payload.volume}`,
            `Session: ${session}`,
            `MT5 profit: ${payload.profit >= 0 ? "+" : ""}${payload.profit.toFixed(2)}`,
          ].filter(Boolean).join(" | "),
        },
      }],
    },
  };

  try {
    const page = await notion.pages.create({
      parent: { database_id: dbId },
      properties,
    });

    return NextResponse.json({
      success: true,
      page_id: page.id,
      result,
      rr,
      session,
      date: closeDateOnly,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[mt5-import] Notion error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "mt5-import", method: "POST" });
}
