import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { clearSessionCookie } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = cookies();
  const token = cookieStore.get("session_token")?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }

  clearSessionCookie();
  return NextResponse.json({ success: true });
}
