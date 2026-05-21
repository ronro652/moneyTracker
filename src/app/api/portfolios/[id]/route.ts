import { db } from "@/lib/db";
import { portfolios, holdings, portfolioSnapshots } from "@/lib/db/schema";
import { requireAuth } from "@/lib/require-auth";
import { updatePortfolioSchema } from "@/lib/validations";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const rows = await db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, Number(params.id)), eq(portfolios.userId, auth.user.id)));

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const parsed = updatePortfolioSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, Number(params.id)), eq(portfolios.userId, auth.user.id)));

  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, string> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.color !== undefined) updates.color = parsed.data.color;

  if (Object.keys(updates).length > 0) {
    await db.update(portfolios).set(updates).where(eq(portfolios.id, Number(params.id)));
  }

  const [updated] = await db.select().from(portfolios).where(eq(portfolios.id, Number(params.id)));
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const id = Number(params.id);

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(portfolios)
    .where(eq(portfolios.userId, auth.user.id));

  if (Number(countRows[0].count) <= 1) {
    return NextResponse.json({ error: "Cannot delete the last portfolio" }, { status: 400 });
  }

  const existing = await db
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(and(eq(portfolios.id, id), eq(portfolios.userId, auth.user.id)));

  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(holdings).where(eq(holdings.portfolioId, id));
  await db.delete(portfolioSnapshots).where(eq(portfolioSnapshots.portfolioId, id));
  await db.delete(portfolios).where(eq(portfolios.id, id));

  return NextResponse.json({ success: true });
}
