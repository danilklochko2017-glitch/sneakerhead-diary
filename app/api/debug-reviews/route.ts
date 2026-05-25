import { NextResponse } from "next/server";
import { fetchAIReviews } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reviews = await fetchAIReviews();
    return NextResponse.json({ count: reviews.length, reviews });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
