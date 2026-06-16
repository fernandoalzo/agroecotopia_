import { OllamaProvider } from "@/backend/modules/ai/providers/ollama";
import { config } from "@/config/config";
import logger from "@/utils/logger";
import { EmbeddingRepository } from "./embedding.repository";
import type { EmbeddingStats, SimilarEntityResult } from "./embedding.types";

const log = logger.child("src/backend/modules/shared/embedding/embedding.service.ts");

const CHECK_TTL = 60_000;

export interface EmbeddingServiceOptions {
  batchSize?: number;
}

export class EmbeddingService {
  private provider: OllamaProvider | null = null;
  private lastAvailabilityCheck = 0;
  private availabilityCache: { available: boolean; reason?: string } | null = null;

  constructor(
    private repository: EmbeddingRepository,
    private options: EmbeddingServiceOptions = {},
  ) {}

  private getProvider(): OllamaProvider {
    if (!this.provider) {
      this.provider = new OllamaProvider({
        apiKey: "",
        baseUrl: config.ollama.baseUrl,
        defaultModel: "llama3.2",
        embeddingModel: config.ollama.embeddingModel,
        maxRetries: 1,
        timeout: config.ollama.timeout,
      });
    }
    return this.provider;
  }

  async isAvailable(): Promise<{ available: boolean; reason?: string }> {
    const now = Date.now();
    if (this.availabilityCache && now - this.lastAvailabilityCheck < CHECK_TTL) {
      return this.availabilityCache;
    }

    try {
      const provider = this.getProvider();
      const modelAvailable = await provider.isAvailable();
      if (!modelAvailable) {
        this.availabilityCache = {
          available: false,
          reason: `Modelo ${config.ollama.embeddingModel} no disponible en Ollama (${config.ollama.baseUrl})`,
        };
        log.warn("🤖 [SemanticSearch] " + this.availabilityCache.reason);
        this.lastAvailabilityCheck = now;
        return this.availabilityCache;
      }

      const count = await this.repository.countWithEmbedding();
      if (count === 0) {
        this.availabilityCache = {
          available: false,
          reason: "No hay entidades con embeddings generados",
        };
        log.warn("🤖 [SemanticSearch] " + this.availabilityCache.reason);
        this.lastAvailabilityCheck = now;
        return this.availabilityCache;
      }

      this.availabilityCache = { available: true };
    } catch (error) {
      this.availabilityCache = {
        available: false,
        reason: `Error verificando disponibilidad: ${error}`,
      };
      log.warn("🤖 [SemanticSearch] " + this.availabilityCache.reason);
    }

    this.lastAvailabilityCheck = now;
    return this.availabilityCache;
  }

  async generateForEntity(entityId: string, text: string): Promise<number[] | null> {
    try {
      const provider = this.getProvider();
      const available = await provider.isAvailable();
      if (!available) {
        log.warn("🤖 [Embedding] Ollama no disponible, embedding será nulo para:", entityId);
        return null;
      }

      const response = await provider.embed(text);

      if (!response.embedding || response.embedding.length === 0) {
        log.warn("🤖 [Embedding] Embedding vacío para entidad:", entityId);
        return null;
      }

      await this.repository.upsert(entityId, response.embedding);
      log.info("🤖 [Embedding] Generado para:", { entityId, dimensions: response.embedding.length });
      this.availabilityCache = null;
      return response.embedding;
    } catch (error) {
      log.warn("🤖 [Embedding] Error generando embedding:", { entityId, error });
      return null;
    }
  }

  async generateAll(
    fetchPending: (limit: number) => Promise<Array<{ id: string; text: string }>>,
  ): Promise<{ success: number; failed: number; skipped: number }> {
    const batchSize = this.options.batchSize ?? config.embedding.batchSize;
    const entities = await fetchPending(batchSize);

    if (entities.length === 0) return { success: 0, failed: 0, skipped: 0 };

    log.info("🤖 [Embedding] Generación masiva:", { batchSize, pending: entities.length });
    let success = 0;
    let failed = 0;

    for (const entity of entities) {
      const result = await this.generateForEntity(entity.id, entity.text);
      if (result) success++;
      else failed++;
    }

    log.info("🤖 [Embedding] Lote completado:", { success, failed });
    return { success, failed, skipped: 0 };
  }

  async searchSimilar(
    query: string,
    limit: number = 20,
    minSimilarity: number = 0,
  ): Promise<SimilarEntityResult[]> {
    const availability = await this.isAvailable();
    if (!availability.available) return [];

    try {
      const provider = this.getProvider();
      const response = await provider.embed(query);
      if (!response.embedding) return [];

      return this.repository.searchSimilar(response.embedding, limit, minSimilarity);
    } catch (error) {
      log.warn("🤖 [SemanticSearch] Error:", { error });
      return [];
    }
  }

  async getStats(totalEntities: number): Promise<EmbeddingStats> {
    const withEmbedding = await this.repository.countWithEmbedding();
    return {
      total: totalEntities,
      withEmbedding,
      pending: totalEntities - withEmbedding,
      percentage: totalEntities > 0 ? Math.round((withEmbedding / totalEntities) * 100) : 0,
    };
  }

  async countWithEmbedding(): Promise<number> {
    return this.repository.countWithEmbedding();
  }
}
