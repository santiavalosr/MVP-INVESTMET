// src/app/api/snapshot/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { avQuote } from "@/lib/alpha";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { symbol } = await req.json();
  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  try {
    // obtener la cotización en ese momento
    const q = await avQuote(symbol);

    // guardar snapshot en la base de datos
    const snap = await prisma.priceSnapshot.create({
      data: {
        userId: session.userId,
        symbol: q.symbol,
        price: q.price,
        source: "alpha_vantage",
      },
    });

    return NextResponse.json({ ok: true, snapshot: snap });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Error al guardar snapshot" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.toUpperCase() || null;
  const limit = Number(searchParams.get("limit") ?? 200);

  const rows = await prisma.priceSnapshot.findMany({
    where: {
      userId: session.userId,
      ...(symbol ? { symbol } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 500),
  });

  return NextResponse.json({ snapshots: rows });
}

