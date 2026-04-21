import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const db = getDb();
  const snapshots = db.prepare(
    "SELECT date, total_value, total_cost FROM portfolio_snapshots ORDER BY date ASC LIMIT 365"
  ).all();
  return NextResponse.json(snapshots);
}
