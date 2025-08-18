// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "mvp_token";

export async function middleware(req: NextRequest) {
  // Protegemos /watchlist y subrutas
  if (!req.nextUrl.pathname.startsWith("/watchlist")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("returnUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || "dev-secret-change-me"
    );
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("returnUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/watchlist/:path*"],
};


