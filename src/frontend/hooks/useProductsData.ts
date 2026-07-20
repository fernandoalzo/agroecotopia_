import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getCategoriesAction,
  getCategoryCountsAction,
  getPaginatedProductsAction,
  searchProductsAction,
} from "@/backend/modules/product/product.actions";

interface UseProductsDataParams {
  q: string;
  page: number;
  limit: number;
  category: string;
}

export function useProductsData({ q, page, limit, category }: UseProductsDataParams) {
  const categoriesQuery = useQuery({
    queryKey: ["products", "categories"],
    queryFn: () => getCategoriesAction(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const categoryCountsQuery = useQuery({
    queryKey: ["products", "categoryCounts"],
    queryFn: () => getCategoryCountsAction(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const productsQuery = useQuery({
    queryKey: ["products", "list", q, String(page), String(limit), category],
    queryFn: async () => {
      const cats = category ? category.split(",").filter(Boolean) : [];
      const catStr = cats.length > 0 ? cats.join(",") : undefined;
      if (q.trim()) {
        return searchProductsAction(q.trim(), page, limit, catStr);
      }
      return getPaginatedProductsAction(page, limit, catStr);
    },
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  return {
    categories: categoriesQuery.data ?? [],
    categoryCounts: categoryCountsQuery.data ?? {} as Record<string, number>,
    products: productsQuery.data?.products ?? [],
    total: productsQuery.data?.total ?? 0,
    totalPages: productsQuery.data?.totalPages ?? 0,
    isPending: productsQuery.isPending,
    isFetching: productsQuery.isFetching,
  };
}
