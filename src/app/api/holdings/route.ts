import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const db = getDb();
  const holdings = db.prepare(`
    SELECT h.*, sp.price as current_price, sp.change_percent
    FROM holdings h
    LEFT JOIN stock_prices sp ON sp.ticker = h.ticker
    ORDER BY h.created_at DESC
  `).all();
  return NextResponse.json(holdings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticker, name, shares, avg_cost } = body;

  if (!ticker || !shares || !avg_cost) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();

  const existing = db.prepare("SELECT * FROM holdings WHERE ticker = ?").get(ticker) as Record<string, number> | undefined;
  if (existing) {
    const totalShares = existing.shares + shares;
    const totalCost = existing.shares * existing.avg_cost + shares * avg_cost;
    const newAvgCost = totalCost / totalShares;
    db.prepare("UPDATE holdings SET shares = ?, avg_cost = ? WHERE ticker = ?").run(totalShares, newAvgCost, ticker);
  } else {
    db.prepare("INSERT INTO holdings (ticker, name, shares, avg_cost) VALUES (?, ?, ?, ?)").run(
      ticker.toUpperCase(),
      name || ticker.toUpperCase(),
      shares,
      avg_cost
    );
  }

  return NextResponse.json({ success: true });
}
