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
   * Obtiene un producto completo por ID.
   */
  async getProductById(id: string): Promise<any | null> {
    try {
      const product = await this.productRepository.getProductById(id);
      return product ? this.serializeProduct(product) : null;
    } catch (error) {
      log.error(`Error in getProductById ${id}:`, error);
      return null;
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

  async updateStoreProduct(storeId: string, id: string, data: Partial<Product>): Promise<any> {
    try {
      const existingProduct = await this.productRepository.getProductByIdAndStore(id, storeId);
      if (!existingProduct) {
        throw new Error("Producto no encontrado en esta tienda.");
      }

      const updated = await this.productRepository.updateStoreProduct(storeId, id, data);
      return this.serializeProduct(updated);
    } catch (error) {
      log.error("Error updating store product:", { storeId, id, error });
      throw new Error("No se pudo actualizar el producto de esta tienda.");
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

  async deleteStoreProduct(storeId: string, id: string): Promise<boolean> {
    try {
      const existingProduct = await this.productRepository.getProductByIdAndStore(id, storeId);
      if (!existingProduct) {
        throw new Error("Producto no encontrado en esta tienda.");
      }

      await this.productRepository.deleteStoreProduct(storeId, id);
      return true;
    } catch (error) {
      log.error("Error deleting store product:", { storeId, id, error });
      throw new Error("No se pudo eliminar el producto de esta tienda.");
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
  private serializeProduct(product: any) {
    return {
      ...product,
      stock: Number(product.stock),
      promotions: product.promotions?.map((p: any) => ({
        ...p,
        discountValue: Number(p.discountValue),
      })),
      store: product.store ? {
        ...product.store,
        promotions: product.store.promotions?.map((p: any) => ({
          ...p,
          discountValue: Number(p.discountValue),
        }))
      } : undefined
    };
  }
}
