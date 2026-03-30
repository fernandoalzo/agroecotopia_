import { ProductRepository } from "@/repositories/product.repository";
import type { Product } from "@prisma/client";

export class ProductService {
  /**
   * Obtiene la colección completa de productos procesados para la vista pública (Catálogo)
   */
  static async getCatalog(): Promise<Product[]> {
    // Si la regla de negocio dicta que "todos los productos están activos", pasamos directo.
    // Aquí a futuro se añadiría filtrado (ej. solo activos, aplicar descuento).
    const products = await ProductRepository.getAllProducts();
    
    // Devolvemos la data cruda desde base de datos hacia los Controladores
    return products;
  }
}
