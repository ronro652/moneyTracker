import { db } from "@/lib/db";
import { holdings, portfolios } from "@/lib/db/schema";
import { requireAuth } from "@/lib/require-auth";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = params;

  const rows = await db
    .select({ id: holdings.id })
    .from(holdings)
    .innerJoin(portfolios, eq(portfolios.id, holdings.portfolioId))
    .where(and(eq(holdings.id, Number(id)), eq(portfolios.userId, auth.user.id)));

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(holdings).where(eq(holdings.id, Number(id)));
  return NextResponse.json({ success: true });
}
