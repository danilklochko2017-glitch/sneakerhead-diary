import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) return NextResponse.json({ urls: [] });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blocks: any = await notion.blocks.children.list({
      block_id: id,
      page_size: 50,
    });

    const urls: string[] = [];

    for (const block of blocks.results) {
      // Direct image block
      if (block.type === "image") {
        const url = block.image?.file?.url || block.image?.external?.url;
        if (url) urls.push(url);
      }

      // Callout / column / other blocks that may contain nested images
      if (block.has_children) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const children: any = await notion.blocks.children.list({
          block_id: block.id,
          page_size: 20,
        });
        for (const child of children.results) {
          if (child.type === "image") {
            const url = child.image?.file?.url || child.image?.external?.url;
            if (url) urls.push(url);
          }
        }
      }
    }

    return NextResponse.json({ urls });
  } catch (e) {
    console.error("trade-images error:", e);
    return NextResponse.json({ urls: [] });
  }
}
