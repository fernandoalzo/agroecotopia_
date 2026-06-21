"use server";

import { productService } from "@/backend/modules/product";
import type { Product } from "@/types";
import { withAdmin } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/product/product.actions.ts");

/**
 * Server Action para obtener productos paginados (Catálogo General con opcional filtro de categoría)
 */
export async function getPaginatedProductsAction(
  page: number = 1,
  limit: number = 20,
  category?: string,
  storeId?: string
): Promise<{ products: Product[], total: number, totalPages: number }> {
  try {
    const result = await productService.getCatalog(page, limit, category, storeId);
    return result as any;
  } catch (error) {
    log.error("Error getting paginated products:", error);
    return { products: [], total: 0, totalPages: 0 };
  }
}

/**
 * Server Action para buscar productos paginados en la base de datos con opcional filtro de categoría
 */
export async function searchProductsAction(
  query: string,
  page: number = 1,
  limit: number = 20,
  category?: string,
  storeId?: string
): Promise<{ products: Product[], total: number, totalPages: number }> {
  try {
    if (!query || query.trim().length === 0) return { products: [], total: 0, totalPages: 0 };
    
    const result = await productService.searchProducts(query, page, limit, category, storeId);
    return result as any;
  } catch (error) {
    log.error("Error searching products with pagination in DB:", error);
    return { products: [], total: 0, totalPages: 0 };
  }
}

/**
 * Server Action para obtener todas las categorías únicas
 */
export async function getCategoriesAction(): Promise<string[]> {
  try {
    return await productService.getCategories();
  } catch (error) {
    log.error("Error getting categories:", error);
    return [];
  }
}

/**
 * Server Action para obtener el conteo de productos por categoría
 */
export async function getCategoryCountsAction(storeId?: string): Promise<Record<string, number>> {
  try {
    return await productService.getCategoryCounts(storeId);
  } catch (error) {
    log.error("Error getting category counts:", error);
    return {};
  }
}

/**
 * Server Action para obtener un producto completo por ID.
 */
export async function getProductByIdAction(productId: string) {
  try {
    if (!productId) return null;
    return await productService.getProductById(productId);
  } catch (error) {
    log.error("Error getting product by id:", error);
    return null;
  }
}

/**
 * Server Action para obtener productos relacionados a un producto dado.
 * Usa búsqueda semántica vía embeddings (Ollama + pgvector).
 */
export async function getRelatedProductsAction(productId: string, limit?: number) {
  try {
    if (!productId) return [];
    return await productService.getRelatedProducts(productId, limit);
  } catch (error) {
    log.error("Error getting related products:", error);
    return [];
  }
}

/**
 * Server Action: Create a product (ADMIN ONLY)
 */
export async function createProductAction(data: any) {
  return withAdmin(async () => {
    log.info(`Admin creating product: ${data.name}`);
    
    try {
      const newProduct = await productService.createProduct(data);
      
      // Revalidate UI
      revalidatePath("/admin/dashboard");
      revalidatePath("/productos");
      
      return { success: true, message: "Producto creado correctamente.", product: newProduct };
    } catch (error: any) {
      log.error(`Error in createProductAction for ${data.name}:`, error);
      return { success: false, message: error.message || "Error al crear el producto." };
    }
  });
}

/**
 * Server Action: Update a product (ADMIN ONLY)
 */
export async function updateProductAction(id: string, data: Partial<Product>) {
  return withAdmin(async () => {
    log.info(`Admin updating product: ${id}`);
    
    try {
      const updatedProduct = await productService.updateProduct(id, data);
      
      // Revalidate UI
      revalidatePath("/admin/dashboard");
      revalidatePath("/productos");
      
      return { success: true, message: "Producto actualizado correctamente.", product: updatedProduct };
    } catch (error: any) {
      log.error(`Error in updateProductAction for ${id}:`, error);
      return { success: false, message: error.message || "Error al actualizar el producto." };
    }
  });
}

/**
 * Server Action: Delete a product (ADMIN ONLY)
 * Demonstrates the use of the new RBAC guards as an alternative to middleware.
 */
export async function deleteProductAction(productId: string) {
  return withAdmin(async () => {
    log.info(`Admin deleting product: ${productId}`);
    
    try {
      await productService.deleteProduct(productId);
      
      // Revalidate UI
      revalidatePath("/admin/dashboard");
      revalidatePath("/productos");
      
      return { success: true, message: "Producto eliminado correctamente." };
    } catch (error: any) {
      log.error(`Error in deleteProductAction for ${productId}:`, error);
      return { success: false, message: error.message || "Error al eliminar el producto." };
    }
  });
}

