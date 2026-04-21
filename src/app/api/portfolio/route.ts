import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/require-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = requireAuth();
  if (auth instanceof NextResponse) return auth;

  const portfolioId = req.nextUrl.searchParams.get("portfolio_id");
  const db = getDb();

  if (portfolioId) {
    const portfolio = db.prepare("SELECT id FROM portfolios WHERE id = ? AND user_id = ?").get(
      Number(portfolioId), auth.user.id
    );
    if (!portfolio) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const snapshots = db.prepare(
      "SELECT date, total_value, total_cost, portfolio_id FROM portfolio_snapshots WHERE portfolio_id = ? ORDER BY date ASC LIMIT 365"
    ).all(Number(portfolioId));
    return NextResponse.json(snapshots);
  }

  const snapshots = db.prepare(`
    SELECT ps.date, SUM(ps.total_value) as total_value, SUM(ps.total_cost) as total_cost
    FROM portfolio_snapshots ps
    JOIN portfolios p ON p.id = ps.portfolio_id
    WHERE p.user_id = ?
    GROUP BY ps.date
    ORDER BY ps.date ASC
    LIMIT 365
  `).all(auth.user.id);
  return NextResponse.json(snapshots);
}
