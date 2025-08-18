// src/app/api/market/quote/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { avQuote } from "@/lib/alpha";

const FRESH_MS = 60_000; // 1 minuto

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase().trim();
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });

  const cached = await prisma.quoteCache.findUnique({ where: { symbol } });
  const now = Date.now();

  // 1) devolver caché si está fresco
  if (cached && now - cached.fetchedAt.getTime() < FRESH_MS) {
    return NextResponse.json({
      symbol,
      price: Number(cached.price),
      change: cached.change != null ? Number(cached.change) : null,
      changePercent: cached.changePercent != null ? Number(cached.changePercent) : null,
      ts: cached.fetchedAt,
      cached: true,
    });
  }

  // 2) si no hay fresco, intentamos ir a Alpha
  try {
    const q = await avQuote(symbol);

    // guardar/actualizar caché
    await prisma.quoteCache.upsert({
      where: { symbol },
      update: {
        price: q.price,
        change: isFinite(q.change) ? q.change : null,
        changePercent: isFinite(q.changePercent) ? q.changePercent : null,
        fetchedAt: new Date(),
      },
      create: {
        symbol,
        price: q.price,
        change: isFinite(q.change) ? q.change : null,
        changePercent: isFinite(q.changePercent) ? q.changePercent : null,
        fetchedAt: new Date(),
      },
    });

    return NextResponse.json(q);
  } catch (e: any) {
    // 3) si Alpha falla (429, etc.) y tenemos algo en cache, devolvemos eso
    if (cached) {
      return NextResponse.json({
        symbol,
        price: Number(cached.price),
        change: cached.change != null ? Number(cached.change) : null,
        changePercent: cached.changePercent != null ? Number(cached.changePercent) : null,
        ts: cached.fetchedAt,
        cached: true,
        stale: true,
        note: e?.message ?? "Alpha error",
      });
    }
    return NextResponse.json({ error: e?.message ?? "Fetch failed" }, { status: 429 });
  }
}

