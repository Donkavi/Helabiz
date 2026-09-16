/**
 * In-memory fixed-window rate limiter.
 *
 * This is deliberately a single-process implementation: it protects a single
 * Node instance and documents the seam. Swapping in Redis or Upstash means
 * replacing the body of `rateLimit` — every caller already awaits it.
 */
type Bucket = { count: number; resetAt: number };

declare global {
  var __helabizRateLimit: Map<string, Bucket> | undefined;
}

const buckets = global.__helabizRateLimit ?? new Map<string, Bucket>();
global.__helabizRateLimit = buckets;

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: number };

export async function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    if (buckets.size > 5000) pruneExpired(now);
    return { ok: true, remaining: limit - 1, resetAt };
  }

  bucket.count += 1;
  return { ok: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

function pruneExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