// --- Seller Actions ---

import { withStoreOwner } from "@/lib/auth-guards";

export async function createStoreProductAction(storeId: string, data: any) {
  return withStoreOwner(storeId, async () => {
    log.info(`Seller creating product in store ${storeId}`);
    try {
      const newProduct = await productService.createStoreProduct(storeId, data);
      revalidatePath(`/mi-tienda/${storeId}/productos`);
      revalidatePath("/productos");
      return { success: true, message: "Producto creado correctamente.", product: newProduct };
    } catch (error: any) {
      log.error(`Error in createStoreProductAction:`, error);
      return { success: false, message: error.message || "Error al crear el producto." };
    }
  });
}

export async function updateStoreProductAction(storeId: string, productId: string, data: Partial<Product>) {
  return withStoreOwner(storeId, async () => {
    log.info(`Seller updating product ${productId} in store ${storeId}`);
    try {
      const updatedProduct = await productService.updateStoreProduct(storeId, productId, data);
      revalidatePath(`/mi-tienda/${storeId}/productos`);
      revalidatePath("/productos");
      return { success: true, message: "Producto actualizado correctamente.", product: updatedProduct };
    } catch (error: any) {
      log.error(`Error in updateStoreProductAction:`, error);
      return { success: false, message: error.message || "Error al actualizar el producto." };
    }
  });
}

export async function deleteStoreProductAction(storeId: string, productId: string) {
  return withStoreOwner(storeId, async () => {
    log.info(`Seller deleting product ${productId} in store ${storeId}`);
    try {
      await productService.deleteStoreProduct(storeId, productId);
      revalidatePath(`/mi-tienda/${storeId}/productos`);
      revalidatePath("/productos");
      return { success: true, message: "Producto eliminado correctamente." };
    } catch (error: any) {
      log.error(`Error in deleteStoreProductAction:`, error);
      return { success: false, message: error.message || "Error al eliminar el producto." };
    }
  });
}

export async function generateProductEmbeddingsAction() {
  return withAdmin(async () => {
    try {
      const result = await productService.generateAllEmbeddings();
      const stats = await productService.getEmbeddingStats();
      log.info("🤖 [Action] Embeddings generados:", result);
      revalidatePath("/admin/productos");
      return { success: true, data: { ...result, total: stats?.total ?? 0 } };
    } catch (error) {
      log.error("🤖 [Action] Error generando embeddings:", error);
      return { success: false, error: "Error al generar embeddings" };
    }
  });
}

export async function getEmbeddingStatsAction() {
  try {
    const stats = await productService.getEmbeddingStats();
    return { success: true, data: stats ?? undefined };
  } catch (error) {
    log.error("Error obteniendo estadísticas de embeddings:", error);
    return { success: false, error: "Error al obtener estadísticas" };
  }
}

export async function getStoreProductsAction(storeId: string, page: number = 1, limit: number = 20) {
  return withStoreOwner(storeId, async () => {
    log.info(`Action: getStoreProductsAction`, { storeId, page });
    try {
      return await productService.getStoreProducts(storeId, page, limit);
    } catch (error) {
      log.error("Error getting store products:", error);
      return { products: [], total: 0, totalPages: 0 };
    }
  });
}

/**
 * Datos combinados de la página de productos: categorías + conteos + catálogo
 * en UNA sola Server Action. Reemplaza 3 llamadas secuenciales del cliente.
 */
export async function getProductsPageDataAction(
  page: number = 1,
  limit: number = 20,
  category?: string,
  storeId?: string
) {
  try {
    log.info(`Action: getProductsPageDataAction`, { page, limit, category, storeId });

    const [productsResult, availableCategories, categoryCounts] = await Promise.all([
      productService.getCatalog(page, limit, category, storeId),
      productService.getCategories(),
      productService.getCategoryCounts(storeId),
    ]);

    return { productsResult, availableCategories, categoryCounts };
  } catch (error) {
    log.error("Error getting products page data:", error);
    return {
      productsResult: { products: [], total: 0, totalPages: 0 },
      availableCategories: [],
      categoryCounts: {},
    };
  }
}
