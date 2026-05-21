import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { requireAuth } from "@/lib/require-auth";
import { createPortfolioSchema } from "@/lib/validations";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { PORTFOLIO_COLORS } from "@/types";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const rows = await db
    .select()
    .from(portfolios)
    .where(eq(portfolios.userId, auth.user.id))
    .orderBy(sql`${portfolios.createdAt} asc`);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const parsed = createPortfolioSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name, description } = parsed.data;

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(portfolios)
    .where(eq(portfolios.userId, auth.user.id));
  const count = Number(countRows[0].count);
  const color = PORTFOLIO_COLORS[count % PORTFOLIO_COLORS.length];

  const [portfolio] = await db
    .insert(portfolios)
    .values({ name, description, color, userId: auth.user.id })
    .returning();

  return NextResponse.json(portfolio, { status: 201 });
}
