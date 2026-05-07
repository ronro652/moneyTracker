import { requireAuth } from "@/lib/require-auth";
import { refreshPricesAndSnapshot, getApiQuota } from "@/lib/snapshots";
import { NextResponse } from "next/server";

export async function POST() {
  const auth = requireAuth();
  if (auth instanceof NextResponse) return auth;

  const results = await refreshPricesAndSnapshot(auth.user.id);
  const quota = getApiQuota();

  return NextResponse.json({ prices: results, quota });
}

export async function GET() {
  const auth = requireAuth();
  if (auth instanceof NextResponse) return auth;

  const quota = getApiQuota();
  return NextResponse.json({ quota });
}
