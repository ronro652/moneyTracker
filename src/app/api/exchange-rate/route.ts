import { db } from "@/lib/db";
import { exchangeRates } from "@/lib/db/schema";
import { fetchExchangeRate } from "@/lib/finnhub";
import { requireAuth } from "@/lib/require-auth";
import { eq, and, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const from = req.nextUrl.searchParams.get("from") || "USD";
  const to = req.nextUrl.searchParams.get("to") || "ILS";
  const cacheKey = `${from}_${to}`;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const cached = await db
    .select({ rate: exchangeRates.rate })
    .from(exchangeRates)
    .where(and(eq(exchangeRates.pair, cacheKey), gt(exchangeRates.updatedAt, oneHourAgo)));

  if (cached.length > 0) {
    return NextResponse.json({ rate: cached[0].rate, from, to });
  }

  const rate = await fetchExchangeRate(from, to);
  if (rate === null) {
    const stale = await db
      .select({ rate: exchangeRates.rate })
      .from(exchangeRates)
      .where(eq(exchangeRates.pair, cacheKey));
    return NextResponse.json({ rate: stale[0]?.rate ?? 3.6, from, to });
  }

  await db
    .insert(exchangeRates)
    .values({ pair: cacheKey, rate, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: exchangeRates.pair,
      set: { rate, updatedAt: new Date() },
    });

  return NextResponse.json({ rate, from, to });
}
