import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// ─── Cache helpers ────────────────────────────────────────────────────────────

export async function getCache<T>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  if (!val) return null;
  return JSON.parse(val) as T;
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds = 300
): Promise<void> {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
}

// ─── Rate limiter ─────────────────────────────────────────────────────────────

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const key = `rl:${identifier}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;

  const pipe = redis.pipeline();
  pipe.zremrangebyscore(key, 0, windowStart);
  pipe.zadd(key, now, `${now}-${Math.random()}`);
  pipe.zcard(key);
  pipe.expire(key, windowSeconds);
  const results = await pipe.exec();

  const count = (results?.[2]?.[1] as number) ?? 0;
  const remaining = Math.max(0, limit - count);
  const resetAt = Math.ceil((now + windowMs) / 1000);

  return { success: count <= limit, remaining, resetAt };
}

// ─── Review job queue ─────────────────────────────────────────────────────────

export const REVIEW_QUEUE_KEY = "queue:reviews";

export async function enqueueReview(reviewId: string): Promise<void> {
  await redis.lpush(REVIEW_QUEUE_KEY, reviewId);
}

export async function dequeueReview(): Promise<string | null> {
  const result = await redis.brpop(REVIEW_QUEUE_KEY, 5);
  return result ? result[1] : null;
}
