import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/require-auth";
import { NextRequest, NextResponse } from "next/server";
import { PORTFOLIO_COLORS } from "@/types";

export async function GET() {
  const auth = requireAuth();
  if (auth instanceof NextResponse) return auth;

  const db = getDb();
  const portfolios = db.prepare("SELECT * FROM portfolios WHERE user_id = ? ORDER BY created_at ASC").all(auth.user.id);
  return NextResponse.json(portfolios);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { name, description } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) as c FROM portfolios WHERE user_id = ?").get(auth.user.id) as { c: number }).c;
  const color = PORTFOLIO_COLORS[count % PORTFOLIO_COLORS.length];

  const result = db.prepare(
    "INSERT INTO portfolios (name, description, color, user_id) VALUES (?, ?, ?, ?)"
  ).run(name.trim(), (description || "").trim(), color, auth.user.id);

  const portfolio = db.prepare("SELECT * FROM portfolios WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(portfolio, { status: 201 });
}
