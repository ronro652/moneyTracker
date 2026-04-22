import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/require-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = requireAuth();
  if (auth instanceof NextResponse) return auth;

  const portfolioId = req.nextUrl.searchParams.get("portfolio_id");
  const db = getDb();

  let query = `
    SELECT h.*, sp.price as current_price, sp.change_percent
    FROM holdings h
    JOIN portfolios p ON p.id = h.portfolio_id
    LEFT JOIN stock_prices sp ON sp.ticker = h.ticker
    WHERE p.user_id = ?
  `;
  const params: (string | number)[] = [auth.user.id];

  if (portfolioId) {
    query += " AND h.portfolio_id = ?";
    params.push(Number(portfolioId));
  }

  query += " ORDER BY h.created_at DESC";

  const holdings = db.prepare(query).all(...params);
  return NextResponse.json(holdings);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { ticker, name, shares, avg_cost, portfolio_id, asset_type } = body;

  if (!ticker || !shares || !avg_cost) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const resolvedAssetType = asset_type === "crypto" ? "crypto" : "stock";

  const db = getDb();

  const portfolio = db.prepare("SELECT id FROM portfolios WHERE id = ? AND user_id = ?").get(
    portfolio_id, auth.user.id
  );
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const existing = db.prepare(
    "SELECT * FROM holdings WHERE ticker = ? AND portfolio_id = ? AND asset_type = ?"
  ).get(ticker, portfolio_id, resolvedAssetType) as Record<string, number> | undefined;

  if (existing) {
    const totalShares = existing.shares + shares;
    const totalCost = existing.shares * existing.avg_cost + shares * avg_cost;
    const newAvgCost = totalCost / totalShares;
    db.prepare("UPDATE holdings SET shares = ?, avg_cost = ? WHERE id = ?").run(totalShares, newAvgCost, existing.id);
  } else {
    db.prepare(
      "INSERT INTO holdings (ticker, name, shares, avg_cost, portfolio_id, asset_type) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(ticker.toUpperCase(), name || ticker.toUpperCase(), shares, avg_cost, portfolio_id, resolvedAssetType);
  }

  return NextResponse.json({ success: true });
}
