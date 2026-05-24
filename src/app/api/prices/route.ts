import { requireAuth } from "@/lib/require-auth";
import { refreshPricesAndSnapshot, refreshDividends, getApiQuota } from "@/lib/snapshots";
import { NextResponse } from "next/server";

export async function POST() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const results = await refreshPricesAndSnapshot(auth.user.id);
  await refreshDividends(auth.user.id);
  const quota = await getApiQuota();

  return NextResponse.json({ prices: results, quota });
}

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const quota = await getApiQuota();
  return NextResponse.json({ quota });
}
