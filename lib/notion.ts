import { Client } from "@notionhq/client";
import type { Trade, SetupCard, Result } from "@/types/trade";

// ─── GFM Setup — hardcoded markdown description ──────────────────────────────
const GFM_DESCRIPTION = `### Описание

GFM — сетап, который работает внутри **трендовой структуры** после работы с **15M имбалансом**. Вся разметка графика происходит с помощью **линейного графика**.

### Фактор для набора позиции

Образование и **погружение цены в 15M имбаланс**.

### Модель входа

Реакция на имбаланс с выполнением двух условий:

1. Погружение и реакция на имбаланс **15M CISD**
2. Появление **1M CISD** (смена стороны доставки на 1-минутном графике)

### Параметры управления позицией

- RR > 1.5 / **Тейк профит** на ближайшем **1H фрактале**
- RR < 1.5 / BE на 1H фрактале, тянуть RR до 1.5+
- Стоп за инвалидацию идеи = за слом **15M структуры** против позиции

### Условия пропуска сделки

1. Против позиции есть **сегодняшний 1H+ имбаланс**, который ещё не был протестирован
2. Стоп **≥ 100 пунктов** — безусловный скип
3. Если Азия ночью открылась огромной палкой/гэпом, против нее не открываются позиции ни в коем случае, только в сторону гэпа

Backtest: Link (https://best-quiver-1cd.notion.site/GER40-London-NY-01-2025-09-2025-FVG-CISD-2a15865037c180a3b826f5060c066898?source=copy_link)`;


const notion = new Client({ auth: process.env.NOTION_TOKEN });

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractTitle(prop: unknown): string {
  if (!prop || typeof prop !== "object") return "";
  const p = prop as Record<string, unknown>;
  if (!Array.isArray(p.title)) return "";
  return p.title.map((t: { plain_text?: string }) => t.plain_text ?? "").join("");
}

function extractSelect(prop: unknown): string {
  if (!prop || typeof prop !== "object") return "";
  const p = prop as Record<string, unknown>;
  if (!p.select || typeof p.select !== "object") return "";
  return (p.select as { name?: string }).name ?? "";
}

function extractNumber(prop: unknown): number | null {
  if (!prop || typeof prop !== "object") return null;
  const p = prop as Record<string, unknown>;
  // Plain number field
  if (typeof p.number === "number") return p.number;
  // Formula field that resolves to a number
  if (p.formula && typeof p.formula === "object") {
    const f = p.formula as Record<string, unknown>;
    if (typeof f.number === "number") return f.number;
  }
  return null;
}

function extractRichText(prop: unknown): string {
  if (!prop || typeof prop !== "object") return "";
  const p = prop as Record<string, unknown>;
  if (!Array.isArray(p.rich_text)) return "";
  return p.rich_text.map((t: { plain_text?: string }) => t.plain_text ?? "").join("");
}

function extractDate(prop: unknown): string {
  if (!prop || typeof prop !== "object") return "";
  const p = prop as Record<string, unknown>;
  if (!p.date || typeof p.date !== "object") return "";
  return (p.date as { start?: string }).start ?? "";
}

/** Relation fields hold [{ id: pageId }]. Resolve the first related page's title. */
async function resolveRelationTitle(prop: unknown): Promise<string> {
  if (!prop || typeof prop !== "object") return "";
  const p = prop as Record<string, unknown>;
  if (!Array.isArray(p.relation) || p.relation.length === 0) return "";
  const relId = (p.relation[0] as { id: string }).id;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page: any = await notion.pages.retrieve({ page_id: relId });
    // Most linked DBs have a title property
    const props = page.properties as Record<string, unknown>;
    for (const key of Object.keys(props)) {
      const val = extractTitle(props[key]);
      if (val) return val;
    }
  } catch {
    // relation page not accessible — return empty
  }
  return "";
}

/** Map Notion Result select → our Result type */
function mapResult(raw: string): Result {
  const lower = raw.toLowerCase();
  if (lower === "tp" || lower === "win") return "Win";
  if (lower === "sl" || lower === "loss") return "Loss";
  if (lower === "be" || lower === "breakeven" || lower === "break even") return "BE";
  if (lower === "pending" || raw === "") return "Pending";
  return "Pending";
}

