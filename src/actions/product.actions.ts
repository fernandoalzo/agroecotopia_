"use server";

import { ProductService } from "@/services/product.service";
import { Product } from "@prisma/client";

/**
 * Server Action para obtener productos paginados (Catálogo General)
 */
export async function getPaginatedProductsAction(page: number = 1, limit: number = 20): Promise<{ products: Product[], total: number, totalPages: number }> {
  try {
    const result = await ProductService.getCatalog(page, limit);
    return result;
  } catch (error) {
    console.error("Error getting paginated products:", error);
    return { products: [], total: 0, totalPages: 0 };
  }
}

/**
 * Server Action para buscar productos paginados en la base de datos (Búsqueda Nivel 2)
 */
export async function searchProductsAction(query: string, page: number = 1, limit: number = 20): Promise<{ products: Product[], total: number, totalPages: number }> {
  try {
    if (!query || query.trim().length === 0) return { products: [], total: 0, totalPages: 0 };
    
    const result = await ProductService.searchProducts(query, page, limit);
    return result;
  } catch (error) {
    console.error("Error searching products with pagination in DB:", error);
    return { products: [], total: 0, totalPages: 0 };
  }
}
