import { requireAuth } from "@/lib/require-auth";
import { fetchIntradayCandles } from "@/lib/finnhub";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const ticker = req.nextUrl.searchParams.get("ticker");
  const assetType = (req.nextUrl.searchParams.get("asset_type") || "stock") as "stock" | "crypto";

  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const { candles, meta } = await fetchIntradayCandles(ticker, assetType);

  return NextResponse.json({ candles, meta });
}
