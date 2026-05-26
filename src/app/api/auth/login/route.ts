import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { ok, remaining } = rateLimit(`login:${ip}`, 5);
  if (!ok) {
    logger.warn({ ip }, "Login rate limit exceeded");
    return NextResponse.json({ error: "Too many login attempts. Try again in a minute." }, { status: 429 });
  }

  const parsed = loginSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email));

  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    logger.info({ ip, email }, "Failed login attempt");
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createSession(user.id);
  setSessionCookie(token);

  logger.info({ userId: user.id }, "User logged in");
  const res = NextResponse.json({ id: user.id, email: user.email, name: user.name });
  res.headers.set("X-RateLimit-Remaining", String(remaining));
  return res;
}
