import { searchTicker, searchCrypto } from "@/lib/alpha-vantage";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json([]);
  }

  const type = req.nextUrl.searchParams.get("type");
  if (type === "crypto") {
    return NextResponse.json(searchCrypto(query));
  }

  const results = await searchTicker(query);
  return NextResponse.json(results);
}
