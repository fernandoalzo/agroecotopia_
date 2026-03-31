import { ProductRepository } from "@/repositories/product.repository";
import type { Product } from "@prisma/client";

export class ProductService {
  /**
   * Obtiene la colección paginada de productos para el catálogo
   */
  static async getCatalog(page: number = 1, limit: number = 20): Promise<{ products: Product[], total: number, totalPages: number }> {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      ProductRepository.getAllProducts(skip, limit),
      ProductRepository.getTotalCount()
    ]);
    
    return {
      products,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Realiza la búsqueda paginada de productos en la base de datos
   */
  static async searchProducts(query: string, page: number = 1, limit: number = 20): Promise<{ products: Product[], total: number, totalPages: number }> {
    if (!query || query.trim().length === 0) return { products: [], total: 0, totalPages: 0 };
    
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      ProductRepository.searchProducts(query, skip, limit),
      ProductRepository.getSearchCount(query)
    ]);

    return {
      products,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }
}
