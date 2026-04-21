import { getSessionUser } from "./auth";
import { NextResponse } from "next/server";

export function requireAuth(): { user: { id: number; email: string; name: string } } | NextResponse {
  const user = getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return { user };
}
