import { NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function middleware(req: NextRequest) {
  if (SAFE_METHODS.has(req.method)) return NextResponse.next();

  // Cron jobs authenticate via Bearer token, not cookies
  if (req.nextUrl.pathname.startsWith("/api/cron/")) return NextResponse.next();

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (!origin || !host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (originHost !== host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
