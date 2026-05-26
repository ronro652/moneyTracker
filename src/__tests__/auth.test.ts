import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("next/headers", () => ({
  cookies: () => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }),
}));

import { hashPassword, verifyPassword } from "@/lib/auth";

describe("password hashing", () => {
  it("hashes and verifies a correct password", () => {
    const hash = hashPassword("mySecret123");
    expect(hash).toContain(":");
    expect(verifyPassword("mySecret123", hash)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const hash = hashPassword("mySecret123");
    expect(verifyPassword("wrongPassword", hash)).toBe(false);
  });

  it("produces different hashes for the same password (random salt)", () => {
    const hash1 = hashPassword("samePass");
    const hash2 = hashPassword("samePass");
    expect(hash1).not.toBe(hash2);
  });

  it("handles unicode passwords", () => {
    const hash = hashPassword("פאסוורד🔑");
    expect(verifyPassword("פאסוורד🔑", hash)).toBe(true);
    expect(verifyPassword("פאסוורד", hash)).toBe(false);
  });
});
