import { db } from "./db";
import {
  users,
  portfolios,
  holdings,
  stockPrices,
  portfolioSnapshots,
  dividends,
} from "./db/schema";
import { eq, and, gt } from "drizzle-orm";
import { fetchStockQuote, fetchCryptoQuote, fetchDividends } from "./finnhub";
import { logger } from "./logger";
import { setCachedDividendApiStatus } from "./dividendApiStatus";

const BUCKET_HOURS = 3;

export async function refreshPricesAndSnapshot(userId: number) {
  const userHoldings = await db
    .selectDistinct({ ticker: holdings.ticker, assetType: holdings.assetType })
    .from(holdings)
    .innerJoin(portfolios, eq(portfolios.id, holdings.portfolioId))
    .where(eq(portfolios.userId, userId));

  const results: Record<string, { price: number; changePercent: number }> = {};

  for (const { ticker, assetType } of userHoldings) {
    if (results[ticker]) continue;

    const cached = await db
      .select()
      .from(stockPrices)
      .where(eq(stockPrices.ticker, ticker));

    const cachedRow = cached[0];
    const isFresh =
      cachedRow &&
      cachedRow.updatedAt > new Date(Date.now() - 15 * 60 * 1000);

    if (cachedRow && isFresh) {
      results[ticker] = {
        price: cachedRow.price,
        changePercent: cachedRow.changePercent,
      };
      continue;
    }

    let quote: Awaited<ReturnType<typeof fetchStockQuote>> = null;
    try {
      quote =
        assetType === "crypto"
          ? await fetchCryptoQuote(ticker)
          : await fetchStockQuote(ticker);
    } catch (e) {
      logger.error({ ticker, err: e }, "Failed to fetch price");
    }

    if (quote) {
      await db
        .insert(stockPrices)
        .values({
          ticker,
          price: quote.price,
          changePercent: quote.changePercent,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stockPrices.ticker,
          set: {
            price: quote.price,
            changePercent: quote.changePercent,
            updatedAt: new Date(),
          },
        });

      results[ticker] = {
        price: quote.price,
        changePercent: quote.changePercent,
      };
    } else if (cachedRow) {
      results[ticker] = {
        price: cachedRow.price,
        changePercent: cachedRow.changePercent,
      };
    }
  }

  const userPortfolios = await db
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(eq(portfolios.userId, userId));

  const now = new Date();
  const bucket = Math.floor(now.getUTCHours() / BUCKET_HOURS) * BUCKET_HOURS;
  const snapshotKey = `${now.toISOString().split("T")[0]} ${String(bucket).padStart(2, "0")}:00`;

  for (const { id: pid } of userPortfolios) {
    const portfolioHoldings = await db
      .select({ ticker: holdings.ticker, shares: holdings.shares, avgCost: holdings.avgCost })
      .from(holdings)
      .where(eq(holdings.portfolioId, pid));

    const totalValue = portfolioHoldings.reduce((sum, h) => {
      const price = results[h.ticker]?.price || 0;
      return sum + h.shares * price;
    }, 0);

    const totalCost = portfolioHoldings.reduce(
      (sum, h) => sum + h.shares * h.avgCost,
      0,
    );

    if (portfolioHoldings.length > 0) {
      await db
        .insert(portfolioSnapshots)
        .values({ date: snapshotKey, totalValue, totalCost, portfolioId: pid })
        .onConflictDoUpdate({
          target: [portfolioSnapshots.date, portfolioSnapshots.portfolioId],
          set: { totalValue, totalCost },
        });
    }
  }

  return results;
}

const MINUTE_LIMIT = 60;

export async function getApiQuota() {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const rows = await db
    .select()
    .from(stockPrices)
    .where(gt(stockPrices.updatedAt, oneMinuteAgo));
  const used = rows.length;
  return { used, limit: MINUTE_LIMIT, remaining: Math.max(0, MINUTE_LIMIT - used) };
}

export async function refreshDividends(userId: number) {
  const userHoldings = await db
    .select({
      ticker: holdings.ticker,
      shares: holdings.shares,
      assetType: holdings.assetType,
      portfolioId: holdings.portfolioId,
      holdingId: holdings.id,
    })
    .from(holdings)
    .innerJoin(portfolios, eq(portfolios.id, holdings.portfolioId))
    .where(eq(portfolios.userId, userId));

  const now = new Date();
  const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const to = now.toISOString().split("T")[0];

  const seen = new Set<string>();
  for (const h of userHoldings) {
    if (h.assetType === "crypto" || seen.has(h.ticker)) continue;
    seen.add(h.ticker);

    let result;
    try {
      result = await fetchDividends(h.ticker, from, to);
    } catch (e) {
      logger.error({ ticker: h.ticker, err: e }, "Failed to fetch dividends");
      continue;
    }

    if (result.restricted) {
      // Account-level restriction (e.g. the free Finnhub plan doesn't
      // include /stock/dividend) - fetchDividends() already logged a
      // warning. No ticker will succeed this run, so stop early instead of
      // burning API quota on calls that are guaranteed to fail.
      setCachedDividendApiStatus(true);
      break;
    }

    setCachedDividendApiStatus(false);

    const holdingsForTicker = userHoldings.filter(
      (uh) => uh.ticker === h.ticker,
    );

    for (const div of result.dividends) {
      for (const holding of holdingsForTicker) {
        const amount = div.amount * holding.shares;
        await db
          .insert(dividends)
          .values({
            portfolioId: holding.portfolioId,
            holdingId: holding.holdingId,
            ticker: holding.ticker,
            amount,
            dividendPerShare: div.amount,
            shares: holding.shares,
            exDate: div.date,
            payDate: div.payDate || null,
            source: "api",
          })
          .onConflictDoNothing();
      }
    }
  }
}

export async function refreshAllUsers() {
  const allUsers = await db.select({ id: users.id }).from(users);
  for (const { id } of allUsers) {
    try {
      await refreshPricesAndSnapshot(id);
      await refreshDividends(id);
    } catch (e) {
      logger.error({ userId: id, err: e }, "Cron snapshot failed for user");
    }
  }
  logger.info({ userCount: allUsers.length }, "Cron snapshot completed");
}
