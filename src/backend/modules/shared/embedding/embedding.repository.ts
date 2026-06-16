import prisma from "@/backend/db/prisma";
import logger from "@/utils/logger";
import type { SimilarEntityResult } from "./embedding.types";

const log = logger.child("src/backend/modules/shared/embedding/embedding.repository.ts");

export class EmbeddingRepository {
  constructor(
    private tableName: string,
    private entityIdColumn: string,
  ) {}

  async upsert(entityId: string, embedding: number[]): Promise<void> {
    log.debug("[db] Upsert embedding:", { table: this.tableName, entityId });
    const vector = `[${embedding.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${this.tableName}" ("${this.entityIdColumn}", embedding, "updatedAt")
       VALUES ($1, $2::vector, NOW())
       ON CONFLICT ("${this.entityIdColumn}")
       DO UPDATE SET embedding = $2::vector, "updatedAt" = NOW()`,
      entityId,
      vector,
    );
  }

  async delete(entityId: string): Promise<void> {
    log.debug("[db] Eliminando embedding:", { table: this.tableName, entityId });
    await prisma.$executeRawUnsafe(
      `DELETE FROM "${this.tableName}" WHERE "${this.entityIdColumn}" = $1`,
      entityId,
    );
  }

  async findByEntityId(entityId: string): Promise<number[] | null> {
    const rows = await prisma.$queryRawUnsafe<Array<{ embedding: string }>>(
      `SELECT embedding::text FROM "${this.tableName}" WHERE "${this.entityIdColumn}" = $1`,
      entityId,
    );
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].embedding);
  }

  async searchSimilar(
    embedding: number[],
    limit: number = 20,
    minSimilarity: number = 0,
  ): Promise<SimilarEntityResult[]> {
    const vector = `[${embedding.join(",")}]`;
    const rows = await prisma.$queryRawUnsafe<
      Array<{ entityId: string; similarity: number }>
    >(
      `SELECT "${this.entityIdColumn}" AS "entityId",
              1 - (embedding <=> $1::vector) AS similarity
       FROM "${this.tableName}"
       WHERE embedding IS NOT NULL
         AND 1 - (embedding <=> $1::vector) > $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      vector,
      minSimilarity,
      limit,
    );
    return rows.map(r => ({
      entityId: r.entityId,
      similarity: Number(r.similarity),
    }));
  }

  async countAll(): Promise<number> {
    const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) FROM "${this.tableName}"`,
    );
    return Number(rows[0].count);
  }

  async countWithEmbedding(): Promise<number> {
    const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) FROM "${this.tableName}" WHERE embedding IS NOT NULL`,
    );
    return Number(rows[0].count);
  }
}
