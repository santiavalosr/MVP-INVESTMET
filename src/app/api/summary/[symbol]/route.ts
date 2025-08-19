// src/app/api/summary/[symbol]/route.ts
import { NextResponse } from "next/server";
import { getOnePager } from "@/lib/onepager";

export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: { symbol: string } }
) {
  const symbol = decodeURIComponent(params.symbol || "").toUpperCase();
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });

  try {
    const data = await getOnePager(symbol);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}

