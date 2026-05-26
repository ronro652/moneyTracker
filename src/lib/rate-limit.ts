const windowMs = 60_000;

const hits = new Map<string, number[]>();

setInterval(() => {
  const cutoff = Date.now() - windowMs;
  for (const [key, timestamps] of hits) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) hits.delete(key);
    else hits.set(key, filtered);
  }
}, 60_000);

export function rateLimit(key: string, limit: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const timestamps = (hits.get(key) ?? []).filter((t) => t > cutoff);
  timestamps.push(now);
  hits.set(key, timestamps);
  const count = timestamps.length;
  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}
