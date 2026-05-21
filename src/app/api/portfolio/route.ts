import { db } from "@/lib/db";
import { portfolios, portfolioSnapshots } from "@/lib/db/schema";
import { requireAuth } from "@/lib/require-auth";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const portfolioId = req.nextUrl.searchParams.get("portfolio_id");

  if (portfolioId) {
    const portfolio = await db
      .select({ id: portfolios.id })
      .from(portfolios)
      .where(and(eq(portfolios.id, Number(portfolioId)), eq(portfolios.userId, auth.user.id)));

    if (portfolio.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const snapshots = await db
      .select({
        date: portfolioSnapshots.date,
        total_value: portfolioSnapshots.totalValue,
        total_cost: portfolioSnapshots.totalCost,
        portfolio_id: portfolioSnapshots.portfolioId,
      })
      .from(portfolioSnapshots)
      .where(eq(portfolioSnapshots.portfolioId, Number(portfolioId)))
      .orderBy(sql`${portfolioSnapshots.date} asc`)
      .limit(1460);

    return NextResponse.json(snapshots);
  }

  const snapshots = await db
    .select({
      date: portfolioSnapshots.date,
      total_value: sql<number>`sum(${portfolioSnapshots.totalValue})`,
      total_cost: sql<number>`sum(${portfolioSnapshots.totalCost})`,
    })
    .from(portfolioSnapshots)
    .innerJoin(portfolios, eq(portfolios.id, portfolioSnapshots.portfolioId))
    .where(eq(portfolios.userId, auth.user.id))
    .groupBy(portfolioSnapshots.date)
    .orderBy(sql`${portfolioSnapshots.date} asc`)
    .limit(1460);

  return NextResponse.json(snapshots);
}
