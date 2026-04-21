import { getDb } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { PORTFOLIO_COLORS } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, name, password } = body;

  if (!email?.trim() || !name?.trim() || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.trim().toLowerCase());
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  const result = db.prepare(
    "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)"
  ).run(email.trim().toLowerCase(), name.trim(), passwordHash);

  const userId = result.lastInsertRowid as number;

  db.prepare(
    "INSERT INTO portfolios (name, description, color, user_id) VALUES (?, ?, ?, ?)"
  ).run("My Portfolio", "Default portfolio", PORTFOLIO_COLORS[0], userId);

  const token = createSession(userId);
  setSessionCookie(token);

  return NextResponse.json({ id: userId, email: email.trim().toLowerCase(), name: name.trim() }, { status: 201 });
}
