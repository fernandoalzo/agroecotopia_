import prisma from "@/backend/db/prisma";
import { EmbeddingRepository, EmbeddingService } from "@/backend/modules/shared/embedding";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/forum/forumPostEmbedding.service.ts");

export class ForumPostEmbeddingService {
  private genericService: EmbeddingService;

  constructor() {
    const repository = new EmbeddingRepository('ForumPostEmbedding', 'postId');
    this.genericService = new EmbeddingService(repository, { batchSize: config.embedding.batchSize });
  }

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
    const pending = await this.countTotal() - await this.genericService.countWithEmbedding();
    if (pending === 0) return { success: 0, failed: 0, skipped: 0 };

    return this.genericService.generateAll(async (limit) => {
      const rows = await prisma.$queryRawUnsafe<
        Array<{ id: string; title: string; body: string; labels: string[] }>
      >(
        `SELECT fp.id, fp.title, fp.body, fp.labels
         FROM "ForumPost" fp
         LEFT JOIN "ForumPostEmbedding" fpe ON fpe."postId" = fp.id
         WHERE fpe."postId" IS NULL
         LIMIT $1`,
        limit,
      );
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
    const posts = await prisma.forumPost.findMany({
      where: {
        id: { in: ids },
        labels: { hasSome: labels },
      },
      select: { id: true, title: true },
    });
    const filteredIds = new Set(posts.map(p => p.id));
    const filtered = results
      .filter(r => filteredIds.has(r.entityId))
      .map(r => ({ id: r.entityId, similarity: r.similarity }));

    log.debug("🤖 [SemanticSearch] Después de filtro de labels:", {
      before: results.length,
      after: filtered.length,
      topTitles: posts.filter(p => filteredIds.has(p.id)).slice(0, 5).map(p => ({ id: p.id.slice(0, 8), title: p.title.slice(0, 60) })),
    });

    return filtered;
  }

  async getStats(): Promise<{ total: number; withEmbedding: number; pending: number; percentage: number }> {
    const total = await this.countTotal();
    return this.genericService.getStats(total);
  }

  private async countTotal(): Promise<number> {
    const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) FROM "ForumPost"`,
    );
    return Number(rows[0].count);
  }
}
