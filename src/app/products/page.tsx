import { ProductService } from "@/services/product.service";
import ProductsPageClient from "./ProductsPageClient";

export default async function ProductsServerPage(props: {
  searchParams: Promise<{ q?: string; page?: string; limit?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 20;

  // Decide if we call search or general catalog based on presence of query
  let initialData;
  if (query.trim()) {
    initialData = await ProductService.searchProducts(query, page, limit);
  } else {
    initialData = await ProductService.getCatalog(page, limit);
  }

  return <ProductsPageClient initialData={initialData} />;
}
