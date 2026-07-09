import { db } from "@/lib/db";
import { investmentTransactions, holdings, portfolios } from "@/lib/db/schema";
import { requireAuth } from "@/lib/require-auth";
import { createTransactionSchema } from "@/lib/validations";
import { roundShares } from "@/lib/shares";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const portfolioId = req.nextUrl.searchParams.get("portfolio_id");

  const conditions = [eq(portfolios.userId, auth.user.id)];
  if (portfolioId) {
    conditions.push(eq(investmentTransactions.portfolioId, Number(portfolioId)));
  }

  const rows = await db
    .select({
      id: investmentTransactions.id,
      portfolio_id: investmentTransactions.portfolioId,
      ticker: investmentTransactions.ticker,
      name: investmentTransactions.name,
      asset_type: investmentTransactions.assetType,
      type: investmentTransactions.type,
      shares: investmentTransactions.shares,
      price_per_share: investmentTransactions.pricePerShare,
      total_amount: investmentTransactions.totalAmount,
      realized_gain: investmentTransactions.realizedGain,
      created_at: investmentTransactions.createdAt,
    })
    .from(investmentTransactions)
    .innerJoin(portfolios, eq(portfolios.id, investmentTransactions.portfolioId))
    .where(and(...conditions))
    .orderBy(sql`${investmentTransactions.createdAt} desc`);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const parsed = createTransactionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { ticker, name, shares, price_per_share, portfolio_id, asset_type, type } = parsed.data;

  const portfolio = await db
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolio_id), eq(portfolios.userId, auth.user.id)));

  if (portfolio.length === 0) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const totalAmount = shares * price_per_share;
  const tickerUpper = ticker.toUpperCase();
  const holdingName = name || tickerUpper;

  if (type === "sell") {
    const existing = await db
      .select()
      .from(holdings)
      .where(
        and(
          eq(holdings.ticker, tickerUpper),
          eq(holdings.portfolioId, portfolio_id),
          eq(holdings.assetType, asset_type),
        ),
      );

    const holding = existing[0];
    if (!holding || holding.shares < shares) {
      return NextResponse.json(
        { error: `Not enough shares to sell. You have ${holding?.shares ?? 0}` },
        { status: 400 },
      );
    }

    const realizedGain = (price_per_share - holding.avgCost) * shares;
    const remainingShares = roundShares(holding.shares - shares);

    if (remainingShares < 0.0001) {
      await db.delete(holdings).where(eq(holdings.id, holding.id));
    } else {
      await db.update(holdings).set({ shares: remainingShares }).where(eq(holdings.id, holding.id));
    }

    await db.insert(investmentTransactions).values({
      portfolioId: portfolio_id,
      ticker: tickerUpper,
      name: holdingName,
      assetType: asset_type,
      type: "sell",
      shares,
      pricePerShare: price_per_share,
      totalAmount,
      realizedGain,
    });

    return NextResponse.json({ success: true, realized_gain: realizedGain });
  }

  // Buy
  const existing = await db
    .select()
    .from(holdings)
    .where(
      and(
        eq(holdings.ticker, tickerUpper),
        eq(holdings.portfolioId, portfolio_id),
        eq(holdings.assetType, asset_type),
      ),
    );

  if (existing.length > 0) {
    const h = existing[0];
    const totalShares = roundShares(h.shares + shares);
    const totalCost = h.shares * h.avgCost + shares * price_per_share;
    const newAvgCost = totalCost / totalShares;
    await db.update(holdings).set({ shares: totalShares, avgCost: newAvgCost }).where(eq(holdings.id, h.id));
  } else {
    await db.insert(holdings).values({
      ticker: tickerUpper,
      name: holdingName,
      shares,
      avgCost: price_per_share,
      portfolioId: portfolio_id,
      assetType: asset_type,
    });
  }

  await db.insert(investmentTransactions).values({
    portfolioId: portfolio_id,
    ticker: tickerUpper,
    name: holdingName,
    assetType: asset_type,
    type: "buy",
    shares,
    pricePerShare: price_per_share,
    totalAmount,
    realizedGain: null,
  });

  return NextResponse.json({ success: true });
}
