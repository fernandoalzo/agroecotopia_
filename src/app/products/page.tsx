import { ProductService } from "@/services/product.service";
import ProductsPageClient from "./ProductsPageClient";

export default async function ProductsServerPage() {
  const products = await ProductService.getCatalog();

  return <ProductsPageClient products={products} />;
}
