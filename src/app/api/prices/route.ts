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

  const portfolios = db.prepare("SELECT id FROM portfolios").all() as { id: number }[];
  const today = new Date().toISOString().split("T")[0];

  for (const { id: pid } of portfolios) {
    const portfolioHoldings = db.prepare("SELECT ticker, shares, avg_cost FROM holdings WHERE portfolio_id = ?").all(pid) as {
      ticker: string;
      shares: number;
      avg_cost: number;
    }[];

    const totalValue = portfolioHoldings.reduce((sum, h) => {
      const price = results[h.ticker]?.price || 0;
      return sum + h.shares * price;
    }, 0);

    const totalCost = portfolioHoldings.reduce((sum, h) => sum + h.shares * h.avg_cost, 0);

    if (portfolioHoldings.length > 0) {
      db.prepare(`
        INSERT INTO portfolio_snapshots (date, total_value, total_cost, portfolio_id)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(date, portfolio_id) DO UPDATE SET total_value = excluded.total_value, total_cost = excluded.total_cost
      `).run(today, totalValue, totalCost, pid);
    }
  }

  return NextResponse.json({ prices: results });
}
