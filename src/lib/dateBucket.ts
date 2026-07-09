/**
 * Shared time-bucketing logic for portfolio snapshots.
 *
 * Snapshots are only taken every `BUCKET_HOURS` hours (see `snapshots.ts`), and
 * the chart (see `PortfolioChart.tsx`) needs to bucket transaction timestamps
 * the exact same way so that buy/sell markers line up with the snapshot dates
 * they were plotted against. Keeping this logic in one place (rather than
 * duplicating the constant/math in both files) prevents the two from drifting
 * out of sync again.
 *
 * This module must stay free of server-only imports (e.g. the database
 * client) since it is also imported from client components.
 */
export const BUCKET_HOURS = 3;

/**
 * Buckets a date into the `YYYY-MM-DD HH:00` key used as the snapshot's
 * `date` column, using UTC hours floored to the nearest `BUCKET_HOURS`.
 */
export function getBucketKey(date: Date): string {
  const bucket = Math.floor(date.getUTCHours() / BUCKET_HOURS) * BUCKET_HOURS;
  const day = date.toISOString().split("T")[0];
  return `${day} ${String(bucket).padStart(2, "0")}:00`;
}
