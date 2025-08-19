// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export const revalidate = 0;

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  // crea sesión (tabla Session)
  const sessionId = randomUUID();
  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      // expiresAt: new Date(Date.now() + 1000*60*60*24*7),
    },
  });

  // set cookie httpOnly
  const c = cookies();
  c.set("session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}

