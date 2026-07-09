/**
 * Helpers for working with share/coin quantities.
 *
 * Shares are stored as `doublePrecision` and repeatedly summed with plain
 * `+`, which accumulates floating point drift (e.g. 40.099999999999994
 * instead of 40.1). Unlike dollar values (which are always rendered through
 * `Intl.NumberFormat` and therefore auto-round to 2 decimals), share
 * quantities were rendered raw, so the drift was visible to users.
 *
 * We can't just round to 2 decimals like currency, since crypto holdings can
 * have many meaningful decimal places (e.g. 0.00003421 BTC), so we round to
 * a higher max precision instead and trim any trailing zeros.
 */

export const SHARES_PRECISION = 8;

/** Round a share quantity to a sane max precision to remove FP drift. */
export function roundShares(value: number, precision: number = SHARES_PRECISION): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

/** Format a share quantity for display: rounded, with trailing zeros trimmed. */
export function formatShares(value: number, precision: number = SHARES_PRECISION): string {
  const rounded = roundShares(value, precision);
  return rounded.toFixed(precision).replace(/\.?0+$/, "");
}
