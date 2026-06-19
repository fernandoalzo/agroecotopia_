import Redis from "ioredis";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/lib/anomaly-detector/redis.ts");

declare global {
  var _anomalyRedisClient: Redis | undefined;
}

let client: Redis | null = null;
let isAvailable = false;

/**
 * Returns a shared Redis client for the anomaly detector.
 * Returns null if Redis is not configured or unreachable.
 *
 * The client uses fast-fail settings so the anomaly detector
 * can degrade gracefully without blocking the login flow.
 */
export function getRedisClient(): Redis | null {
  if (client && isAvailable) return client;
  if (!config.cache.redisUrl) return null;

  try {
    if (globalThis._anomalyRedisClient?.status === "ready") {
      client = globalThis._anomalyRedisClient;
      isAvailable = true;
      return client;
    }

    const redis = new Redis(config.cache.redisUrl, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy: () => null,
    });

    redis.on("ready", () => {
      isAvailable = true;
      log.info("[anomaly] Redis connected");
    });

    redis.on("error", () => {
      isAvailable = false;
    });

    redis.on("close", () => {
      isAvailable = false;
    });

    if (config.isDevelopment) {
      globalThis._anomalyRedisClient = redis;
    }

    client = redis;
    return client;
  } catch {
    return null;
  }
}

/**
 * Returns whether the anomaly detector has a working Redis connection.
 */
export function isRedisAvailable(): boolean {
  return isAvailable && client !== null;
}
