import { productService } from "@/backend/modules/product";
import ProductsPageClient from "./ProductsPageClient";

export default async function ProductsServerPage(props: {
  searchParams: Promise<{ q?: string; page?: string; limit?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 20;
  const category = searchParams.category || "";

  // Fetch unique categories and products with category filtering in parallel
  const [categories, initialData] = await Promise.all([
    productService.getCategories(),
    query.trim()
      ? productService.searchProducts(query, page, limit, category)
      : productService.getCatalog(page, limit, category)
  ]);

  return (
    <ProductsPageClient 
      initialData={initialData} 
      categories={categories} 
      selectedCategory={category} 
    />
  );
}
