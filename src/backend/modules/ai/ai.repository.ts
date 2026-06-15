import { CacheService } from "@/backend/cache";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/ai.repository.ts");

export interface AIRepositoryOptions {
  /** TTL por defecto para respuestas cacheadas del LLM */
  defaultTTL?: number;
}

export class AIRepository {
  constructor(
    private cacheService?: CacheService,
    private options: AIRepositoryOptions = {},
  ) {}

  async getCachedResponse(queryHash: string): Promise<string | null> {
    const key = this.buildCacheKey("response", queryHash);
    const cached = await this.cacheService?.get<string>(key);
    if (cached) {
      log.debug("[cache] FAQ cache HIT:", { queryHash });
    }
    return cached ?? null;
  }

  async setCachedResponse(queryHash: string, response: string): Promise<void> {
    const key = this.buildCacheKey("response", queryHash);
    await this.cacheService?.set(key, response, this.options.defaultTTL ?? 3600);
    log.debug("[cache] FAQ cache SET:", { queryHash, ttl: this.options.defaultTTL ?? 3600 });
  }

  async getCachedEmbedding(textHash: string): Promise<number[] | null> {
    const key = this.buildCacheKey("embedding", textHash);
    const cached = await this.cacheService?.get<number[]>(key);
    return cached ?? null;
  }

  async setCachedEmbedding(textHash: string, embedding: number[]): Promise<void> {
    const key = this.buildCacheKey("embedding", textHash);
    await this.cacheService?.set(key, embedding, 86400);
  }

  async invalidateAll(): Promise<void> {
    await this.cacheService?.delPattern("cache:ai:*");
    log.info("[cache] Caché de AI invalidado completamente.");
  }

  private buildCacheKey(type: string, hash: string): string {
    return `cache:ai:${type}:${hash}`;
  }
}
