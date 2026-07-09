import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchDividends } from "@/lib/finnhub";

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: async () => body,
    }),
  );
}

describe("fetchDividends", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses a genuine array response and marks it as not restricted", async () => {
    mockFetchOnce([
      { symbol: "AAPL", date: "2025-05-15", amount: 0.24, payDate: "2025-05-30", currency: "USD" },
    ]);

    const result = await fetchDividends("AAPL", "2025-01-01", "2025-06-01");

    expect(result.restricted).toBe(false);
    expect(result.dividends).toHaveLength(1);
    expect(result.dividends[0]).toMatchObject({ symbol: "AAPL", amount: 0.24 });
  });

  it("treats an empty array as genuinely no dividends, not a restriction", async () => {
    mockFetchOnce([]);

    const result = await fetchDividends("AAPL", "2025-01-01", "2025-06-01");

    expect(result.restricted).toBe(false);
    expect(result.dividends).toHaveLength(0);
  });

  it("detects a plan-restriction error payload instead of silently returning empty", async () => {
    mockFetchOnce({ error: "You don't have access to this resource." }, false, 403);

    const result = await fetchDividends("AAPL", "2025-01-01", "2025-06-01");

    expect(result.restricted).toBe(true);
    expect(result.dividends).toHaveLength(0);
  });

  it("treats a non-ok status without an array body as restricted", async () => {
    mockFetchOnce({}, false, 500);

    const result = await fetchDividends("AAPL", "2025-01-01", "2025-06-01");

    expect(result.restricted).toBe(true);
  });

  it("does not mark a network failure as a plan restriction", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const result = await fetchDividends("AAPL", "2025-01-01", "2025-06-01");

    expect(result.restricted).toBe(false);
    expect(result.dividends).toHaveLength(0);
  });
});
