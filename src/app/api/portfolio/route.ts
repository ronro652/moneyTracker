import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const portfolioId = req.nextUrl.searchParams.get("portfolio_id");
  const db = getDb();

  if (portfolioId) {
    const snapshots = db.prepare(
      "SELECT date, total_value, total_cost, portfolio_id FROM portfolio_snapshots WHERE portfolio_id = ? ORDER BY date ASC LIMIT 365"
    ).all(Number(portfolioId));
    return NextResponse.json(snapshots);
  }

  const snapshots = db.prepare(`
    SELECT date, SUM(total_value) as total_value, SUM(total_cost) as total_cost
    FROM portfolio_snapshots
    GROUP BY date
    ORDER BY date ASC
    LIMIT 365
  `).all();
  return NextResponse.json(snapshots);
}
