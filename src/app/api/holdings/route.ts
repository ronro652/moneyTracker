import { db } from "@/lib/db";
import { holdings, portfolios, stockPrices } from "@/lib/db/schema";
import { requireAuth } from "@/lib/require-auth";
import { addHoldingSchema } from "@/lib/validations";
import { roundShares } from "@/lib/shares";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const portfolioId = req.nextUrl.searchParams.get("portfolio_id");

  const conditions = [eq(portfolios.userId, auth.user.id)];
  if (portfolioId) {
    conditions.push(eq(holdings.portfolioId, Number(portfolioId)));
  }

  const rows = await db
    .select({
      id: holdings.id,
      ticker: holdings.ticker,
      name: holdings.name,
      shares: holdings.shares,
      avg_cost: holdings.avgCost,
      portfolio_id: holdings.portfolioId,
      asset_type: holdings.assetType,
      created_at: holdings.createdAt,
      current_price: stockPrices.price,
      change_percent: stockPrices.changePercent,
    })
    .from(holdings)
    .innerJoin(portfolios, eq(portfolios.id, holdings.portfolioId))
    .leftJoin(stockPrices, eq(stockPrices.ticker, holdings.ticker))
    .where(and(...conditions))
    .orderBy(sql`${holdings.createdAt} desc`);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const parsed = addHoldingSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { ticker, name, shares, avg_cost, portfolio_id, asset_type } = parsed.data;

  const portfolio = await db
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolio_id), eq(portfolios.userId, auth.user.id)));
  if (portfolio.length === 0) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(holdings)
    .where(
      and(
        eq(holdings.ticker, ticker),
        eq(holdings.portfolioId, portfolio_id),
        eq(holdings.assetType, asset_type),
      ),
    );

  if (existing.length > 0) {
    const h = existing[0];
    const totalShares = roundShares(h.shares + shares);
    const totalCost = h.shares * h.avgCost + shares * avg_cost;
    const newAvgCost = totalCost / totalShares;
    await db.update(holdings).set({ shares: totalShares, avgCost: newAvgCost }).where(eq(holdings.id, h.id));
  } else {
    await db.insert(holdings).values({
      ticker: ticker.toUpperCase(),
      name: name || ticker.toUpperCase(),
      shares,
      avgCost: avg_cost,
      portfolioId: portfolio_id,
      assetType: asset_type,
    });
  }

  return NextResponse.json({ success: true });
}
