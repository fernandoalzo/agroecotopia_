import prisma from "@/db/prisma";
import type { Product } from "@prisma/client";

export class ProductRepository {
  /**
   * Obtiene productos paginados de la base de datos
   */
  static async getAllProducts(skip: number = 0, take: number = 20): Promise<Product[]> {
    return prisma.product.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Obtiene el total de productos en la base de datos
   */
  static async getTotalCount(): Promise<number> {
    return prisma.product.count();
  }

  /**
   * Obtiene un producto por su slug
   */
  static async getProductBySlug(slug: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { slug },
    });
  }

  /**
   * Busca productos por coincidencia parcial o total en múltiples campos con paginación.
   */
  static async searchProducts(query: string, skip: number = 0, take: number = 20): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { categoria: { contains: query, mode: "insensitive" } },
          { tag: { contains: query, mode: "insensitive" } },
        ],
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Obtiene el conteo de resultados para una búsqueda específica
   */
  static async getSearchCount(query: string): Promise<number> {
    return prisma.product.count({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { categoria: { contains: query, mode: "insensitive" } },
          { tag: { contains: query, mode: "insensitive" } },
        ],
      },
    });
  }

  /**
   * Crea un nuevo producto (solo para seeding o uso interno)
   */
  static async createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    return prisma.product.create({
      data,
    });
  }
}
