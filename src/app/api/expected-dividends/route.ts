import { db } from "@/lib/db";
import { dividends, holdings, portfolios } from "@/lib/db/schema";
import { requireAuth } from "@/lib/require-auth";
import { roundShares } from "@/lib/shares";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function detectFrequency(dates: Date[]): {
  frequency: "monthly" | "quarterly" | "semi-annual" | "annual" | "irregular";
  avgDaysBetween: number;
} {
  if (dates.length < 2) return { frequency: "annual", avgDaysBetween: 365 };

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push((sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24));
  }

  const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

  if (avgGap <= 45) return { frequency: "monthly", avgDaysBetween: Math.round(avgGap) };
  if (avgGap <= 120) return { frequency: "quarterly", avgDaysBetween: Math.round(avgGap) };
  if (avgGap <= 220) return { frequency: "semi-annual", avgDaysBetween: Math.round(avgGap) };
  if (avgGap <= 450) return { frequency: "annual", avgDaysBetween: Math.round(avgGap) };
  return { frequency: "irregular", avgDaysBetween: Math.round(avgGap) };
}

function frequencyMultiplier(freq: string): number {
  switch (freq) {
    case "monthly": return 12;
    case "quarterly": return 4;
    case "semi-annual": return 2;
    case "annual": return 1;
    default: return 1;
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const portfolioId = req.nextUrl.searchParams.get("portfolio_id");

  const conditions = [eq(portfolios.userId, auth.user.id)];
  if (portfolioId) {
    conditions.push(eq(holdings.portfolioId, Number(portfolioId)));
  }

  const userHoldings = await db
    .select({
      ticker: holdings.ticker,
      name: holdings.name,
      shares: holdings.shares,
      portfolio_id: holdings.portfolioId,
      asset_type: holdings.assetType,
    })
    .from(holdings)
    .innerJoin(portfolios, eq(portfolios.id, holdings.portfolioId))
    .where(and(...conditions));

  const stockHoldings = userHoldings.filter((h) => h.asset_type === "stock");
  if (stockHoldings.length === 0) {
    return NextResponse.json([]);
  }

  const tickerShares = new Map<string, { name: string; totalShares: number }>();
  for (const h of stockHoldings) {
    const existing = tickerShares.get(h.ticker);
    if (existing) {
      existing.totalShares = roundShares(existing.totalShares + h.shares);
    } else {
      tickerShares.set(h.ticker, { name: h.name, totalShares: h.shares });
    }
  }

  const divConditions = [eq(portfolios.userId, auth.user.id)];
  if (portfolioId) {
    divConditions.push(eq(dividends.portfolioId, Number(portfolioId)));
  }

  const allDividends = await db
    .select({
      ticker: dividends.ticker,
      dividend_per_share: dividends.dividendPerShare,
      ex_date: dividends.exDate,
      amount: dividends.amount,
    })
    .from(dividends)
    .innerJoin(portfolios, eq(portfolios.id, dividends.portfolioId))
    .where(and(...divConditions))
    .orderBy(sql`${dividends.exDate} asc`);

  const divsByTicker = new Map<string, typeof allDividends>();
  for (const d of allDividends) {
    const list = divsByTicker.get(d.ticker) || [];
    list.push(d);
    divsByTicker.set(d.ticker, list);
  }

  const today = new Date();
  const results: Array<{
    ticker: string;
    name: string;
    current_shares: number;
    last_dividend_per_share: number;
    estimated_amount: number;
    frequency: string;
    next_expected_date: string;
    annual_estimate: number;
    days_until: number;
  }> = [];

  for (const [ticker, info] of tickerShares) {
    const divs = divsByTicker.get(ticker);
    if (!divs || divs.length === 0) continue;

    const dates = divs.map((d) => new Date(d.ex_date + "T00:00:00"));
    const { frequency, avgDaysBetween } = detectFrequency(dates);

    const lastDiv = divs[divs.length - 1];
    const lastDate = new Date(lastDiv.ex_date + "T00:00:00");
    const nextDate = new Date(lastDate.getTime() + avgDaysBetween * 24 * 60 * 60 * 1000);

    while (nextDate < today) {
      nextDate.setTime(nextDate.getTime() + avgDaysBetween * 24 * 60 * 60 * 1000);
    }

    const recentDivs = divs.slice(-4);
    const avgDps = recentDivs.reduce((s, d) => s + d.dividend_per_share, 0) / recentDivs.length;

    const estimatedAmount = avgDps * info.totalShares;
    const annualEstimate = avgDps * info.totalShares * frequencyMultiplier(frequency);
    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    results.push({
      ticker,
      name: info.name,
      current_shares: info.totalShares,
      last_dividend_per_share: avgDps,
      estimated_amount: Math.round(estimatedAmount * 100) / 100,
      frequency,
      next_expected_date: nextDate.toISOString().split("T")[0],
      annual_estimate: Math.round(annualEstimate * 100) / 100,
      days_until: daysUntil,
    });
  }

  results.sort((a, b) => a.days_until - b.days_until);

  return NextResponse.json(results);
}
