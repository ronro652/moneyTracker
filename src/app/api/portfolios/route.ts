import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { PORTFOLIO_COLORS } from "@/types";

export async function GET() {
  const db = getDb();
  const portfolios = db.prepare("SELECT * FROM portfolios ORDER BY created_at ASC").all();
  return NextResponse.json(portfolios);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) as c FROM portfolios").get() as { c: number }).c;
  const color = PORTFOLIO_COLORS[count % PORTFOLIO_COLORS.length];

  const result = db.prepare(
    "INSERT INTO portfolios (name, description, color) VALUES (?, ?, ?)"
  ).run(name.trim(), (description || "").trim(), color);

  const portfolio = db.prepare("SELECT * FROM portfolios WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(portfolio, { status: 201 });
}
