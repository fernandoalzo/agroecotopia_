import prisma from "@/backend/db/prisma";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/product/productEmbedding.repository.ts");

export interface SimilarProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  tag: string;
  storeId: string;
  similarity: number;
}

export class ProductEmbeddingRepository {
  async upsert(productId: string, embedding: number[]): Promise<void> {
    log.debug("[db] Upsert embedding para producto:", { productId });
    const vector = `[${embedding.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ProductEmbedding" ("productId", embedding, "updatedAt")
       VALUES ($1, $2::vector, NOW())
       ON CONFLICT ("productId")
       DO UPDATE SET embedding = $2::vector, "updatedAt" = NOW()`,
      productId,
      vector,
    );
  }

  async delete(productId: string): Promise<void> {
    log.debug("[db] Eliminando embedding del producto:", { productId });
    await prisma.$executeRawUnsafe(
      `DELETE FROM "ProductEmbedding" WHERE "productId" = $1`,
      productId,
    );
  }

  async findByProductId(productId: string): Promise<number[] | null> {
    const rows = await prisma.$queryRawUnsafe<Array<{ embedding: string }>>(
      `SELECT embedding::text FROM "ProductEmbedding" WHERE "productId" = $1`,
      productId,
    );
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].embedding);
  }

  async searchSimilar(
    embedding: number[],
    limit: number = 20,
    storeId?: string,
    categories?: string[],
    minSimilarity: number = 0.5,
  ): Promise<SimilarProduct[]> {
    const vector = `[${embedding.join(",")}]`;
    const conditions: string[] = [];
    const params: any[] = [vector];
    let idx = 2;

    if (storeId) {
      conditions.push(`p."storeId" = $${idx++}`);
      params.push(storeId);
    } else {
      conditions.push(`s.status = 'ACTIVE'`);
    }

    if (categories && categories.length > 0) {
      conditions.push(`EXISTS (
        SELECT 1 FROM "_CategoriaToProduct" cp
        JOIN "Categoria" c ON c.id = cp."B"
        WHERE cp."A" = p.id AND c.name = ANY($${idx}::text[])
      )`);
      params.push(categories);
      idx++;
    }

    params.push(limit);
    const where = conditions.join(" AND ");

    const query = `
      SELECT
        p.id, p.name, p.description, p.price, p.images, p.tag, p."storeId",
        1 - (pe.embedding <=> $1::vector) AS similarity
      FROM "ProductEmbedding" pe
      JOIN "Product" p ON p.id = pe."productId"
      JOIN "Store" s ON s.id = p."storeId"
      WHERE pe.embedding IS NOT NULL AND ${where}
        AND 1 - (pe.embedding <=> $1::vector) > $${idx + 1}
      ORDER BY pe.embedding <=> $1::vector
      LIMIT $${idx}
    `;
    params.push(minSimilarity);
    idx++;

    const rows = await prisma.$queryRawUnsafe<Array<SimilarProduct & { images: any; price: any }>>(query, ...params);

    return rows.map(r => ({
      ...r,
      images: Array.isArray(r.images) ? r.images : [],
      price: Number(r.price),
      similarity: Number(r.similarity),
    }));
  }

  async countWithEmbedding(): Promise<number> {
    const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) FROM "ProductEmbedding" WHERE embedding IS NOT NULL`,
    );
    return Number(rows[0].count);
  }

  async countTotal(): Promise<number> {
    const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) FROM "Product"`,
    );
    return Number(rows[0].count);
  }

  async productsWithoutEmbedding(limit: number = 100): Promise<Array<{
    id: string; name: string; description: string; tag: string; categories: Array<{ name: string }>;
  }>> {
    return prisma.$queryRawUnsafe(
      `SELECT p.id, p.name, p.description, p.tag,
              COALESCE(
                json_agg(json_build_object('name', c.name)) FILTER (WHERE c.name IS NOT NULL),
                '[]'::json
              ) AS categories
       FROM "Product" p
       LEFT JOIN "ProductEmbedding" pe ON pe."productId" = p.id
       LEFT JOIN "_CategoriaToProduct" cp ON cp."A" = p.id
       LEFT JOIN "Categoria" c ON c.id = cp."B"
       WHERE pe."productId" IS NULL
       GROUP BY p.id
        LIMIT $1`,
      limit,
    );
  }
}
