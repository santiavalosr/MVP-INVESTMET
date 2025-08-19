import { NextResponse } from "next/server";
import { market } from "@/lib/market";

export const revalidate = 0;

/**
 * GET /api/market/news?symbol=AAPL&limit=6
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase();
  const limit = Number(searchParams.get("limit") || "6");

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  try {
    const items = await market.news(symbol, limit);
    return NextResponse.json(items);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Error" }, { status: 500 });
  }
}

