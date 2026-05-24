import { db } from "@/lib/db";
import { dividends, portfolios } from "@/lib/db/schema";
import { requireAuth } from "@/lib/require-auth";
import { createDividendSchema } from "@/lib/validations";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const portfolioId = req.nextUrl.searchParams.get("portfolio_id");

  const conditions = [eq(portfolios.userId, auth.user.id)];
  if (portfolioId) {
    conditions.push(eq(dividends.portfolioId, Number(portfolioId)));
  }

  const rows = await db
    .select({
      id: dividends.id,
      portfolio_id: dividends.portfolioId,
      holding_id: dividends.holdingId,
      ticker: dividends.ticker,
      amount: dividends.amount,
      dividend_per_share: dividends.dividendPerShare,
      shares: dividends.shares,
      ex_date: dividends.exDate,
      pay_date: dividends.payDate,
      source: dividends.source,
      created_at: dividends.createdAt,
    })
    .from(dividends)
    .innerJoin(portfolios, eq(portfolios.id, dividends.portfolioId))
    .where(and(...conditions))
    .orderBy(sql`${dividends.exDate} desc`);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const parsed = createDividendSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { ticker, dividend_per_share, shares, portfolio_id, ex_date, pay_date } = parsed.data;

  const portfolio = await db
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolio_id), eq(portfolios.userId, auth.user.id)));

  if (portfolio.length === 0) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const tickerUpper = ticker.toUpperCase();
  const amount = dividend_per_share * shares;

  await db.insert(dividends).values({
    portfolioId: portfolio_id,
    ticker: tickerUpper,
    amount,
    dividendPerShare: dividend_per_share,
    shares,
    exDate: ex_date,
    payDate: pay_date || null,
    source: "manual",
  });

  return NextResponse.json({ success: true });
}
