import Redis from "ioredis";
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/lib/rate-limit.ts");

// ─── Global declarations for HMR survival ──────────────
declare global {
  var _globalMemoryLimiter: RateLimiterMemory | undefined;
  var _authMemoryLimiter: RateLimiterMemory | undefined;
  var _socketMemoryLimiter: RateLimiterMemory | undefined;
  var _rateLimitRedisClient: Redis | undefined;
}

// ─── Memory fallbacks (preserved across HMR) ────────────
function getLimiterConfig(name: string) {
  const rl = config.security.rateLimit as Record<string, { points: number; duration: number }>;
  return rl[name] ?? { points: 60, duration: 60 };
}

function createMemoryLimiter(name: string) {
  const cfg = getLimiterConfig(name);
  return new RateLimiterMemory({ points: cfg.points, duration: cfg.duration });
}

const memoryLimiters: Record<string, RateLimiterMemory> = {
  global: globalThis._globalMemoryLimiter ?? createMemoryLimiter("global"),
  auth: globalThis._authMemoryLimiter ?? createMemoryLimiter("auth"),
  socket: globalThis._socketMemoryLimiter ?? createMemoryLimiter("socket"),
};

if (config.isDevelopment) {
  globalThis._globalMemoryLimiter = memoryLimiters.global as RateLimiterMemory;
  globalThis._authMemoryLimiter = memoryLimiters.auth as RateLimiterMemory;
  globalThis._socketMemoryLimiter = memoryLimiters.socket as RateLimiterMemory;
}

// ─── Redis client singleton (lazy, fast-fail) ───────────
function getRedisClient(): Redis | null {
  if (!config.cache.redisUrl) return null;

  if (globalThis._rateLimitRedisClient?.status === "ready") {
    return globalThis._rateLimitRedisClient;
  }

  try {
    const client = new Redis(config.cache.redisUrl, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy: () => null, // No automatic reconnection - let the next request try fresh
    });

    // Suppress connection errors - handled gracefully by the fallback
    client.on("error", () => { });

    if (config.isDevelopment) {
      globalThis._rateLimitRedisClient = client;
    }

    return client;
  } catch {
    return null;
  }
}

// ─── Fallback Rate Limiter ─────────────────────────────
//
// Tries Redis first. If Redis is unreachable or throws a connection
// error, falls back to the in-memory rate limiter for that request.
// On the next request, Redis is tried again (optimistic retry).
//
// This guarantees:
//   - Zero downtime when Redis is down
//   - Distributed rate limiting when Redis is up
//   - No single point of failure

class FallbackRateLimiter {
  private redis: RateLimiterRedis | null = null;
  private memory: RateLimiterMemory;
  private name: string;
  private hasLoggedWarning = false;

  constructor(name: string) {
    this.name = name;
    this.memory = memoryLimiters[name];
    this.redis = this.initRedis(name);
  }

  private initRedis(name: string): RateLimiterRedis | null {
    const client = getRedisClient();
    if (!client) return null;

    const cfg = getLimiterConfig(name);
    if (!cfg) return null;

    return new RateLimiterRedis({
      storeClient: client,
      points: cfg.points,
      duration: cfg.duration,
    });
  }

  async consume(key: string) {
    if (this.redis) {
      try {
        return await this.redis.consume(key);
      } catch (rejRes: unknown) {
        if (rejRes instanceof Error) {
          if (!this.hasLoggedWarning) {
            log.warn(
              `[RateLimiter] Redis "${this.name}" no disponible — usando fallback en memoria`,
            );
            this.hasLoggedWarning = true;
          }
        } else {
          throw rejRes; // Rate limited by Redis
        }
      }
    }

    return this.memory.consume(key);
  }
}

// ─── Export singletons (same interface as before) ───────
export const globalRateLimiter = new FallbackRateLimiter("global");
export const authRateLimiter = new FallbackRateLimiter("auth");
export const socketRateLimiter = new FallbackRateLimiter("socket");
