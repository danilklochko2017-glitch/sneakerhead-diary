import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const dbId = process.env.NOTION_DATABASE_ID;
  if (!dbId) return NextResponse.json({ error: "no db id" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await notion.databases.query({
    database_id: dbId,
    page_size: 20,
    sorts: [{ property: "Date", direction: "descending" }],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debug = response.results.map((page: any) => {
    const props = page.properties as Record<string, unknown>;
    return {
      date: (props["Date"] as { date?: { start?: string } })?.date?.start,
      result: (props["Result"] as { select?: { name?: string } })?.select?.name,
      rr: (props["RR"] as { number?: number })?.number,
      direction: props["Direction"],
      entry: props["Entry"],
    };
  });

  return NextResponse.json(debug, { status: 200 });
}
