import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/require-auth";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = params;
  const db = getDb();

  const holding = db.prepare(`
    SELECT h.id FROM holdings h
    JOIN portfolios p ON p.id = h.portfolio_id
    WHERE h.id = ? AND p.user_id = ?
  `).get(id, auth.user.id);

  if (!holding) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM holdings WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
