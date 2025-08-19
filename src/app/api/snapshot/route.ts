// src/app/api/snapshot/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { market } from "@/lib/market";

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
    // Trae precio actual
    const q = await market.quote(String(symbol).toUpperCase());

    const snap = await prisma.priceSnapshot.create({
      data: {
        userId: session.userId,
        symbol: q.symbol,
        price: q.price,
        source: q.source ?? "alpha",
        asOf: new Date(),            // <<<<<<  NECESARIO
      },
    });

    return NextResponse.json({ ok: true, snapshot: snap });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "Error al guardar snapshot" },
      { status: 500 }
    );
  }
}

