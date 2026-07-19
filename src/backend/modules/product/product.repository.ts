import prisma from "@/backend/db/prisma";
import { Prisma, type Product } from "@prisma/client";
import { CacheService, CacheKeys } from "@/backend/cache";
import { orderByIds } from "@/backend/modules/shared/embedding";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/product/product.repository.ts");

export class ProductRepository {
  constructor(private cacheService?: CacheService) {}
  /**
   * Obtiene productos paginados de la base de datos, opcionalmente filtrados por una o más categorías.
   */
  async getAllProducts(skip: number = 0, take: number = 20, categories?: string[], storeId?: string): Promise<Product[]> {
    const key = CacheKeys.product.list(skip, take, categories, storeId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Obteniendo productos paginados:", { skip, take, categories });
        const where: Prisma.ProductWhereInput = {
          ...(categories && categories.length > 0 ? { categories: { some: { name: { in: categories } } } } : {}),
          ...(storeId ? { storeId } : {
            store: { status: 'ACTIVE' }
          })
        };
        return prisma.product.findMany({
          where,
          skip,
          take,
          include: {
            categories: true,
            promotions: { where: { isActive: true } },
            store: {
              select: {
                id: true, name: true, slug: true, logo: true,
                promotions: { where: { isActive: true, scope: "ENTIRE_STORE" } }
              }
            }
          },
          orderBy: { createdAt: "desc" },
        });
      },
      config.cache.ttl.productList,
    ) ?? [];
  }

  /**
   * Obtiene productos populares paginados, ordenados por ratingAverage desc, ratingCount desc, y createdAt desc.
   */
  async getPopularProducts(skip: number = 0, take: number = 20): Promise<Product[]> {
    const key = CacheKeys.product.popular(skip, take);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Querying popular products:", { skip, take });
        return prisma.product.findMany({
          where: {
            store: { status: 'ACTIVE' }
          },
          skip,
          take,
          include: {
            categories: true,
            promotions: { where: { isActive: true } },
            store: {
              select: {
                id: true, name: true, slug: true, logo: true,
                promotions: { where: { isActive: true, scope: "ENTIRE_STORE" } }
              }
            }
          },
          orderBy: [
            { ratingAverage: { sort: "desc", nulls: "last" } },
            { ratingCount: "desc" },
            { createdAt: "desc" }
          ],
        });
      },
      config.cache.ttl.productList,
    ) ?? [];
  }

  /**
   * Obtiene productos por array de IDs (para búsqueda semántica donde ya tenemos los IDs ordenados por similitud).
   */
  async getProductsByIds(ids: string[], categories?: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        ...(categories && categories.length > 0 ? { categories: { some: { name: { in: categories } } } } : {}),
      },
      include: {
        categories: true,
        promotions: { where: { isActive: true } },
        store: {
          select: {
            id: true, name: true, slug: true, logo: true,
            promotions: { where: { isActive: true, scope: "ENTIRE_STORE" } }
          }
        }
      },
    });

    return orderByIds(products, ids);
  }

  /**
   * Obtiene el total de productos en la base de datos, opcionalmente filtrados por una o más categorías.
   */
  async getTotalCount(categories?: string[], storeId?: string): Promise<number> {
    const key = CacheKeys.product.total(categories, storeId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Obteniendo total de productos con filtros:", { categories });
        const where: Prisma.ProductWhereInput = {
          ...(categories && categories.length > 0 ? { categories: { some: { name: { in: categories } } } } : {}),
          ...(storeId ? { storeId } : {
            store: { status: 'ACTIVE' }
          })
        };
        return prisma.product.count({ where });
      },
      config.cache.ttl.productList,
    ) ?? 0;
  }

  /**
   * Obtiene un producto por su id
   */
  async getProductById(id: string): Promise<Product | null> {
    const key = CacheKeys.product.byId(id);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Buscando producto por id:", { id });
        return prisma.product.findUnique({
          where: { id },
          include: {
            categories: true,
            promotions: { where: { isActive: true } },
            store: {
              select: {
                id: true, name: true, slug: true, logo: true,
                promotions: { where: { isActive: true, scope: "ENTIRE_STORE" } }
              }
            }
          },
        });
      },
      config.cache.ttl.productDetail,
    ) ?? null;
  }

  async getProductByIdAndStore(id: string, storeId: string): Promise<Product | null> {
    log.debug("[db] Buscando producto por id y tienda:", { id, storeId });
    return prisma.product.findFirst({
      where: { id, storeId },
      include: {
        categories: true,
        promotions: { where: { isActive: true } },
        store: {
          select: {
            id: true, name: true, slug: true, logo: true,
            promotions: { where: { isActive: true, scope: "ENTIRE_STORE" } }
          }
        }
      },
    });
  }

  /**
   * Busca productos por coincidencia parcial o total en múltiples campos con paginación, opcionalmente filtrados por una o más categorías.
   */
  async searchProducts(query: string, skip: number = 0, take: number = 20, categories?: string[], storeId?: string): Promise<Product[]> {
    const key = CacheKeys.product.search(query, skip, take, categories, storeId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Buscando productos:", { query, skip, take, categories });
        const searchConditions: Prisma.ProductWhereInput[] = [
          { id: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { categories: { some: { name: { contains: query, mode: "insensitive" } } } },
          { tag: { contains: query, mode: "insensitive" } },
          { store: { name: { contains: query, mode: "insensitive" } } },
        ];

        const baseWhere = categories && categories.length > 0
          ? { AND: [{ OR: searchConditions }, { categories: { some: { name: { in: categories } } } }] }
          : { OR: searchConditions };

        const where: Prisma.ProductWhereInput = {
          ...baseWhere,
          ...(storeId ? { storeId } : {
            store: { status: 'ACTIVE' }
          })
        };

        return prisma.product.findMany({
          where: where as any,
          skip,
          take,
          include: {
            categories: true,
            promotions: { where: { isActive: true } },
            store: {
              select: {
                id: true, name: true, slug: true, logo: true,
                promotions: { where: { isActive: true, scope: "ENTIRE_STORE" } }
              }
            }
          },
          orderBy: { createdAt: "desc" },
        });
      },
      config.cache.ttl.searchResults,
    ) ?? [];
  }

  /**
   * Búsqueda semántica por similitud coseno usando pgvector.
   * Recibe un array de embeddings ya resuelto (el service se encarga de llamar a Ollama).
   */
  async semanticSearch(
    embedding: number[],
    limit: number = 20,
    categories?: string[],
    storeId?: string,
  ): Promise<Product[]> {
    const vector = `[${embedding.join(",")}]`;
    const conditions: string[] = [];
    const params: any[] = [vector, String(limit)];
    let idx = 3;

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
    }

    const where = conditions.join(" AND ");

    const query = `
      SELECT p.*
      FROM "ProductEmbedding" pe
      JOIN "Product" p ON p.id = pe."productId"
      JOIN "Store" s ON s.id = p."storeId"
      WHERE pe.embedding IS NOT NULL AND ${where}
      ORDER BY pe.embedding <=> $1::vector
      LIMIT $2
    `;

    log.debug("[db] Búsqueda semántica:", { categories, storeId, limit });

    return prisma.$queryRawUnsafe<Product[]>(query, ...params);
  }

  /**
   * Obtiene el conteo de resultados para una búsqueda específica, opcionalmente filtrados por una o más categorías.
   */
  async getSearchCount(query: string, categories?: string[], storeId?: string): Promise<number> {
    const key = CacheKeys.product.searchCount(query, categories, storeId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Obteniendo conteo de búsqueda de productos:", { query, categories, storeId });
        const searchConditions: Prisma.ProductWhereInput[] = [
          { id: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { categories: { some: { name: { contains: query, mode: "insensitive" } } } },
          { tag: { contains: query, mode: "insensitive" } },
        ];

        const baseWhere = categories && categories.length > 0
          ? { AND: [{ OR: searchConditions }, { categories: { some: { name: { in: categories } } } }] }
          : { OR: searchConditions };

        const where: Prisma.ProductWhereInput = {
          ...baseWhere,
          ...(storeId ? { storeId } : {
            store: { status: 'ACTIVE' }
          })
        };

        return prisma.product.count({
          where: where as any,
        });
      },
      config.cache.ttl.searchResults,
    ) ?? 0;
  }

  /**
   * Crea un nuevo producto (solo para seeding o uso interno)
   */
  async createProduct(data: any): Promise<Product> {
    log.info("[db] Creando nuevo producto:", { name: data.name });

    const { categories, storeId, ...restData } = data;

    const product = await prisma.product.create({
      data: {
        ...restData,
        storeId,
        categories: categories && categories.length > 0 ? {
          connectOrCreate: categories.map((c: string) => ({
            where: { name: c },
            create: { name: c }
          }))
        } : undefined,
      },
      include: {
        categories: true,
        promotions: { where: { isActive: true } },
        store: {
          select: {
            id: true, name: true, slug: true, logo: true,
            promotions: { where: { isActive: true, scope: "ENTIRE_STORE" } }
          }
        }
      },
    }) as unknown as Promise<Product>;

    await this.cacheService?.delPattern(CacheKeys.product.allPattern);
    return product;
  }

  /**
   * Actualiza un producto existente
   */
  async updateProduct(id: string, data: any): Promise<Product> {
    log.info(`[db] Actualizando producto: ${id}`);

    const { categories, storeId, ...restData } = data;

    const updateData: any = { ...restData };
    if (storeId !== undefined) updateData.storeId = storeId;
    if (categories !== undefined) {
      updateData.categories = {
        set: [],
        connectOrCreate: categories.map((c: string) => ({
          where: { name: c },
          create: { name: c }
        }))
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        categories: true,
        promotions: { where: { isActive: true } },
        store: {
          select: {
            id: true, name: true, slug: true, logo: true,
            promotions: { where: { isActive: true, scope: "ENTIRE_STORE" } }
          }
        }
      },
    }) as unknown as Promise<Product>;

    await this.cacheService?.delPattern(CacheKeys.product.allPattern);
    return product;
  }

  async updateStoreProduct(storeId: string, id: string, data: any): Promise<Product> {
    log.info("[db] Actualizando producto de tienda:", { id, storeId });

    const { categories, ...restData } = data;
    delete restData.storeId;

    const updateData: any = { ...restData };
    if (categories !== undefined) {
      updateData.categories = {
        set: [],
        connectOrCreate: categories.map((c: string) => ({
          where: { name: c },
          create: { name: c }
        }))
      };
    }

    const product = await prisma.product.update({
      where: { id, storeId },
      data: updateData,
      include: {
        categories: true,
        promotions: { where: { isActive: true } },
        store: {
          select: {
            id: true, name: true, slug: true, logo: true,
            promotions: { where: { isActive: true, scope: "ENTIRE_STORE" } }
          }
        }
      },
    }) as unknown as Promise<Product>;

    await this.cacheService?.delPattern(CacheKeys.product.allPattern);
    return product;
  }

  /**
   * Elimina un producto por su ID
   */
  async deleteProduct(id: string): Promise<Product> {
    log.info(`[db] Eliminando producto: ${id}`);
    const product = await prisma.product.delete({
      where: { id },
      include: {
        categories: true,
        promotions: { where: { isActive: true } },
        store: {
          select: {
            id: true, name: true, slug: true, logo: true,
            promotions: { where: { isActive: true, scope: "ENTIRE_STORE" } }
          }
        }
      },
    }) as unknown as Promise<Product>;

    await this.cacheService?.delPattern(CacheKeys.product.allPattern);
    return product;
  }

  async deleteStoreProduct(storeId: string, id: string): Promise<Product> {
    log.info("[db] Eliminando producto de tienda:", { id, storeId });
    const product = await prisma.product.delete({
      where: { id, storeId },
      include: {
        categories: true,
        promotions: { where: { isActive: true } },
        store: {
          select: {
            id: true, name: true, slug: true, logo: true,
            promotions: { where: { isActive: true, scope: "ENTIRE_STORE" } }
          }
        }
      },
    }) as unknown as Promise<Product>;

    await this.cacheService?.delPattern(CacheKeys.product.allPattern);
    return product;
  }

  /**
   * Obtiene productos de una tienda específica
   */
  async getProductsByStore(storeId: string, skip: number = 0, take: number = 20): Promise<Product[]> {
    const key = CacheKeys.product.byStore(storeId, skip, take);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Obteniendo productos de la tienda:", { storeId, skip, take });
        return prisma.product.findMany({
          where: { storeId },
          skip,
          take,
          include: {
            categories: true,
            promotions: { where: { isActive: true } },
            store: {
              select: {
                id: true, name: true, slug: true, logo: true,
                promotions: { where: { isActive: true, scope: "ENTIRE_STORE" } }
              }
            }
          },
          orderBy: { createdAt: "desc" },
        });
      },
      config.cache.ttl.productList,
    ) ?? [];
  }

  async getProductCountByStore(storeId: string): Promise<number> {
    const key = CacheKeys.product.byStoreCount(storeId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Obteniendo conteo de productos de la tienda:", { storeId });
        return prisma.product.count({
          where: { storeId }
        });
      },
      config.cache.ttl.productList,
    ) ?? 0;
  }

  async getRelatedIds(productId: string, fetcher: () => Promise<string[]>): Promise<string[]> {
    const key = CacheKeys.product.related(productId);
    return this.cacheService?.getOrSet(key, fetcher, config.cache.ttl.productRelated) ?? fetcher();
  }

  async getProductsPendingEmbedding(limit: number): Promise<Array<{ id: string; name: string; description: string; tag: string; categories: Array<{ name: string }> }>> {
    log.debug("[db] Obteniendo productos sin embedding:", { limit });
    return prisma.$queryRawUnsafe<
      Array<{ id: string; name: string; description: string; tag: string; categories: Array<{ name: string }> }>
    >(
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

  async filterProductIdsByIds(ids: string[], storeId?: string, categories?: string[]): Promise<string[]> {
    log.debug("[db] Filtrando productos por IDs:", { idsCount: ids.length, storeId, categories });
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        ...(storeId ? { storeId } : {}),
        ...(categories?.length ? { categories: { some: { name: { in: categories } } } } : {}),
      },
      select: { id: true },
    });
    return products.map(p => p.id);
  }

  async getCategories(): Promise<string[]> {
    return this.cacheService?.getOrSet(
      CacheKeys.product.categories,
      async () => {
        log.debug("[db] Obteniendo categorías únicas");
        const result = await prisma.categoria.findMany({
          orderBy: { name: "asc" },
        });
        return result.map(c => c.name);
      },
      config.cache.ttl.categories,
    ) ?? [];
  }

  async getCategoryCounts(storeId?: string): Promise<Record<string, number>> {
    const key = CacheKeys.product.categoryCounts(storeId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Obteniendo conteo de productos por categoría", { storeId });
        const categories = await prisma.categoria.findMany({
          include: {
            _count: {
              select: {
                products: storeId ? { where: { storeId } } : true
              }
            }
          }
        });
        const counts: Record<string, number> = {};
        for (const c of categories) {
          counts[c.name] = c._count.products;
        }
        return counts;
      },
      config.cache.ttl.categoryCounts,
    ) ?? {};
  }
}
