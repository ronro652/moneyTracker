import { getDb } from "@/lib/db";
import { fetchExchangeRate } from "@/lib/alpha-vantage";
import { requireAuth } from "@/lib/require-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = requireAuth();
  if (auth instanceof NextResponse) return auth;

  const from = req.nextUrl.searchParams.get("from") || "USD";
  const to = req.nextUrl.searchParams.get("to") || "ILS";
  const cacheKey = `${from}_${to}`;

  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pair TEXT NOT NULL UNIQUE,
      rate REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const cached = db.prepare(
    "SELECT rate FROM exchange_rates WHERE pair = ? AND updated_at > datetime('now', '-1 hour')"
  ).get(cacheKey) as { rate: number } | undefined;

  if (cached) {
    return NextResponse.json({ rate: cached.rate, from, to });
  }

  const rate = await fetchExchangeRate(from, to);
  if (rate === null) {
    const stale = db.prepare("SELECT rate FROM exchange_rates WHERE pair = ?").get(cacheKey) as { rate: number } | undefined;
    return NextResponse.json({ rate: stale?.rate ?? 3.6, from, to });
  }

  db.prepare(`
    INSERT INTO exchange_rates (pair, rate, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(pair) DO UPDATE SET rate = excluded.rate, updated_at = excluded.updated_at
  `).run(cacheKey, rate);

  return NextResponse.json({ rate, from, to });
}
