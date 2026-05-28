import {
  getPaginatedProductsAction,
  searchProductsAction,
  getCategoriesAction,
  getCategoryCountsAction,
} from "@/backend/modules/product/product.actions";
import ProductsPageClient from "./ProductsPageClient";
import logger from "@/utils/logger";

const log = logger.child("src/app/products/page.tsx");

export default async function ProductsServerPage(props: {
  searchParams: Promise<{ q?: string; page?: string; limit?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 20;
  const category = searchParams.category || "";

  log.info("Renderizando catálogo de productos (ProductsServerPage):", { query, page, limit, category });

  // Fetch unique categories, category counts and products in parallel
  const [categories, categoryCounts, initialData] = await Promise.all([
    getCategoriesAction(),
    getCategoryCountsAction(),
    query.trim()
      ? (async () => {
          log.debug("Catálogo de productos: realizando búsqueda de texto:", { query, page, limit, category });
          return searchProductsAction(query, page, limit, category);
        })()
      : (async () => {
          log.debug("Catálogo de productos: cargando catálogo completo:", { page, limit, category });
          return getPaginatedProductsAction(page, limit, category);
        })()
  ]);

  log.debug("Catálogo de productos: datos cargados exitosamente.", {
    categoriesCount: categories.length,
    productsReturned: initialData?.products?.length,
    totalProducts: initialData?.total,
    totalPages: initialData?.totalPages,
    categoryCounts
  });

  return (
    <ProductsPageClient 
      initialData={initialData} 
      categories={categories} 
      categoryCounts={categoryCounts}
      selectedCategory={category} 
    />
  );
}
