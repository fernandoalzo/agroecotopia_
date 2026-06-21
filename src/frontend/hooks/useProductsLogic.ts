import { useState, useEffect } from "react";
import type { Product } from "@/types";
import { toast } from "sonner";
import logger from "@/utils/logger";

const log = logger.child();

type ProductsPageData = {
  productsResult: { products: any[]; total: number; totalPages: number };
  availableCategories: string[];
  categoryCounts: Record<string, number>;
};

type ProductLogicDependencies = {
  getCategoriesAction: () => Promise<string[]>;
  getAllActiveStoresListAction: () => Promise<{ id: string; name: string }[] | { error: string }>;
  getCategoryCountsAction: (storeId?: string) => Promise<Record<string, number>>;
  getPaginatedProductsAction: (page: number, limit: number, category?: string, storeId?: string) => Promise<any>;
  searchProductsAction: (query: string, page: number, limit: number, category?: string, storeId?: string) => Promise<any>;
  getProductsPageDataAction: (page: number, limit: number, category?: string, storeId?: string) => Promise<ProductsPageData>;
  createProductAction: (payload: any) => Promise<any>;
  createStoreProductAction: (storeId: string, payload: any) => Promise<any>;
  updateProductAction: (productId: string, payload: any) => Promise<any>;
  updateStoreProductAction: (storeId: string, productId: string, payload: any) => Promise<any>;
  deleteProductAction: (productId: string) => Promise<any>;
  deleteStoreProductAction: (storeId: string, productId: string) => Promise<any>;
  generateDescriptionAction?: (name: string, categories: string[], tags: string) => Promise<any>;
};

