// src/app/api/market/quote/route.ts
import { NextResponse } from "next/server";
import { market } from "@/lib/market";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase().trim();
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });

  try {
    const q = await market.quote(symbol); // usa Alpha Premium (Global Quote)
    const res = NextResponse.json(q);
    // **no caches anywhere**
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.headers.set("CDN-Cache-Control", "no-store");
    res.headers.set("Vercel-CDN-Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}

