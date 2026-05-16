import type { Product } from "@prisma/client";
import { ProductRepository } from "./product.repository";

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  /**
   * Obtiene la colección paginada de productos para el catálogo
   */
  async getCatalog(page: number = 1, limit: number = 20): Promise<{ products: Product[], total: number, totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const [products, total] = await Promise.all([
        this.productRepository.getAllProducts(skip, limit),
        this.productRepository.getTotalCount()
      ]);
      
      return {
        products,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error("Error in getCatalog (Database connection likely failed):", error);
      return { products: [], total: 0, totalPages: 0 };
    }
  }

  /**
   * Realiza la búsqueda paginada de productos en la base de datos
   */
  async searchProducts(query: string, page: number = 1, limit: number = 20): Promise<{ products: Product[], total: number, totalPages: number }> {
    if (!query || query.trim().length === 0) return { products: [], total: 0, totalPages: 0 };
    
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.productRepository.searchProducts(query, skip, limit),
      this.productRepository.getSearchCount(query)
    ]);

    return {
      products,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }
}
