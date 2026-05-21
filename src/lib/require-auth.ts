import { getSessionUser } from "./auth";
import { NextResponse } from "next/server";

export async function requireAuth(): Promise<{ user: { id: number; email: string; name: string } } | NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return { user };
}
