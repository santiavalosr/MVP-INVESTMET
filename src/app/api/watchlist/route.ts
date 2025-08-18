import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const items = await prisma.watchlistItem.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

const PostSchema = z.object({ symbol: z.string().min(1).max(10).toUpperCase() });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const { symbol } = PostSchema.parse(await req.json());

  const item = await prisma.watchlistItem.upsert({
    where: { userId_symbol: { userId: session.userId, symbol } },
    update: {},
    create: { userId: session.userId, symbol },
  });

  return NextResponse.json({ item });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "";
  if (!symbol) return NextResponse.json({ error: "symbol requerido" }, { status: 400 });

  await prisma.watchlistItem.delete({
    where: { userId_symbol: { userId: session.userId, symbol } },
  });

  return NextResponse.json({ ok: true });
}


