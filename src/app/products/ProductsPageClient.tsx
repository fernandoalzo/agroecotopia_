"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

// Modular Components
import { ProductsHeader } from "@/components/products/ProductsHeader";
import { ProductsToolbar } from "@/components/products/ProductsToolbar";
import { ProductsGrid } from "@/components/products/ProductsGrid";
import { ProductsPagination } from "@/components/products/ProductsPagination";
import { ProductsEmptyState } from "@/components/products/ProductsEmptyState";

interface ProductsPageClientProps {
  initialData: {
    products: Product[];
    total: number;
    totalPages: number;
  };
}

export default function ProductsPageClient({ initialData }: ProductsPageClientProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Hydration state
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // URL States
  const pageParam = Number(searchParams.get("page")) || 1;
  const limitParam = Number(searchParams.get("limit")) || 20;
  const queryParam = searchParams.get("q") || "";

  // View & UI state
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState(queryParam);

  // Data derived from props
  const { products: displayedProducts, total: totalCount, totalPages } = initialData;

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Stop loading when new data arrives
  useEffect(() => {
    setIsLoading(false);
  }, [initialData]);

  // Sync internal searchTerm if URL queryParam changes
  useEffect(() => {
    setSearchTerm(queryParam);
  }, [queryParam]);

  // Navigation Logic
  const updateUrl = useCallback((newQuery: string, newPage: number, newLimit: number) => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams);
    
    if (newQuery.trim()) params.set("q", newQuery.trim());
    else params.delete("q");
    
    params.set("page", newPage.toString());
    params.set("limit", newLimit.toString());
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Search Debounce Logic
  useEffect(() => {
    const query = searchTerm.trim();
    if (query === queryParam) return;

    const delayDebounceFn = setTimeout(() => {
      updateUrl(query, 1, limitParam);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, queryParam, limitParam, updateUrl]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-body">
      <Navbar />

      <main className="pt-24 pb-16 md:pt-32 md:pb-32">
        <ProductsHeader t={t} />

        <ProductsToolbar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isLoading={isLoading}
          totalCount={totalCount}
          viewMode={viewMode}
          setViewMode={setViewMode}
          limitParam={limitParam}
          updateUrl={updateUrl}
          queryParam={queryParam}
          t={t}
        />

        <div className="min-h-[500px]">
          {displayedProducts.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                <ProductsGrid 
                  products={displayedProducts as any} 
                  viewMode={viewMode} 
                  t={t} 
                />
              ) : (
                <div className="container mx-auto px-4 md:px-6">
                  <ProductsGrid 
                    products={displayedProducts as any} 
                    viewMode={viewMode} 
                    t={t} 
                  />
                </div>
              )}

              <div className="container mx-auto px-4 md:px-6">
                <ProductsPagination 
                  pageParam={pageParam}
                  totalPages={totalPages}
                  updateUrl={updateUrl}
                  isLoading={isLoading}
                  queryParam={queryParam}
                  limitParam={limitParam}
                  t={t}
                />
              </div>
            </>
          ) : (
            <div className="container mx-auto px-4 md:px-6">
              <ProductsEmptyState 
                isLoading={isLoading}
                queryParam={queryParam}
                onClear={() => { setSearchTerm(""); updateUrl("", 1, 20); }}
                t={t}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
