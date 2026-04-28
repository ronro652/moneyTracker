import { requireAuth } from "@/lib/require-auth";
import { refreshPricesAndSnapshot } from "@/lib/snapshots";
import { NextResponse } from "next/server";

export async function POST() {
  const auth = requireAuth();
  if (auth instanceof NextResponse) return auth;

  const results = await refreshPricesAndSnapshot(auth.user.id);

  return NextResponse.json({ prices: results });
}
