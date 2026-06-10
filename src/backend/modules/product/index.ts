import { ProductRepository } from "./product.repository";
import { ProductService } from "./product.service";
import { CacheService } from "@/backend/cache";

const cacheService = new CacheService();

export const productRepository = new ProductRepository(cacheService);
export const productService = new ProductService(productRepository);
