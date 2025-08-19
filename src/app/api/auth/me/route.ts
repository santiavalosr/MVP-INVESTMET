import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth"; // <-- cambia getSession por getSessionUser

export async function GET() {
  const user = await getSessionUser();
  // Devuelve null si no hay sesión, o datos básicos del usuario si la hay
  return NextResponse.json({
    user: user ? { id: user.id, email: user.email } : null,
  });
}

