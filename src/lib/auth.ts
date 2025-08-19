// src/lib/auth.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

/** Nombre de la cookie donde guardamos el id de sesión */
const SESSION_COOKIE = "session";

/** Crea una sesión para un usuario y setea cookie httpOnly */
export async function createSession(userId: string) {
  const id = randomUUID();

  await prisma.session.create({
    data: { id, userId },
  });

  const c = await cookies();
  c.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  return id;
}

/** Devuelve el id de sesión desde la cookie (o null si no hay) */
export async function getSessionId(): Promise<string | null> {
  const c = await cookies();
  const v = c.get(SESSION_COOKIE)?.value;
  return v ?? null;
}

/** Devuelve el usuario logueado (via cookie de sesión) o null */
export async function getSessionUser() {
  const sid = await getSessionId();
  if (!sid) return null;

  const session = await prisma.session.findUnique({
    where: { id: sid },
    include: { user: true },
  });

  return session?.user ?? null;
}

/** Lanza 401 si no hay usuario; devuelve el user id si hay */
export async function requireUserId() {
  const user = await getSessionUser();
  if (!user) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return user.id;
}

/** Cierra la sesión actual (borra cookie y elimina registro) */
export async function destroySession() {
  const sid = await getSessionId();
  const c = await cookies();

  if (sid) {
    await prisma.session.delete({ where: { id: sid } }).catch(() => {});
  }

  // Expira cookie
  c.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

