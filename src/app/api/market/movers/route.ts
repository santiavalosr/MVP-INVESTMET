import { NextResponse } from "next/server";
import { market } from "@/lib/market";

export const revalidate = 0;

/**
 * GET /api/market/movers
 * Respuesta: { top_gainers:[], top_losers:[], most_actively_traded:[] }
 */
export async function GET() {
  try {
    const data = await market.movers();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Error" }, { status: 500 });
  }
}

