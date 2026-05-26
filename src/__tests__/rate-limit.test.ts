import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-allow-${Date.now()}`;
    const result = rateLimit(key, 3);
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks after exceeding the limit", () => {
    const key = `test-block-${Date.now()}`;
    rateLimit(key, 2);
    rateLimit(key, 2);
    const third = rateLimit(key, 2);
    expect(third.ok).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("tracks different keys independently", () => {
    const keyA = `test-a-${Date.now()}`;
    const keyB = `test-b-${Date.now()}`;
    rateLimit(keyA, 1);
    rateLimit(keyA, 1);
    const resultA = rateLimit(keyA, 1);
    const resultB = rateLimit(keyB, 1);
    expect(resultA.ok).toBe(false);
    expect(resultB.ok).toBe(true);
  });

  it("returns correct remaining count", () => {
    const key = `test-remaining-${Date.now()}`;
    expect(rateLimit(key, 5).remaining).toBe(4);
    expect(rateLimit(key, 5).remaining).toBe(3);
    expect(rateLimit(key, 5).remaining).toBe(2);
    expect(rateLimit(key, 5).remaining).toBe(1);
    expect(rateLimit(key, 5).remaining).toBe(0);
    expect(rateLimit(key, 5).ok).toBe(false);
  });
});
