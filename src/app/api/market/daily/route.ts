// src/app/api/market/daily/route.ts
import { NextResponse } from "next/server";
import { avDaily } from "@/lib/alpha";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  try {
    const data = await avDaily(symbol);
    return NextResponse.json(data);
  } catch (e: any) {
    console.error("daily error:", e?.message || e);
    return NextResponse.json({ error: "Failed to fetch daily" }, { status: 500 });
  }
}

