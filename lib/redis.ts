import Redis from "ioredis";

// ─── In-memory fallback store ─────────────────────────────────────────────────
const memStore = new Map<string, { value: string; exp: number }>();

function memGet(key: string): string | null {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.exp) {
    memStore.delete(key);
    return null;
  }
  return entry.value;
}
function memSet(key: string, value: string, ttlSeconds = 300) {
  memStore.set(key, { value, exp: Date.now() + ttlSeconds * 1000 });
}
function memDel(key: string) {
  memStore.delete(key);
}

// ─── Redis client (lazy, with error suppression) ──────────────────────────────
let _redis: Redis | null = null;
let _redisAvailable = true;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 3000,
    });

    _redis.on("error", () => {
      _redisAvailable = false;
    });

    _redis.on("connect", () => {
      _redisAvailable = true;
    });
  }
  return _redis;
}

// ─── Safe Redis wrapper — falls back to in-memory ────────────────────────────
export const redis = {
  async get(key: string): Promise<string | null> {
    if (!_redisAvailable) return memGet(key);
    try {
      const result = await getRedis().get(key);
      return result;
    } catch {
      _redisAvailable = false;
      return memGet(key);
    }
  },

  async set(
    key: string,
    value: string,
    exFlag?: "EX",
    ttl?: number,
  ): Promise<void> {
    memSet(key, value, ttl ?? 300);
    if (!_redisAvailable) return;
    try {
      if (exFlag === "EX" && ttl) {
        await getRedis().set(key, value, "EX", ttl);
      } else {
        await getRedis().set(key, value);
      }
    } catch {
      _redisAvailable = false;
    }
  },

  async del(key: string): Promise<void> {
    memDel(key);
    if (!_redisAvailable) return;
    try {
      await getRedis().del(key);
    } catch {
      _redisAvailable = false;
    }
  },

  async keys(pattern: string): Promise<string[]> {
    if (!_redisAvailable) return [];
    try {
      return await getRedis().keys(pattern);
    } catch {
      return [];
    }
  },

  async lpush(key: string, value: string): Promise<void> {
    if (!_redisAvailable) return;
    try {
      await getRedis().lpush(key, value);
    } catch {
      _redisAvailable = false;
    }
  },

  async brpop(key: string, timeout: number): Promise<[string, string] | null> {
    if (!_redisAvailable) return null;
    try {
      return await getRedis().brpop(key, timeout);
    } catch {
      return null;
    }
  },

  pipeline() {
    return getRedis().pipeline();
  },
};

// ─── Cache helpers ────────────────────────────────────────────────────────────
export async function getCache<T>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  if (!val) return null;
  try {
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds = 300,
): Promise<void> {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}

// ─── Rate limiter (in-memory fallback) ───────────────────────────────────────
const rateLimitStore = new Map<string, number[]>();

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const key = `rl:${identifier}`;

  const hits = (rateLimitStore.get(key) ?? []).filter(
    (t) => now - t < windowMs,
  );
  hits.push(now);
  rateLimitStore.set(key, hits);

  const remaining = Math.max(0, limit - hits.length);
  return {
    success: hits.length <= limit,
    remaining,
    resetAt: Math.ceil((now + windowMs) / 1000),
  };
}

// ─── Review queue ─────────────────────────────────────────────────────────────
export const REVIEW_QUEUE_KEY = "queue:reviews";

export async function enqueueReview(reviewId: string): Promise<void> {
  await redis.lpush(REVIEW_QUEUE_KEY, reviewId);
}

export async function dequeueReview(): Promise<string | null> {
  const result = await redis.brpop(REVIEW_QUEUE_KEY, 5);
  return result ? result[1] : null;
}
