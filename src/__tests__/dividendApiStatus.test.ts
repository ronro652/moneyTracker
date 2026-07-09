import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getCachedDividendApiStatus,
  setCachedDividendApiStatus,
  _resetDividendApiStatusForTests,
} from "@/lib/dividendApiStatus";

describe("dividendApiStatus cache", () => {
  beforeEach(() => {
    _resetDividendApiStatusForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when nothing has been cached yet", () => {
    expect(getCachedDividendApiStatus()).toBeNull();
  });

  it("returns the cached value right after it is set", () => {
    setCachedDividendApiStatus(true);
    expect(getCachedDividendApiStatus()).toBe(true);

    setCachedDividendApiStatus(false);
    expect(getCachedDividendApiStatus()).toBe(false);
  });

  it("expires the cached value after the TTL elapses", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    setCachedDividendApiStatus(true);
    expect(getCachedDividendApiStatus()).toBe(true);

    vi.spyOn(Date, "now").mockReturnValue(now + 61 * 60 * 1000);
    expect(getCachedDividendApiStatus()).toBeNull();
  });
});
