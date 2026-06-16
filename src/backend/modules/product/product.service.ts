import type { Product } from "@prisma/client";
import { ProductRepository } from "./product.repository";
import { ProductEmbeddingService } from "./productEmbedding.service";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/product/product.service.ts");

export class ProductService {
  constructor(
    private productRepository: ProductRepository,
    private embeddingService?: ProductEmbeddingService,
  ) {}

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

  async searchProducts(query: string, page: number = 1, limit: number = 20, category?: string, storeId?: string): Promise<{ products: any[], total: number, totalPages: number }> {
    if (!query || query.trim().length === 0) return { products: [], total: 0, totalPages: 0 };
    
    const categories = category ? category.split(",").filter(Boolean) : [];

    if (this.embeddingService && config.ai.features.semanticSearch) {
      try {
        const similar = await this.embeddingService.searchSimilar(query, 200, storeId, categories.length > 0 ? categories : undefined);
        if (similar.length > 0) {
          const productIds = similar.map(s => s.id);
          const products = await this.productRepository.getProductsByIds(productIds, categories);
          const total = products.length;
          const skip = (page - 1) * limit;
          return {
            products: products.slice(skip, skip + limit).map(p => this.serializeProduct(p)),
            total,
            totalPages: Math.ceil(total / limit),
          };
        }
      } catch (error) {
        log.warn("Búsqueda semántica falló, usando fallback textual:", error);
      }
    }

    const skip = (page - 1) * limit;

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

  async createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<any> {
    try {
      const created = await this.productRepository.createProduct(data);
      this.generateEmbeddingAsync(created);
      return this.serializeProduct(created);
    } catch (error: any) {
      log.error(`Error creating product:`, error);
      throw new Error("No se pudo crear el producto. Verifique los datos ingresados.");
    }
  }

  async createStoreProduct(storeId: string, data: Omit<Product, "id" | "createdAt" | "updatedAt" | "storeId" | "store">): Promise<any> {
    try {
      log.info(`Creando producto para tienda ${storeId}`);
      const created = await this.productRepository.createProduct({ ...data, storeId });
      this.generateEmbeddingAsync(created);
      return this.serializeProduct(created);
    } catch (error: any) {
      log.error(`Error creating store product:`, error);
      throw new Error("No se pudo crear el producto. Verifique los datos ingresados.");
    }
  }

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

  async getProductById(id: string): Promise<any | null> {
    try {
      const product = await this.productRepository.getProductById(id);
      return product ? this.serializeProduct(product) : null;
    } catch (error) {
      log.error(`Error in getProductById ${id}:`, error);
      return null;
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      return await this.productRepository.getCategories();
    } catch (error) {
      log.error("Error in getCategories:", error);
      return [];
    }
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<any> {
    try {
      const updateData = { ...data };
      
      const updated = await this.productRepository.updateProduct(id, updateData);
      this.generateEmbeddingAsync(updated);
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
      this.generateEmbeddingAsync(updated);
      return this.serializeProduct(updated);
    } catch (error) {
      log.error("Error updating store product:", { storeId, id, error });
      throw new Error("No se pudo actualizar el producto de esta tienda.");
    }
  }

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

  async getCategoryCounts(storeId?: string): Promise<Record<string, number>> {
    try {
      return await this.productRepository.getCategoryCounts(storeId);
    } catch (error) {
      log.error("Error in getCategoryCounts:", error);
      return {};
    }
  }

  async getEmbeddingStats() {
    if (!this.embeddingService) return null;
    return this.embeddingService.getStats();
  }

  async generateAllEmbeddings(): Promise<{ success: number; failed: number; skipped: number }> {
    if (!this.embeddingService) return { success: 0, failed: 0, skipped: 0 };
    return this.embeddingService.generateAll();
  }

  private generateEmbeddingAsync(product: any): void {
    if (!this.embeddingService || !product?.id) return;
    this.embeddingService.generateForProduct({
      id: product.id,
      name: product.name || "",
      description: product.description || "",
      tag: product.tag || "",
      categories: product.categories,
    }).catch((err) => {
      log.warn("🤖 [Embedding] Error async al generar embedding (no crítico):", err);
    });
  }

  private serializeProduct(product: any) {
    return {
      ...product,
      stock: Number(product.stock),
      peso: product.peso ? Number(product.peso) : null,
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
