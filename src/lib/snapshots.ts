import { getDb } from "./db";
import { fetchStockQuote, fetchCryptoQuote } from "./alpha-vantage";

const BUCKET_HOURS = 3;
const API_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function refreshPricesAndSnapshot(userId: number) {
  const db = getDb();
  const holdings = db
    .prepare(
      `SELECT DISTINCT h.ticker, h.asset_type FROM holdings h
       JOIN portfolios p ON p.id = h.portfolio_id
       WHERE p.user_id = ?`
    )
    .all(userId) as { ticker: string; asset_type: string }[];

  const results: Record<string, { price: number; changePercent: number }> = {};

  for (const { ticker, asset_type } of holdings) {
    if (results[ticker]) continue;

    const cached = db
      .prepare("SELECT * FROM stock_prices WHERE ticker = ?")
      .get(ticker) as
      | { price: number; change_percent: number; updated_at: string }
      | undefined;

    const isFresh =
      cached &&
      cached.updated_at >
        new Date(Date.now() - 15 * 60 * 1000)
          .toISOString()
          .replace("T", " ")
          .slice(0, 19);

    if (cached && isFresh) {
      results[ticker] = {
        price: cached.price,
        changePercent: cached.change_percent,
      };
      continue;
    }

    if (Object.keys(results).length > 0) await sleep(API_DELAY_MS);

    const quote =
      asset_type === "crypto"
        ? await fetchCryptoQuote(ticker)
        : await fetchStockQuote(ticker);

    if (quote) {
      db.prepare(
        `INSERT INTO stock_prices (ticker, price, change_percent, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(ticker) DO UPDATE SET
           price = excluded.price,
           change_percent = excluded.change_percent,
           updated_at = excluded.updated_at`
      ).run(ticker, quote.price, quote.changePercent);

      results[ticker] = {
        price: quote.price,
        changePercent: quote.changePercent,
      };
    } else if (cached) {
      results[ticker] = {
        price: cached.price,
        changePercent: cached.change_percent,
      };
    }
  }

  const portfolios = db
    .prepare("SELECT id FROM portfolios WHERE user_id = ?")
    .all(userId) as { id: number }[];
  const now = new Date();
  const bucket = Math.floor(now.getUTCHours() / BUCKET_HOURS) * BUCKET_HOURS;
  const snapshotKey = `${now.toISOString().split("T")[0]} ${String(bucket).padStart(2, "0")}:00`;

  for (const { id: pid } of portfolios) {
    const portfolioHoldings = db
      .prepare(
        "SELECT ticker, shares, avg_cost FROM holdings WHERE portfolio_id = ?"
      )
      .all(pid) as { ticker: string; shares: number; avg_cost: number }[];

    const totalValue = portfolioHoldings.reduce((sum, h) => {
      const price = results[h.ticker]?.price || 0;
      return sum + h.shares * price;
    }, 0);

    const totalCost = portfolioHoldings.reduce(
      (sum, h) => sum + h.shares * h.avg_cost,
      0
    );

    if (portfolioHoldings.length > 0) {
      db.prepare(
        `INSERT INTO portfolio_snapshots (date, total_value, total_cost, portfolio_id)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(date, portfolio_id) DO UPDATE SET
           total_value = excluded.total_value,
           total_cost = excluded.total_cost`
      ).run(snapshotKey, totalValue, totalCost, pid);
    }
  }

  return results;
}

const DAILY_LIMIT = 25;

export function getApiQuota() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  const row = db
    .prepare(
      "SELECT COUNT(*) as count FROM stock_prices WHERE updated_at >= ?"
    )
    .get(today + " 00:00:00") as { count: number };
  return { used: row.count, limit: DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - row.count) };
}

export async function refreshAllUsers() {
  const db = getDb();
  const users = db.prepare("SELECT id FROM users").all() as { id: number }[];
  for (const { id } of users) {
    try {
      await refreshPricesAndSnapshot(id);
    } catch (e) {
      console.error(`[snapshot-cron] Failed for user ${id}:`, e);
    }
  }
  console.log(
    `[snapshot-cron] Completed for ${users.length} user(s) at ${new Date().toISOString()}`
  );
}
