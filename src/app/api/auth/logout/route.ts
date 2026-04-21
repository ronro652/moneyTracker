import { getDb } from "@/lib/db";
import { clearSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = cookies();
  const token = cookieStore.get("session_token")?.value;

  if (token) {
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
  }

  clearSessionCookie();
  return NextResponse.json({ success: true });
}
