import type { Product } from "@prisma/client";
import { ProductEmbeddingRepository } from "./productEmbedding.repository";
import { OllamaProvider } from "@/backend/modules/ai/providers/ollama";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/product/productEmbedding.service.ts");

const CHECK_TTL = 60_000;

export class ProductEmbeddingService {
  private provider: OllamaProvider | null = null;
  private lastAvailabilityCheck = 0;
  private availabilityCache: { available: boolean; reason?: string } | null = null;

  constructor(
    private repository: ProductEmbeddingRepository,
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

  buildEmbeddingText(product: { name: string; description: string; tag: string; categories?: Array<{ name: string }> | string[] }): string {
    const categories = product.categories
      ? product.categories.map(c => (typeof c === "string" ? c : c.name)).join(", ")
      : "";
    return [
      `Producto: ${product.name}`,
      categories ? `Categorías: ${categories}` : "",
      `Tipo: ${product.tag}`,
      `Descripción: ${product.description}`,
    ].filter(Boolean).join("\n");
  }

  async isSemanticSearchAvailable(): Promise<{ available: boolean; reason?: string }> {
    const now = Date.now();
    if (this.availabilityCache && (now - this.lastAvailabilityCheck) < CHECK_TTL) {
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

      const stats = await this.getStats();
      if (stats.withEmbedding === 0) {
        this.availabilityCache = {
          available: false,
          reason: "No hay productos con embeddings generados",
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

  async generateForProduct(product: {
    id: string;
    name: string;
    description: string;
    tag: string;
    categories?: Array<{ name: string }> | string[];
  }): Promise<number[] | null> {
    try {
      const provider = this.getProvider();
      const available = await provider.isAvailable();
      if (!available) {
        log.warn("🤖 [Embedding] Ollama no disponible, embedding será nulo para:", product.id);
        return null;
      }

      const text = this.buildEmbeddingText(product);
      const response = await provider.embed(text);

      if (!response.embedding || response.embedding.length === 0) {
        log.warn("🤖 [Embedding] Embedding vacío para producto:", product.id);
        return null;
      }

      await this.repository.upsert(product.id, response.embedding);
      log.info("🤖 [Embedding] Embedding generado para:", { productId: product.id, dimensions: response.embedding.length });
      this.availabilityCache = null;
      return response.embedding;
    } catch (error) {
      log.warn("🤖 [Embedding] Error generando embedding, será nulo:", { productId: product.id, error });
      return null;
    }
  }

  async generateAll(): Promise<{ success: number; failed: number; skipped: number }> {
    const batchSize = config.embedding.batchSize;
    const total = await this.repository.countTotal();
    const alreadyDone = await this.repository.countWithEmbedding();
    const pending = total - alreadyDone;

    log.info("🤖 [Embedding] Generación masiva:", { total, alreadyDone, pending, batchSize });

    if (pending === 0) return { success: 0, failed: 0, skipped: pending };

    const products = await this.repository.productsWithoutEmbedding(batchSize);
    let success = 0;
    let failed = 0;

    for (const product of products) {
      const result = await this.generateForProduct(product);
      if (result) success++;
      else failed++;
    }

    log.info("🤖 [Embedding] Lote completado:", { success, failed, pending });
    return { success, failed, skipped: pending - products.length };
  }

  async searchSimilar(
    query: string,
    limit: number = 20,
    storeId?: string,
    categories?: string[],
  ): Promise<Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    tag: string;
    storeId: string;
    similarity: number;
  }>> {
    const availability = await this.isSemanticSearchAvailable();
    if (!availability.available) {
      return [];
    }

    try {
      const provider = this.getProvider();
      const response = await provider.embed(query);
      if (!response.embedding) return [];

      return this.repository.searchSimilar(response.embedding, limit, storeId, categories);
    } catch (error) {
      log.warn("🤖 [Embedding] Error en búsqueda semántica:", { error });
      return [];
    }
  }

  async getStats(): Promise<{ total: number; withEmbedding: number; pending: number; percentage: number }> {
    const total = await this.repository.countTotal();
    const withEmbedding = await this.repository.countWithEmbedding();
    return {
      total,
      withEmbedding,
      pending: total - withEmbedding,
      percentage: total > 0 ? Math.round((withEmbedding / total) * 100) : 0,
    };
  }
}
