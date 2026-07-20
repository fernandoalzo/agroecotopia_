"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { useProductsData } from "@/hooks/useProductsData";
import { ProductsPageSkeleton } from "@/components/products/ProductsPageSkeleton";

// Modular Components
import { ProductsHeader } from "@/components/products/ProductsHeader";
import { ProductsToolbar } from "@/components/products/ProductsToolbar";
import { ProductsGrid } from "@/components/products/ProductsGrid";
import { ProductsPagination } from "@/components/products/ProductsPagination";
import { ProductsEmptyState } from "@/components/products/ProductsEmptyState";
import { ProductsGridSkeleton } from "@/components/products/ProductsGridSkeleton";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupProductsByCategory(products: any[]): ProductGroup[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups = new Map<string, any[]>();
  for (const p of products) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cats = (p.categories || []).map((c: any) => c?.name).filter(Boolean);
    const key = cats.length > 0 ? cats[0] : "Otros";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  return Array.from(groups.entries()).map(([label, prods]) => ({ label, products: prods }));
}



interface ProductGroup {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
}

export default function ProductsPageClient() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // URL initial values (read once on mount)
  const queryParam = searchParams.get("q") || "";
  const pageParam = Number(searchParams.get("page")) || 1;
  const limitParam = Number(searchParams.get("limit")) || 20;
  const categoryParam = searchParams.get("category") || "";

  // View & UI state
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [searchTerm, setSearchTerm] = useState(queryParam);

  // Data-fetching params (drive React Query keys)
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [currentCategory, setCurrentCategory] = useState(categoryParam);
  const [isSearching, setIsSearching] = useState(false);

  const prevSearchTermRef = useRef(queryParam);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isSearchingRef = useRef(false);

  const { categories, categoryCounts, products, total, totalPages, isPending, isFetching } = useProductsData({
    q: searchTerm,
    page: currentPage,
    limit: limitParam,
    category: currentCategory,
  });

  // Clear isSearching when fetch completes
  useEffect(() => {
    if (isSearchingRef.current && !isFetching) {
      isSearchingRef.current = false;
      setIsSearching(false);
    }
  }, [isFetching]);

  // Derived groups for category grouping
  const groups = groupByCategory
    ? groupProductsByCategory(products)
    : undefined;

  const syncUrl = useCallback((q: string, p: number, l: number, cat: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat) params.set("category", cat);
    params.set("page", String(p));
    params.set("limit", String(l));
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  }, [pathname]);

  // Debounced search: user types → update params → React Query refetches
  useEffect(() => {
    if (searchTerm === prevSearchTermRef.current) return;
    prevSearchTermRef.current = searchTerm;

    const query = searchTerm.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      isSearchingRef.current = true;
      setIsSearching(true);
      setCurrentPage(1);
      syncUrl(query, 1, limitParam, categoryParam);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Navigation helper (pagination, categories, clear)
  const handleNavigate = useCallback((
    newQuery?: string,
    newPage?: number,
    newLimit?: number,
    newCategory?: string,
  ) => {
    const q = newQuery !== undefined ? newQuery : searchTerm;
    const cat = newCategory !== undefined ? newCategory : currentCategory;
    const page = newPage ?? 1;
    const limit = newLimit ?? limitParam;
    isSearchingRef.current = true;
    setIsSearching(true);
    setSearchTerm(q);
    setCurrentPage(page);
    setCurrentCategory(cat);
    syncUrl(q, page, limit, cat);
  }, [searchTerm, currentCategory, limitParam, syncUrl]);

  // Back/forward browser navigation
  useEffect(() => {
    const onPopState = () => {
      const p = new URLSearchParams(window.location.search);
      const newQ = p.get("q") || "";
      prevSearchTermRef.current = newQ;
      isSearchingRef.current = true;
      setIsSearching(true);
      setSearchTerm(newQ);
      setCurrentPage(Number(p.get("page")) || 1);
      setCurrentCategory(p.get("category") || "");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Full-page skeleton only on first-ever load (no cached data)
  if (isPending) {
    return <ProductsPageSkeleton />;
  }

  const showContentSkeleton = isSearching;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-body">

      <main className="pt-24 pb-16 md:pt-32 md:pb-32">
        <ProductsHeader t={t} />

        <ProductsToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isLoading={isSearching}
          totalCount={total}
          viewMode={viewMode}
          setViewMode={setViewMode}
          limitParam={limitParam}
          updateUrl={handleNavigate}
          queryParam={queryParam}
          t={t}
          categories={categories}
          categoryCounts={categoryCounts}
          categoryParam={currentCategory}
          groupByCategory={groupByCategory}
          setGroupByCategory={setGroupByCategory}
        />

        <div className="container mx-auto px-4 md:px-6">
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              {showContentSkeleton ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProductsGridSkeleton viewMode={viewMode} showPagination />
                </motion.div>
              ) : (products.length > 0 || (groups && groups.length > 0)) ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ProductsGrid
                    products={groups ? undefined : products}
                    groups={groups}
                    viewMode={viewMode}
                    t={t}
                  />

                  <div className="mt-12">
                    <ProductsPagination
                      pageParam={currentPage}
                      totalPages={totalPages}
                      updateUrl={handleNavigate}
                      isLoading={isSearching}
                      queryParam={searchTerm}
                      limitParam={limitParam}
                      t={t}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProductsEmptyState
                    isLoading={false}
                    queryParam={searchTerm}
                    onClear={() => handleNavigate("", 1, 20, "")}
                    t={t}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
