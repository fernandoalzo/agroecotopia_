import type { Product } from "@prisma/client";
import { ProductRepository } from "./product.repository";
import { ProductEmbeddingService } from "./productEmbedding.service";
import { CacheKeys } from "@/backend/cache";
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

  groupByCategory(products: any[]): Array<{ label: string; products: any[] }> {
    const groups = new Map<string, any[]>();
    for (const p of products) {
      const cats = ((p.categories || []) as Array<{ name: string }>).map((c: any) => c?.name).filter(Boolean);
      const key = cats.length > 0 ? cats[0] : "Otros";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return Array.from(groups.entries()).map(([label, prods]) => ({ label, products: prods }));
  }

  async searchProducts(query: string, page: number = 1, limit: number = 20, category?: string, storeId?: string): Promise<{ products: any[], total: number, totalPages: number }> {
    try {
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
    } catch (error) {
      log.error("Error en búsqueda de productos, retornando vacío:", error);
      return { products: [], total: 0, totalPages: 0 };
    }
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

  async getRelatedProducts(productId: string, limit: number = 6): Promise<any[]> {
    try {
      const product = await this.productRepository.getProductById(productId);
      if (!product) return [];

      const categories = ((product as any).categories as Array<{ name: string }> | undefined)?.map(c => c.name) || [];

      const relatedIds = await this.productRepository.getOrSetIds(
        CacheKeys.product.related(productId),
        async () => {
          // Tier 1: embedding-based semantic search
          if (this.embeddingService) {
            try {
              const queryText = [
                `Producto: ${product.name}`,
                categories.length ? `Categorías: ${categories.join(", ")}` : "",
                `Tipo: ${product.tag}`,
                `Descripción: ${product.description}`,
              ].filter(Boolean).join("\n");

              const similar = await this.embeddingService.searchSimilar(
                queryText, limit + 1, undefined,
                categories.length > 0 ? categories : undefined,
              );
              const ids = similar.filter(r => r.id !== productId).slice(0, limit).map(r => r.id);
              if (ids.length > 0) return ids;
              log.warn("Embedding search returned 0 results, falling back");
            } catch (error) {
              log.warn("Embedding search failed, falling back to categories:", error);
            }
          }

          // Tier 2: category-based
          if (categories.length > 0) {
            const allWithCategory = await this.productRepository.getAllProducts(0, limit + 1, categories);
            const ids = allWithCategory.filter(p => p.id !== productId).slice(0, limit).map(p => p.id);
            if (ids.length > 0) return ids;
          }

          // Tier 3: latest products
          const latest = await this.productRepository.getAllProducts(0, limit);
          return latest.filter(p => p.id !== productId).slice(0, limit).map(p => p.id);
        },
      );

      if (relatedIds.length === 0) return [];
      const products = await this.productRepository.getProductsByIds(relatedIds);
      return products.map(p => this.serializeProduct(p));
    } catch (error) {
      log.warn("🤖 [Related] Error obteniendo productos relacionados:", { productId, error });
      return [];
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
