import { db } from "@/lib/db";
import { holdings, portfolios } from "@/lib/db/schema";
import { requireAuth } from "@/lib/require-auth";
import { fetchDividends } from "@/lib/finnhub";
import { getCachedDividendApiStatus, setCachedDividendApiStatus } from "@/lib/dividendApiStatus";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Reports whether automatic dividend detection is currently usable with the
 * configured Finnhub API key. On the free tier, /stock/dividend requires a
 * paid plan and always fails - the dashboard uses this to tell users to add
 * dividends manually instead of showing an indistinguishable "no data yet"
 * empty state.
 *
 * `available: null` means "unknown / not applicable" (e.g. the user holds
 * no stocks yet, so we have nothing to probe with).
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const userHoldings = await db
    .select({ ticker: holdings.ticker, assetType: holdings.assetType })
    .from(holdings)
    .innerJoin(portfolios, eq(portfolios.id, holdings.portfolioId))
    .where(eq(portfolios.userId, auth.user.id));

  const stockTicker = userHoldings.find((h) => h.assetType === "stock")?.ticker;
  if (!stockTicker) {
    return NextResponse.json({ available: null });
  }

  const cached = getCachedDividendApiStatus();
  if (cached !== null) {
    return NextResponse.json({ available: !cached });
  }

  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const { restricted } = await fetchDividends(stockTicker, from, to);
  setCachedDividendApiStatus(restricted);

  return NextResponse.json({ available: !restricted });
}
