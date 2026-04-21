import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const portfolioId = req.nextUrl.searchParams.get("portfolio_id");
  const db = getDb();

  let query = `
    SELECT h.*, sp.price as current_price, sp.change_percent
    FROM holdings h
    LEFT JOIN stock_prices sp ON sp.ticker = h.ticker
  `;
  const params: (string | number)[] = [];

  if (portfolioId) {
    query += " WHERE h.portfolio_id = ?";
    params.push(Number(portfolioId));
  }

  query += " ORDER BY h.created_at DESC";

  const holdings = db.prepare(query).all(...params);
  return NextResponse.json(holdings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticker, name, shares, avg_cost, portfolio_id } = body;

  if (!ticker || !shares || !avg_cost) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const pid = portfolio_id || 1;
  const db = getDb();

  const existing = db.prepare(
    "SELECT * FROM holdings WHERE ticker = ? AND portfolio_id = ?"
  ).get(ticker, pid) as Record<string, number> | undefined;

  if (existing) {
    const totalShares = existing.shares + shares;
    const totalCost = existing.shares * existing.avg_cost + shares * avg_cost;
    const newAvgCost = totalCost / totalShares;
    db.prepare("UPDATE holdings SET shares = ?, avg_cost = ? WHERE id = ?").run(totalShares, newAvgCost, existing.id);
  } else {
    db.prepare(
      "INSERT INTO holdings (ticker, name, shares, avg_cost, portfolio_id) VALUES (?, ?, ?, ?, ?)"
    ).run(ticker.toUpperCase(), name || ticker.toUpperCase(), shares, avg_cost, pid);
  }

  return NextResponse.json({ success: true });
}
