import { redisClient, isRedisAvailable } from "./client";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/backend/cache/cache.service.ts");

export class CacheService {
  private get client() {
    return redisClient;
  }

  private get available() {
    return isRedisAvailable && this.client !== null;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.available) return null;
    try {
      const value = await this.client!.get(key);
      if (value === null) return null;
      log.debug(`Cache HIT: ${key}`);
      return JSON.parse(value) as T;
    } catch (error) {
      log.warn(`Cache GET error for key "${key}":`, (error as Error).message);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.available) return;
    try {
      const ttlValue = ttl ?? config.cache.defaultTTL;
      await this.client!.set(key, JSON.stringify(value), "EX", ttlValue);
    } catch (error) {
      log.warn(`Cache SET error for key "${key}":`, (error as Error).message);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.available) return;
    try {
      await this.client!.del(key);
    } catch (error) {
      log.warn(`Cache DEL error for key "${key}":`, (error as Error).message);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.available) return;
    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.client!.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        if (keys.length > 0) {
          await this.client!.del(...keys);
        }
        cursor = nextCursor;
      } while (cursor !== "0");
      log.debug(`Cache invalidated: ${pattern}`);
    } catch (error) {
      log.warn(`Cache DEL pattern error for "${pattern}":`, (error as Error).message);
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    if (!this.available) {
      return fetcher();
    }

    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await fetcher();
    await this.set(key, fresh, ttl);
    return fresh;
  }
}
