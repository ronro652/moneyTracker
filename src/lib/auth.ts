import crypto from "crypto";
import { getDb } from "./db";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session_token";
const SESSION_MAX_AGE_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const attempt = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(attempt, "hex"));
}

export function createSession(userId: number): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expiresAt);
  return token;
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function getSessionUser(): { id: number; email: string; name: string } | null {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const row = db.prepare(`
    SELECT u.id, u.email, u.name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).get(token) as { id: number; email: string; name: string } | undefined;

  if (!row) return null;

  const newExpiry = new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("UPDATE sessions SET expires_at = ? WHERE id = ?").run(newExpiry, token);
  setSessionCookie(token);

  return row;
}

export function deleteExpiredSessions() {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
}
