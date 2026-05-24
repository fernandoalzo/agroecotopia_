import prisma from "@/backend/db/prisma";
import { Prisma, type Product } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/product/product.repository.ts");

export class ProductRepository {
  /**
   * Obtiene productos paginados de la base de datos, opcionalmente filtrados por una o más categorías.
   */
  async getAllProducts(skip: number = 0, take: number = 20, categories?: string[]): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = categories && categories.length > 0 ? { categories: { some: { name: { in: categories } } } } : {};
    log.debug("Obteniendo productos paginados:", { skip, take, categories });
    return prisma.product.findMany({
      where,
      skip,
      take,
      include: { categories: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Obtiene el total de productos en la base de datos, opcionalmente filtrados por una o más categorías.
   */
  async getTotalCount(categories?: string[]): Promise<number> {
    const where: Prisma.ProductWhereInput = categories && categories.length > 0 ? { categories: { some: { name: { in: categories } } } } : {};
    log.debug("Obteniendo total de productos con filtros:", { categories });
    return prisma.product.count({ where });
  }

  /**
   * Obtiene un producto por su id
   */
  async getProductById(id: string): Promise<Product | null> {
    log.debug("Buscando producto por id:", { id });
    return prisma.product.findUnique({
      where: { id },
      include: { categories: true },
    });
  }

  /**
   * Busca productos por coincidencia parcial o total en múltiples campos con paginación, opcionalmente filtrados por una o más categorías.
   */
  async searchProducts(query: string, skip: number = 0, take: number = 20, categories?: string[]): Promise<Product[]> {
    const searchConditions = [
      { id: { contains: query, mode: "insensitive" } },
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { categories: { some: { name: { contains: query, mode: "insensitive" } } } },
      { tag: { contains: query, mode: "insensitive" } },
    ];

    const where = categories && categories.length > 0
      ? { AND: [{ OR: searchConditions }, { categories: { some: { name: { in: categories } } } }] }
      : { OR: searchConditions };

    log.debug("Buscando productos:", { query, skip, take, categories });
    return prisma.product.findMany({
      where: where as any,
      skip,
      take,
      include: { categories: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Obtiene el conteo de resultados para una búsqueda específica, opcionalmente filtrados por una o más categorías.
   */
  async getSearchCount(query: string, categories?: string[]): Promise<number> {
    const searchConditions = [
      { id: { contains: query, mode: "insensitive" } },
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { categories: { some: { name: { contains: query, mode: "insensitive" } } } },
      { tag: { contains: query, mode: "insensitive" } },
    ];

    const where = categories && categories.length > 0
      ? { AND: [{ OR: searchConditions }, { categories: { some: { name: { in: categories } } } }] }
      : { OR: searchConditions };

    log.debug("Obteniendo conteo de búsqueda de productos:", { query, categories });
    return prisma.product.count({
      where: where as any,
    });
  }

  /**
   * Crea un nuevo producto (solo para seeding o uso interno)
   */
  async createProduct(data: any): Promise<Product> {
    log.info("Creando nuevo producto:", { name: data.name });

    const { categories, ...restData } = data;

    return prisma.product.create({
      data: {
        ...restData,
        categories: categories && categories.length > 0 ? {
          connectOrCreate: categories.map((c: string) => ({
            where: { name: c },
            create: { name: c }
          }))
        } : undefined,
      },
      include: { categories: true },
    }) as unknown as Promise<Product>;
  }

  /**
   * Actualiza un producto existente
   */
  async updateProduct(id: string, data: any): Promise<Product> {
    log.info(`Actualizando producto: ${id}`);

    const { categories, ...restData } = data;

    const updateData: any = { ...restData };
    if (categories !== undefined) {
      updateData.categories = {
        set: [], // Clear existing
        connectOrCreate: categories.map((c: string) => ({
          where: { name: c },
          create: { name: c }
        }))
      };
    }

    return prisma.product.update({
      where: { id },
      data: updateData,
      include: { categories: true },
    }) as unknown as Promise<Product>;
  }

  /**
   * Elimina un producto por su ID
   */
  async deleteProduct(id: string): Promise<Product> {
    log.info(`Eliminando producto: ${id}`);
    return prisma.product.delete({
      where: { id },
      include: { categories: true },
    }) as unknown as Promise<Product>;
  }

  /**
   * Obtiene todas las categorías únicas de la tabla de productos.
   */
  async getCategories(): Promise<string[]> {
    log.debug("Obteniendo categorías únicas");
    const result = await prisma.categoria.findMany({
      orderBy: { name: "asc" },
    });
    return result.map(c => c.name);
  }

  /**
   * Obtiene el conteo de productos por categoría usando groupBy.
   */
  async getCategoryCounts(): Promise<Record<string, number>> {
    log.debug("Obteniendo conteo de productos por categoría");
    const categories = await prisma.categoria.findMany({
      include: { _count: { select: { products: true } } }
    });
    const counts: Record<string, number> = {};
    for (const c of categories) {
      counts[c.name] = c._count.products;
    }
    return counts;
  }
}
