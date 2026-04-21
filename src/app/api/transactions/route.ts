import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/require-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = requireAuth();
  if (auth instanceof NextResponse) return auth;

  const portfolioId = req.nextUrl.searchParams.get("portfolio_id");
  const db = getDb();

  let query = `
    SELECT t.* FROM transactions t
    JOIN portfolios p ON p.id = t.portfolio_id
    WHERE p.user_id = ?
  `;
  const params: (string | number)[] = [auth.user.id];

  if (portfolioId) {
    query += " AND t.portfolio_id = ?";
    params.push(Number(portfolioId));
  }

  query += " ORDER BY t.created_at DESC";

  const transactions = db.prepare(query).all(...params);
  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { ticker, name, shares, price_per_share, portfolio_id, asset_type, type } = body;

  if (!ticker || !shares || !price_per_share || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (type !== "buy" && type !== "sell") {
    return NextResponse.json({ error: "Type must be buy or sell" }, { status: 400 });
  }

  const resolvedAssetType = asset_type === "crypto" ? "crypto" : "stock";
  const db = getDb();

  const portfolio = db.prepare("SELECT id FROM portfolios WHERE id = ? AND user_id = ?").get(
    portfolio_id, auth.user.id
  ) as { id: number } | undefined;
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const totalAmount = shares * price_per_share;

  if (type === "sell") {
    const holding = db.prepare(
      "SELECT * FROM holdings WHERE ticker = ? AND portfolio_id = ? AND asset_type = ?"
    ).get(ticker, portfolio_id, resolvedAssetType) as { id: number; shares: number; avg_cost: number } | undefined;

    if (!holding || holding.shares < shares) {
      return NextResponse.json(
        { error: `Not enough shares to sell. You have ${holding?.shares ?? 0}` },
        { status: 400 }
      );
    }

    const realizedGain = (price_per_share - holding.avg_cost) * shares;
    const remainingShares = holding.shares - shares;

    if (remainingShares < 0.0001) {
      db.prepare("DELETE FROM holdings WHERE id = ?").run(holding.id);
    } else {
      db.prepare("UPDATE holdings SET shares = ? WHERE id = ?").run(remainingShares, holding.id);
    }

    db.prepare(`
      INSERT INTO transactions (portfolio_id, ticker, name, asset_type, type, shares, price_per_share, total_amount, realized_gain)
      VALUES (?, ?, ?, ?, 'sell', ?, ?, ?, ?)
    `).run(portfolio_id, ticker.toUpperCase(), name || ticker.toUpperCase(), resolvedAssetType, shares, price_per_share, totalAmount, realizedGain);

    return NextResponse.json({ success: true, realized_gain: realizedGain });
  }

  // Buy
  const existing = db.prepare(
    "SELECT * FROM holdings WHERE ticker = ? AND portfolio_id = ? AND asset_type = ?"
  ).get(ticker, portfolio_id, resolvedAssetType) as { id: number; shares: number; avg_cost: number } | undefined;

  if (existing) {
    const totalShares = existing.shares + shares;
    const totalCost = existing.shares * existing.avg_cost + shares * price_per_share;
    const newAvgCost = totalCost / totalShares;
    db.prepare("UPDATE holdings SET shares = ?, avg_cost = ? WHERE id = ?").run(totalShares, newAvgCost, existing.id);
  } else {
    db.prepare(
      "INSERT INTO holdings (ticker, name, shares, avg_cost, portfolio_id, asset_type) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(ticker.toUpperCase(), name || ticker.toUpperCase(), shares, price_per_share, portfolio_id, resolvedAssetType);
  }

  db.prepare(`
    INSERT INTO transactions (portfolio_id, ticker, name, asset_type, type, shares, price_per_share, total_amount, realized_gain)
    VALUES (?, ?, ?, ?, 'buy', ?, ?, ?, NULL)
  `).run(portfolio_id, ticker.toUpperCase(), name || ticker.toUpperCase(), resolvedAssetType, shares, price_per_share, totalAmount);

  return NextResponse.json({ success: true });
}