export function useProductsLogic(
  storeId?: string,
  enabled = true,
  deps?: Partial<ProductLogicDependencies>
) {
  const {
    getCategoriesAction,
    getAllActiveStoresListAction,
    getCategoryCountsAction,
    getPaginatedProductsAction,
    searchProductsAction,
    getProductsPageDataAction,
    createProductAction,
    createStoreProductAction,
    updateProductAction,
    updateStoreProductAction,
    deleteProductAction,
    deleteStoreProductAction,
    generateDescriptionAction,
  } = deps || {};
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [categoryFilter, setCategoryFilter] = useState<string | "ALL">("ALL");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(10);

  // Categories and Stores Lists
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [storesList, setStoresList] = useState<{id: string, name: string}[]>([]);

  const reload = () => setRefreshTrigger(prev => prev + 1);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page to 1 when filters or limit change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, debouncedSearch, limit]);

  // Combined initial data + products (usado cuando getProductsPageDataAction está disponible)
  useEffect(() => {
    if (!enabled) return;

    // Categorías y stores (bootstrap, solo cuando NO tenemos la acción combinada)
    if (!getProductsPageDataAction) {
      if (getCategoriesAction) {
        getCategoriesAction().then(setAvailableCategories).catch(log.error);
      }
      if (!storeId) {
        if (getAllActiveStoresListAction) {
          getAllActiveStoresListAction().then(res => {
            if (Array.isArray(res)) setStoresList(res);
            else log.error("Failed to load stores list", res);
          }).catch(log.error);
        }
      }
    }
  }, [storeId, enabled]);

  // Category counts (fallback cuando NO tenemos getProductsPageDataAction)
  useEffect(() => {
    if (!enabled || getProductsPageDataAction) return;
    if (getCategoryCountsAction) {
      getCategoryCountsAction(storeId).then(setCategoryCounts).catch(log.error);
    }
  }, [refreshTrigger, storeId, enabled]);

  // Fetch paginated products (y datos combinados si está disponible)
  useEffect(() => {
    if (!enabled) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const catFilter = categoryFilter === "ALL" ? undefined : categoryFilter;

        if (getProductsPageDataAction && !debouncedSearch.trim()) {
          // Acción combinada: categorías + conteos + productos en paralelo
          const result = await getProductsPageDataAction(currentPage, limit, catFilter, storeId);
          if (result) {
            const { productsResult, availableCategories: cats, categoryCounts: counts } = result;
            if (productsResult && "products" in productsResult) {
              setProducts(productsResult.products as Product[]);
              setTotalPages(productsResult.totalPages);
              setTotalCount(productsResult.total);
            }
            if (Array.isArray(cats)) setAvailableCategories(cats);
            if (counts) setCategoryCounts(counts);
          }
        } else if (debouncedSearch.trim() !== "") {
          const result = await searchProductsAction?.(debouncedSearch, currentPage, limit, catFilter, storeId);
          if (result && "products" in result) {
            setProducts(result.products as Product[]);
            setTotalPages(result.totalPages);
            setTotalCount(result.total);
          }
        } else {
          const result = await getPaginatedProductsAction?.(currentPage, limit, catFilter, storeId);
          if (result && "products" in result) {
            setProducts(result.products as Product[]);
            setTotalPages(result.totalPages);
            setTotalCount(result.total);
          }
        }
      } catch (error) {
        log.error("Error fetching paginated products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, categoryFilter, debouncedSearch, limit, refreshTrigger, storeId, enabled]);

  // Handlers
  const handleCreateProduct = async (payload: any, targetStoreId?: string) => {
    try {
      let result;
      if (targetStoreId) {
          result = await createStoreProductAction?.(targetStoreId, payload);
        } else {
          result = await createProductAction?.(payload);
        }

      if (result && "error" in result) {
        toast.error(result.error || "Error al crear el producto");
        return false;
      }

      if (result && result.success) {
        toast.success(result.message || "Producto creado con éxito");
        reload();
        return true;
      } else {
        toast.error(result?.message || "Error al crear el producto");
        return false;
      }
    } catch (error) {
      log.error("Error creating product:", error);
      toast.error("Ocurrió un error inesperado al crear el producto.");
      return false;
    }
  };

  const handleUpdateProduct = async (productId: string, payload: any) => {
    try {
      let result;
      if (storeId) {
        result = await updateStoreProductAction?.(storeId, productId, payload);
        } else {
        result = await updateProductAction?.(productId, payload);
        }
      
      if (result && "error" in result) {
        toast.error(result.error || "Error al actualizar el producto");
        return false;
      }
      
      if (result && result.success) {
        toast.success(result.message || "Producto actualizado con éxito");
        reload();
        return true;
      } else {
        toast.error(result?.message || "Error al actualizar el producto");
        return false;
      }
    } catch (error) {
      log.error("Error updating product:", error);
      toast.error("Ocurrió un error inesperado al actualizar.");
      return false;
    }
  };

  const handleGenerateDescription = async (name: string, categories: string[], tags: string) => {
    if (!generateDescriptionAction) {
      throw new Error("Generación de descripciones no disponible.");
    }
    const result = await generateDescriptionAction(name, categories, tags);
    if (result && "error" in result) {
      throw new Error(result.error);
    }
    return result.description as string;
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      let result;
      if (storeId) {
        result = await deleteStoreProductAction?.(storeId, productId);
        } else {
        result = await deleteProductAction?.(productId);
        }
      if (result && "error" in result) {
        toast.error(result.error || "Error al eliminar el producto");
        return false;
      }

      if (result && result.success) {
        toast.success(result.message || "Producto eliminado con éxito");
        reload();
        return true;
      } else {
        toast.error(result?.message || "Error al eliminar el producto");
        return false;
      }
    } catch (error) {
      log.error("Error deleting product:", error);
      toast.error("Ocurrió un error inesperado al eliminar.");
      return false;
    }
  };

  return {
    state: {
      products,
      loading,
      categoryCounts,
      categoryFilter,
      searchQuery,
      debouncedSearch,
      currentPage,
      totalPages,
      totalCount,
      limit,
      availableCategories,
      storesList
    },
    actions: {
      setCategoryFilter,
      setSearchQuery,
      setCurrentPage,
      setLimit,
      handleCreateProduct,
      handleUpdateProduct,
      handleDeleteProduct,
      handleGenerateDescription,
      reload
    }
  };
}
