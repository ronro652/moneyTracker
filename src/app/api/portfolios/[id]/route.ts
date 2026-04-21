import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const db = getDb();
  const portfolio = db.prepare("SELECT * FROM portfolios WHERE id = ?").get(id);
  if (!portfolio) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(portfolio);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await req.json();
  const { name, description, color } = body;

  const db = getDb();
  const existing = db.prepare("SELECT * FROM portfolios WHERE id = ?").get(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.prepare(
    "UPDATE portfolios SET name = COALESCE(?, name), description = COALESCE(?, description), color = COALESCE(?, color) WHERE id = ?"
  ).run(name ?? null, description ?? null, color ?? null, id);

  const updated = db.prepare("SELECT * FROM portfolios WHERE id = ?").get(id);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const db = getDb();

  const count = (db.prepare("SELECT COUNT(*) as c FROM portfolios").get() as { c: number }).c;
  if (count <= 1) {
    return NextResponse.json({ error: "Cannot delete the last portfolio" }, { status: 400 });
  }

  db.prepare("DELETE FROM holdings WHERE portfolio_id = ?").run(id);
  db.prepare("DELETE FROM portfolio_snapshots WHERE portfolio_id = ?").run(id);
  db.prepare("DELETE FROM portfolios WHERE id = ?").run(id);

  return NextResponse.json({ success: true });
}
