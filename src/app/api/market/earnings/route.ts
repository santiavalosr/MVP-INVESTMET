import { NextResponse } from "next/server";
import { market } from "@/lib/market";

export const revalidate = 0;

/**
 * GET /api/market/earnings?symbol=AAPL
 */
export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get("symbol")?.toUpperCase() || "";
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });

  try {
    const data = await market.earnings(symbol);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Error" }, { status: 500 });
  }
}

