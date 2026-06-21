import type { EmbeddingService } from "@/backend/modules/shared/embedding";
import type { ForumRepository } from "./forum.repository";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/forum/forumPostEmbedding.service.ts");

export class ForumPostEmbeddingService {
  constructor(
    private genericService: EmbeddingService,
    private forumRepository?: ForumRepository,
  ) {}

  buildEmbeddingText(post: { title: string; body: string; labels: string[] }): string {
    return [
      `Título: ${post.title}`,
      post.labels?.length ? `Etiquetas: ${post.labels.join(", ")}` : "",
      `Cuerpo: ${post.body}`,
    ].filter(Boolean).join("\n");
  }

  async isSemanticSearchAvailable(): Promise<{ available: boolean; reason?: string }> {
    return this.genericService.isAvailable();
  }

  async generateForPost(post: {
    id: string;
    title: string;
    body: string;
    labels: string[];
  }): Promise<number[] | null> {
    const text = this.buildEmbeddingText(post);
    return this.genericService.generateForEntity(post.id, text);
  }

  async generateAll(): Promise<{ success: number; failed: number; skipped: number }> {
    const pending = await this.genericService.countAll() - await this.genericService.countWithEmbedding();
    if (pending === 0) return { success: 0, failed: 0, skipped: 0 };

    return this.genericService.generateAll(async (limit) => {
      if (!this.forumRepository) return [];
      const rows = await this.forumRepository.getPostsPendingEmbedding(limit);
      return rows.map(r => ({
        id: r.id,
        text: this.buildEmbeddingText({
          title: r.title,
          body: r.body,
          labels: r.labels ?? [],
        }),
      }));
    });
  }

  async searchSimilar(
    query: string,
    limit: number = 50,
    labels?: string[],
  ): Promise<Array<{ id: string; similarity: number }>> {
    const results = await this.genericService.searchSimilar(query, limit, 0.48);
    if (results.length === 0) {
      log.debug("🤖 [SemanticSearch] Sin resultados sobre 0.65 para:", { query: query.slice(0, 100) });
      return [];
    }

    log.debug("🤖 [SemanticSearch] Resultados semánticos:", {
      query: query.slice(0, 100),
      totalResults: results.length,
      topSimilarities: results.slice(0, 10).map(r => ({ id: r.entityId.slice(0, 8), similarity: Number(r.similarity).toFixed(4) })),
    });

    if (!labels?.length) {
      return results.map(r => ({ id: r.entityId, similarity: r.similarity }));
    }

    const ids = results.map(r => r.entityId);
    if (!this.forumRepository) {
      return results
        .filter(r => ids.includes(r.entityId))
        .map(r => ({ id: r.entityId, similarity: r.similarity }));
    }
    const filteredIds = await this.forumRepository.filterPostIdsByIds(ids, labels);
    const filteredSet = new Set(filteredIds);
    const filtered = results
      .filter(r => filteredSet.has(r.entityId))
      .map(r => ({ id: r.entityId, similarity: r.similarity }));

    log.debug("🤖 [SemanticSearch] Después de filtro de labels:", {
      before: results.length,
      after: filtered.length,
    });

    return filtered;
  }

  async getStats(): Promise<{ total: number; withEmbedding: number; pending: number; percentage: number }> {
    const total = await this.genericService.countAll();
    return this.genericService.getStats(total);
  }
}
