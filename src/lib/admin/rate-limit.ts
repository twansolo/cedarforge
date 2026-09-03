/**
 * Login throttle.
 *
 * This is in-process memory, so it only slows an attacker down per serverless
 * instance, exactly like the throttle in the contact route. It is a speed bump
 * layered on top of the real defence, which is the memory-hard scrypt hash. For
 * a hard guarantee, move this to a durable store (Vercel KV, Upstash Redis) or
 * put the platform WAF in front of /admin/login.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60_000;
const MAX_TRACKED_KEYS = 5_000;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type AttemptResult = {
  allowed: boolean;
  /** Seconds until the caller may try again. Zero when allowed. */
  retryAfterSeconds: number;
  /** Attempts left in the window after this one. */
  remaining: number;
};

/** Records an attempt and reports whether it may proceed. */
export function registerLoginAttempt(key: string): AttemptResult {
  const now = Date.now();
  prune(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: MAX_ATTEMPTS - 1,
    };
  }

  bucket.count += 1;

  if (bucket.count > MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: MAX_ATTEMPTS - bucket.count,
  };
}

/** Clears the window after a successful sign-in. */
export function clearLoginAttempts(key: string) {
  buckets.delete(key);
}
