import prisma from "@/backend/db/prisma";
import { Prisma, type Product } from "@prisma/client";
import { CacheService, CacheKeys } from "@/backend/cache";
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
        log.debug("Obteniendo productos paginados:", { skip, take, categories });
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
   * Obtiene el total de productos en la base de datos, opcionalmente filtrados por una o más categorías.
   */
  async getTotalCount(categories?: string[], storeId?: string): Promise<number> {
    const key = CacheKeys.product.total(categories, storeId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("Obteniendo total de productos con filtros:", { categories });
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
        log.debug("Buscando producto por id:", { id });
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
    log.debug("Buscando producto por id y tienda:", { id, storeId });
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
        log.debug("Buscando productos:", { query, skip, take, categories });
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
   * Obtiene el conteo de resultados para una búsqueda específica, opcionalmente filtrados por una o más categorías.
   */
  async getSearchCount(query: string, categories?: string[], storeId?: string): Promise<number> {
    const key = CacheKeys.product.searchCount(query, categories, storeId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("Obteniendo conteo de búsqueda de productos:", { query, categories, storeId });
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
    log.info("Creando nuevo producto:", { name: data.name });

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
    log.info(`Actualizando producto: ${id}`);

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
    log.info("Actualizando producto de tienda:", { id, storeId });

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
    log.info(`Eliminando producto: ${id}`);
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
    log.info("Eliminando producto de tienda:", { id, storeId });
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
        log.debug("Obteniendo productos de la tienda:", { storeId, skip, take });
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
        log.debug("Obteniendo conteo de productos de la tienda:", { storeId });
        return prisma.product.count({
          where: { storeId }
        });
      },
      config.cache.ttl.productList,
    ) ?? 0;
  }

  async getCategories(): Promise<string[]> {
    return this.cacheService?.getOrSet(
      CacheKeys.product.categories,
      async () => {
        log.debug("Obteniendo categorías únicas");
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
        log.debug("Obteniendo conteo de productos por categoría", { storeId });
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
