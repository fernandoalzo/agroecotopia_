import type { Product } from "@prisma/client";
import { ProductRepository } from "./product.repository";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/product/product.service.ts");

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  /**
   * Obtiene la colección paginada de productos para el catálogo, opcionalmente filtrados por categorías (como string de comas).
   */
  async getCatalog(page: number = 1, limit: number = 20, category?: string, storeId?: string): Promise<{ products: any[], total: number, totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const categories = category ? category.split(",").filter(Boolean) : [];
      
      const [products, total] = await Promise.all([
        this.productRepository.getAllProducts(skip, limit, categories, storeId),
        this.productRepository.getTotalCount(categories, storeId)
      ]);
      
      return {
        products: products.map(p => this.serializeProduct(p)),
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      log.error("Error in getCatalog (Database connection likely failed):", error);
      return { products: [], total: 0, totalPages: 0 };
    }
  }

  /**
   * Realiza la búsqueda paginada de productos en la base de datos, opcionalmente filtrados por categorías (como string de comas).
   */
  async searchProducts(query: string, page: number = 1, limit: number = 20, category?: string, storeId?: string): Promise<{ products: any[], total: number, totalPages: number }> {
    if (!query || query.trim().length === 0) return { products: [], total: 0, totalPages: 0 };
    
    const skip = (page - 1) * limit;
    const categories = category ? category.split(",").filter(Boolean) : [];

    const [products, total] = await Promise.all([
      this.productRepository.searchProducts(query, skip, limit, categories, storeId),
      this.productRepository.getSearchCount(query, categories, storeId)
    ]);

    return {
      products: products.map(p => this.serializeProduct(p)),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Crea un nuevo producto en la base de datos (Admin).
   */
  async createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<any> {
    try {
      const created = await this.productRepository.createProduct(data);
      return this.serializeProduct(created);
    } catch (error: any) {
      log.error(`Error creating product:`, error);
      throw new Error("No se pudo crear el producto. Verifique los datos ingresados.");
    }
  }

  /**
   * Crea un nuevo producto vinculado a una tienda.
   */
  async createStoreProduct(storeId: string, data: Omit<Product, "id" | "createdAt" | "updatedAt" | "storeId" | "store">): Promise<any> {
    try {
      log.info(`Creando producto para tienda ${storeId}`);
      // The auth guard ensures the user owns this store or is admin
      const created = await this.productRepository.createProduct({ ...data, storeId });
      return this.serializeProduct(created);
    } catch (error: any) {
      log.error(`Error creating store product:`, error);
      throw new Error("No se pudo crear el producto. Verifique los datos ingresados.");
    }
  }

  /**
   * Obtiene los productos de una tienda paginados.
   */
  async getStoreProducts(storeId: string, page: number = 1, limit: number = 20): Promise<{ products: any[], total: number, totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      
      const [products, total] = await Promise.all([
        this.productRepository.getProductsByStore(storeId, skip, limit),
        this.productRepository.getProductCountByStore(storeId)
      ]);
      
      return {
        products: products.map(p => this.serializeProduct(p)),
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      log.error("Error in getStoreProducts:", error);
      return { products: [], total: 0, totalPages: 0 };
    }
  }

  /**
   * Obtiene todas las categorías únicas de la base de datos.
   */
  async getCategories(): Promise<string[]> {
    try {
      return await this.productRepository.getCategories();
    } catch (error) {
      log.error("Error in getCategories:", error);
      return [];
    }
  }

  /**
   * Actualiza un producto existente en la base de datos.
   */
  async updateProduct(id: string, data: Partial<Product>): Promise<any> {
    try {
      // Data pre-processing if necessary (e.g. converting stock to Decimal if passed as number)
      const updateData = { ...data };
      
      const updated = await this.productRepository.updateProduct(id, updateData);
      return this.serializeProduct(updated);
    } catch (error) {
      log.error(`Error updating product ${id}:`, error);
      throw new Error("No se pudo actualizar el producto. Verifique los datos ingresados.");
    }
  }

  /**
   * Elimina un producto de la base de datos.
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.productRepository.deleteProduct(id);
      return true;
    } catch (error) {
      throw new Error("No se pudo eliminar el producto. Puede que esté asociado a pedidos existentes.");
    }
  }

  /**
   * Obtiene el conteo de productos por cada categoría.
   */
  async getCategoryCounts(storeId?: string): Promise<Record<string, number>> {
    try {
      return await this.productRepository.getCategoryCounts(storeId);
    } catch (error) {
      log.error("Error in getCategoryCounts:", error);
      return {};
    }
  }

  /**
   * Convierte objetos Decimal de Prisma a numbers para que sean serializables
   */
  private serializeProduct(product: Product) {
    return {
      ...product,
      stock: Number(product.stock),
    };
  }
}
