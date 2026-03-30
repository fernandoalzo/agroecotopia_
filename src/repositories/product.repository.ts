import prisma from "@/db/prisma";
import type { Product } from "@prisma/client";

export class ProductRepository {
  /**
   * Obtiene todos los productos de la base de datos
   */
  static async getAllProducts(): Promise<Product[]> {
    return prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
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
   * Crea un nuevo producto (solo para seeding o uso interno)
   */
  static async createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    return prisma.product.create({
      data,
    });
  }
}
