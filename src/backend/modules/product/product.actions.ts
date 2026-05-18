"use server";

import { productService } from "@/backend/modules/product";
import { Product } from "@prisma/client";
import { withAdmin } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";

/**
 * Server Action para obtener productos paginados (Catálogo General con opcional filtro de categoría)
 */
export async function getPaginatedProductsAction(
  page: number = 1,
  limit: number = 20,
  category?: string
): Promise<{ products: Product[], total: number, totalPages: number }> {
  try {
    const result = await productService.getCatalog(page, limit, category);
    return result as any;
  } catch (error) {
    console.error("Error getting paginated products:", error);
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
  category?: string
): Promise<{ products: Product[], total: number, totalPages: number }> {
  try {
    if (!query || query.trim().length === 0) return { products: [], total: 0, totalPages: 0 };
    
    const result = await productService.searchProducts(query, page, limit, category);
    return result as any;
  } catch (error) {
    console.error("Error searching products with pagination in DB:", error);
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
    console.error("Error getting categories:", error);
    return [];
  }
}

/**
 * Server Action: Delete a product (ADMIN ONLY)
 * Demonstrates the use of the new RBAC guards as an alternative to middleware.
 */
export async function deleteProductAction(productId: string) {
  return withAdmin(async () => {
    // 1. Perform admin logic safely
    console.log(`Admin deleting product: ${productId}`);
    
    // Example: await productService.delete(productId);
    
    // 2. Revalidate UI
    revalidatePath("/products");
    
    return { success: true, message: "Producto eliminado correctamente." };
  });
}
