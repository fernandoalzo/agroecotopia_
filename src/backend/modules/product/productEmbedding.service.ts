import type { EmbeddingService } from "@/backend/modules/shared/embedding";
import type { ProductRepository } from "./product.repository";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/product/productEmbedding.service.ts");

export class ProductEmbeddingService {
  constructor(
    private genericService: EmbeddingService,
    private productRepository?: ProductRepository,
  ) {}

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
    return this.genericService.isAvailable();
  }

  async generateForProduct(product: {
    id: string;
    name: string;
    description: string;
    tag: string;
    categories?: Array<{ name: string }> | string[];
  }): Promise<number[] | null> {
    const text = this.buildEmbeddingText(product);
    return this.genericService.generateForEntity(product.id, text);
  }

  async generateAll(): Promise<{ success: number; failed: number; skipped: number }> {
    const pending = await this.genericService.countAll() - await this.genericService.countWithEmbedding();
    if (pending === 0) return { success: 0, failed: 0, skipped: 0 };

    return this.genericService.generateAll(async (limit) => {
      if (!this.productRepository) return [];
      const rows = await this.productRepository.getProductsPendingEmbedding(limit);
      return rows.map(r => ({
        id: r.id,
        text: this.buildEmbeddingText({
          name: r.name,
          description: r.description,
          tag: r.tag,
          categories: r.categories ?? [],
        }),
      }));
    });
  }

  async searchSimilar(
    query: string,
    limit: number = 200,
    storeId?: string,
    categories?: string[],
  ): Promise<Array<{ id: string; similarity: number }>> {
    const results = await this.genericService.searchSimilar(query, limit, 0.6);
    if (results.length === 0) return [];
    if (!storeId && !categories?.length) {
      return results.map(r => ({ id: r.entityId, similarity: r.similarity }));
    }

    const ids = results.map(r => r.entityId);
    if (!this.productRepository) {
      return results
        .filter(r => ids.includes(r.entityId))
        .map(r => ({ id: r.entityId, similarity: r.similarity }));
    }
    const filteredIds = await this.productRepository.filterProductIdsByIds(ids, storeId, categories);
    const filteredSet = new Set(filteredIds);
    return results
      .filter(r => filteredSet.has(r.entityId))
      .map(r => ({ id: r.entityId, similarity: r.similarity }));
  }

  async getStats(): Promise<{ total: number; withEmbedding: number; pending: number; percentage: number }> {
    const total = await this.genericService.countAll();
    return this.genericService.getStats(total);
  }
}
