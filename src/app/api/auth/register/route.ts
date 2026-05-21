import { db } from "@/lib/db";
import { users, portfolios } from "@/lib/db/schema";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { PORTFOLIO_COLORS } from "@/types";

export async function POST(req: NextRequest) {
  const parsed = registerSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { email, name, password } = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash })
    .returning({ id: users.id });

  await db.insert(portfolios).values({
    name: "My Portfolio",
    description: "Default portfolio",
    color: PORTFOLIO_COLORS[0],
    userId: user.id,
  });

  const token = await createSession(user.id);
  setSessionCookie(token);

  return NextResponse.json({ id: user.id, email, name }, { status: 201 });
}