// ─── Main mappers ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mapPageToTrade(page: any): Promise<Trade> {
  const props = page.properties as Record<string, unknown>;

  const dateVal   = extractDate(props["Date"]);
  const resultRaw = extractSelect(props["Result"]);
  const resultVal = mapResult(resultRaw);

  // RR: for a Loss you always lose exactly -1R (the Notion field stores planned target RR,
  //     not the actual result). Win = achieved RR. BE = 0.
  const rrRaw = extractNumber(props["RR"]) ?? 0;
  const rrVal =
    resultVal === "Loss" ? -1 :
    resultVal === "BE"   ? 0 :
    resultVal === "Win"  ? Math.abs(rrRaw) :
    rrRaw;
  const entryType   = extractSelect(props["Entry"]);           // e.g. "FVG Reaction"
  const noteVal     = extractRichText(props["Note"]) || extractRichText(props["Notes"]);
  const instrumentVal = extractTitle(props["Pair"]) || "GER40";
  const riskPct     = extractNumber(props["Risk (%)"]);

  // Session is a relation — resolve its title
  const sessionRaw = await resolveRelationTitle(props["Session"]);

  // Direction can be a select OR a relation — try select first, fall back to relation
  let directionRaw = extractSelect(props["Direction"]);
  if (!directionRaw) {
    directionRaw = await resolveRelationTitle(props["Direction"]);
  }

  // Normalise session name — empty relation stays as "Other" (displayed as "—")
  let session: Trade["session"] = "Other";
  if (!sessionRaw) session = "Other"; // empty relation → Other → shown as "—" in table
  else if (/london/i.test(sessionRaw))   session = "London";
  else if (/new york|ny|america/i.test(sessionRaw)) session = "New York";
  else if (/asian|asia/i.test(sessionRaw)) session = "Asian";

  // Normalise direction — empty means not filled in Notion → Unknown
  let direction: Trade["direction"] = "Unknown";
  if (/short|sell/i.test(directionRaw)) direction = "Short";
  else if (/long|buy/i.test(directionRaw)) direction = "Long";

  return {
    id: page.id,
    date: dateVal,
    session,
    instrument: instrumentVal,
    direction,
    entry: null,        // no numeric entry price in this DB
    sl: null,
    tp: null,
    rr: rrVal,
    result: resultVal,
    notes: entryType || "",
    note: noteVal || undefined,
    riskPct: riskPct ?? undefined,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function fetchTrades(): Promise<Trade[]> {
  const dbId = process.env.NOTION_DATABASE_ID;
  if (!dbId) return [];

  const trades: Trade[] = [];
  let cursor: string | undefined;

  do {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
      sorts: [{ property: "Date", direction: "descending" }],
    });

    const mapped = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response.results.map(async (page: any) => {
        try {
          const trade = await mapPageToTrade(page);
          return trade.date ? trade : null;
        } catch {
          return null;
        }
      })
    );

    trades.push(...(mapped.filter(Boolean) as Trade[]));
    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  return trades;
}

export async function fetchSetupPage(): Promise<SetupCard | null> {
  const pageId = process.env.NOTION_SETUP_PAGE_ID;
  if (!pageId) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blocks: any = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });

    let description = "";
    const imageUrls: string[] = [];
    const tags: string[] = [];
    let name = "GER40 GFM";

    for (const block of blocks.results) {
      if (block.type === "heading_1" || block.type === "heading_2" || block.type === "heading_3") {
        const key = block.type as "heading_1" | "heading_2" | "heading_3";
        const text = block[key].rich_text.map((t: { plain_text?: string }) => t.plain_text ?? "").join("");
        if (text && name === "GER40 GFM") name = text;
      } else if (block.type === "paragraph") {
        const text = block.paragraph.rich_text.map((t: { plain_text?: string }) => t.plain_text ?? "").join("");
        if (text) description += (description ? "\n\n" : "") + text;
      } else if (block.type === "bulleted_list_item") {
        const text = block.bulleted_list_item.rich_text.map((t: { plain_text?: string }) => t.plain_text ?? "").join("");
        if (text) tags.push(text);
      } else if (block.type === "image") {
        const img = block.image;
        const url = img?.file?.url || img?.external?.url;
        if (url) imageUrls.push(url);
      }
    }

    return {
      id: pageId,
      name: "Guarded Flow Model",
      description: GFM_DESCRIPTION,
      instrument: "GER40",
      timeframe: "1H / 15M / 1M",
      session: "London / NY",
      imageUrls,
      tags: [],
    };
  } catch {
    return {
      id: "ger40-gfm",
      name: "Guarded Flow Model",
      description: GFM_DESCRIPTION,
      instrument: "GER40",
      timeframe: "1H / 15M / 1M",
      session: "London / NY",
      imageUrls: [],
      tags: [],
    };
  }
}

// ─── AI Monthly Reviews ───────────────────────────────────────────────────────

export interface AIReview {
  monthKey: string;   // "2026-05"
  wentWell: string;
  toImprove: string;
}

export async function fetchAIReviews(): Promise<AIReview[]> {
  const dbId = process.env.NOTION_REVIEWS_DB_ID;
  if (!dbId) return [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await notion.databases.query({
      database_id: dbId,
      sorts: [{ property: "Generated At", direction: "descending" }],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.results.map((page: any) => {
      const props = page.properties as Record<string, unknown>;
      const monthKey   = extractTitle(props["Month"]);
      const wentWell   = (props["Went Well"]  as { rich_text?: { plain_text?: string }[] })
        ?.rich_text?.map((t) => t.plain_text ?? "").join("") ?? "";
      const toImprove  = (props["To Improve"] as { rich_text?: { plain_text?: string }[] })
        ?.rich_text?.map((t) => t.plain_text ?? "").join("") ?? "";
      return { monthKey, wentWell, toImprove };
    }).filter((r: AIReview) => r.monthKey && (r.wentWell || r.toImprove));
  } catch {
    return [];
  }
}
