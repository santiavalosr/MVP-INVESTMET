import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { createSession } from "@/lib/auth";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const { email, password } = Schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

    await createSession({ id: user.id, email: user.email });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Error" }, { status: 400 });
  }
}


