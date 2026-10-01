/* The in-memory rate limiter both API routes use. It lives per serverless
   instance, so it is a brake on casual abuse rather than a guarantee: the
   payload and row caps are what actually bound the cost. */

const buckets = new Map<string, Map<string, { n: number; reset: number }>>();

export function rateLimited(bucket: string, key: string, max: number, windowMs: number): boolean {
  const hits = buckets.get(bucket) ?? new Map<string, { n: number; reset: number }>();
  buckets.set(bucket, hits);
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  h.n += 1;
  return h.n > max;
}

export function clientIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}
