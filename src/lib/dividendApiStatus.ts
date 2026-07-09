/**
 * Best-effort, process-local cache recording whether Finnhub's
 * /stock/dividend endpoint is usable with the configured API key (it isn't
 * on Finnhub's free tier). This avoids re-probing the endpoint on every
 * dashboard load.
 *
 * This is intentionally in-memory rather than persisted in the database:
 * serverless instances may reset it at any time, in which case callers
 * simply re-probe. Since the restriction is a property of the API key (not
 * of any particular user or portfolio), a single process-wide cache is fine.
 */

interface CachedStatus {
  restricted: boolean;
  checkedAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cached: CachedStatus | null = null;

export function getCachedDividendApiStatus(): boolean | null {
  if (!cached) return null;
  if (Date.now() - cached.checkedAt > CACHE_TTL_MS) return null;
  return cached.restricted;
}

export function setCachedDividendApiStatus(restricted: boolean): void {
  cached = { restricted, checkedAt: Date.now() };
}

/** Test-only helper to reset module state between test cases. */
export function _resetDividendApiStatusForTests(): void {
  cached = null;
}
