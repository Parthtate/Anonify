import RateLimitModel from '@/model/RateLimit';

type Result = { ok: boolean; retryAfterSeconds: number };

/**
 * Fixed-window counter shared through MongoDB. In-memory counters cannot work on
 * Vercel: every serverless instance has its own memory, so limits would not hold.
 *
 * The window is baked into the document id, which makes each hit a single atomic
 * upsert with no read-modify-write race.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<Result> {
  const bucket = Math.floor(Date.now() / windowMs);
  const windowEnd = (bucket + 1) * windowMs;
  const retryAfterSeconds = Math.max(1, Math.ceil((windowEnd - Date.now()) / 1000));

  try {
    const doc = await RateLimitModel.findByIdAndUpdate(
      `${key}:${bucket}`,
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowEnd) } },
      { upsert: true, new: true }
    );
    return { ok: (doc?.count ?? 1) <= limit, retryAfterSeconds };
  } catch (error) {
    // A limiter outage must not take the app down with it.
    console.error('Rate limit check failed, allowing the request:', error);
    return { ok: true, retryAfterSeconds };
  }
}

/** Vercel overwrites x-forwarded-for at the edge; locally there is no proxy. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'local';
}

export function tooManyRequests(message: string, retryAfterSeconds: number) {
  return Response.json(
    { success: false, message },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}
