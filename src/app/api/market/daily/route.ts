// src/app/api/market/daily/route.ts
import { NextResponse } from "next/server";
import { market } from "@/lib/market";

export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase();
  const type = (searchParams.get("type") || "EQUITY").toUpperCase() as "EQUITY" | "CRYPTO";
  const days = Number(searchParams.get("days") || "90");
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });

  try {
    const data = await market.history(symbol, type, days);
    return NextResponse.json(data);
  } catch (e:any) {
    return NextResponse.json({ error: e.message ?? "Error" }, { status: 500 });
  }
}

