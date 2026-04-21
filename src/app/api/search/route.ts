import { searchTicker } from "@/lib/alpha-vantage";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json([]);
  }
  const results = await searchTicker(query);
  return NextResponse.json(results);
}
