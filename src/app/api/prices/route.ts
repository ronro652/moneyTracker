import { getDb } from "@/lib/db";
import { fetchStockQuote } from "@/lib/alpha-vantage";
import { NextResponse } from "next/server";

export async function POST() {
  const db = getDb();
  const holdings = db.prepare("SELECT DISTINCT ticker FROM holdings").all() as { ticker: string }[];

  const results: Record<string, { price: number; changePercent: number }> = {};

  for (const { ticker } of holdings) {
    const cached = db.prepare(
      "SELECT * FROM stock_prices WHERE ticker = ? AND updated_at > datetime('now', '-15 minutes')"
    ).get(ticker) as { price: number; change_percent: number } | undefined;

    if (cached) {
      results[ticker] = { price: cached.price, changePercent: cached.change_percent };
      continue;
    }

    const quote = await fetchStockQuote(ticker);
    if (quote) {
      db.prepare(`
        INSERT INTO stock_prices (ticker, price, change_percent, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(ticker) DO UPDATE SET
          price = excluded.price,
          change_percent = excluded.change_percent,
          updated_at = excluded.updated_at
      `).run(ticker, quote.price, quote.changePercent);

      results[ticker] = { price: quote.price, changePercent: quote.changePercent };
    }
  }

  const totalValue = holdings.reduce((sum, { ticker }) => {
    const holding = db.prepare("SELECT shares FROM holdings WHERE ticker = ?").get(ticker) as { shares: number } | undefined;
    const price = results[ticker]?.price || 0;
    return sum + (holding?.shares || 0) * price;
  }, 0);

  const totalCost = (db.prepare("SELECT SUM(shares * avg_cost) as total FROM holdings").get() as { total: number })?.total || 0;

  const today = new Date().toISOString().split("T")[0];
  db.prepare(`
    INSERT INTO portfolio_snapshots (date, total_value, total_cost)
    VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET total_value = excluded.total_value, total_cost = excluded.total_cost
  `).run(today, totalValue, totalCost);

  return NextResponse.json({ prices: results });
}
