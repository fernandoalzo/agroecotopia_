import prisma from "@/backend/db/prisma";
import type { Product } from "@prisma/client";

export class ProductRepository {
  /**
   * Obtiene productos paginados de la base de datos, opcionalmente filtrados por una o más categorías.
   */
  async getAllProducts(skip: number = 0, take: number = 20, categories?: string[]): Promise<Product[]> {
    const where = categories && categories.length > 0 ? { categoria: { in: categories } } : {};
    return prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Obtiene el total de productos en la base de datos, opcionalmente filtrados por una o más categorías.
   */
  async getTotalCount(categories?: string[]): Promise<number> {
    const where = categories && categories.length > 0 ? { categoria: { in: categories } } : {};
    return prisma.product.count({ where });
  }

  /**
   * Obtiene un producto por su slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { slug },
    });
  }

  /**
   * Busca productos por coincidencia parcial o total en múltiples campos con paginación, opcionalmente filtrados por una o más categorías.
   */
  async searchProducts(query: string, skip: number = 0, take: number = 20, categories?: string[]): Promise<Product[]> {
    const searchConditions = [
      { name: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { categoria: { contains: query, mode: "insensitive" } },
      { tag: { contains: query, mode: "insensitive" } },
    ];

    const where = categories && categories.length > 0
      ? { AND: [{ OR: searchConditions }, { categoria: { in: categories } }] }
      : { OR: searchConditions };

    return prisma.product.findMany({
      where: where as any,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Obtiene el conteo de resultados para una búsqueda específica, opcionalmente filtrados por una o más categorías.
   */
  async getSearchCount(query: string, categories?: string[]): Promise<number> {
    const searchConditions = [
      { name: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { categoria: { contains: query, mode: "insensitive" } },
      { tag: { contains: query, mode: "insensitive" } },
    ];

    const where = categories && categories.length > 0
      ? { AND: [{ OR: searchConditions }, { categoria: { in: categories } }] }
      : { OR: searchConditions };

    return prisma.product.count({
      where: where as any,
    });
  }

  /**
   * Crea un nuevo producto (solo para seeding o uso interno)
   */
  async createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    return prisma.product.create({
      data,
    });
  }

  /**
   * Obtiene todas las categorías únicas de la tabla de productos.
   */
  async getCategories(): Promise<string[]> {
    const result = await prisma.product.findMany({
      select: { categoria: true },
      distinct: ["categoria"],
      orderBy: { categoria: "asc" },
    });
    return result.map(p => p.categoria).filter(Boolean);
  }
}
