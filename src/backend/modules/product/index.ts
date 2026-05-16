import { ProductRepository } from "./product.repository";
import { ProductService } from "./product.service";

export const productRepository = new ProductRepository();
export const productService = new ProductService(productRepository);
