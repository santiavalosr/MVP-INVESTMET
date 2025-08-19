import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const revalidate = 0;

/** Devuelve la watchlist del usuario logueado */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.watchlistItem.findMany({
    where: { userId: user.id },         // <- IMPORTANTÍSIMO: filtra por el usuario
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items, {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}

/** Añade símbolo a la watchlist */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const symbol = String(body?.symbol || "").trim().toUpperCase();
  const type = (body?.type ?? "EQUITY") as "EQUITY" | "CRYPTO" | "INDEX";

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  try {
    const created = await prisma.watchlistItem.create({
      data: { userId: user.id, symbol, type }, // <- usa SIEMPRE user.id
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    // Violación de índice único [userId, symbol, type]
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Ya está en tu watchlist" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al crear" }, { status: 500 });
  }
}

