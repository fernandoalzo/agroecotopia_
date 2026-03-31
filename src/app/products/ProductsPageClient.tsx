"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";
import { Leaf, Search, LayoutGrid, Grid2X2, List, Loader2, XCircle, ChevronLeft, ChevronRight, Hash } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

  // URL States
  const pageParam = Number(searchParams.get("page")) || 1;
  const limitParam = Number(searchParams.get("limit")) || 20;
  const queryParam = searchParams.get("q") || "";

  // View & UI state
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState(queryParam);

  // Data derived from props (Source of Truth)
  const { products: displayedProducts, total: totalCount, totalPages } = initialData;

  // Loading & Flow state
  const [isLoading, setIsLoading] = useState(false);

  // Stop loading when new data arrives from server
  useEffect(() => {
    setIsLoading(false);
  }, [initialData]);

  // Sync URL Params (Triggers GET request via Next.js navigation)
  const updateUrl = useCallback((newQuery: string, newPage: number, newLimit: number) => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams);
    
    if (newQuery.trim()) params.set("q", newQuery.trim());
    else params.delete("q");
    
    params.set("page", newPage.toString());
    params.set("limit", newLimit.toString());
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Handle Search Debounce (Updates URL -> Triggers Server Component GET)
  useEffect(() => {
    const query = searchTerm.trim();
    
    // If searchTerm matches queryParam, nothing to do
    if (query === queryParam) return;

    const delayDebounceFn = setTimeout(() => {
      // When searching, we always reset to page 1
      updateUrl(query, 1, limitParam);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, queryParam, limitParam, updateUrl]);

  // Sync internal searchTerm if URL queryParam changes (browser back/forward)
  useEffect(() => {
    setSearchTerm(queryParam);
  }, [queryParam]);

  // Helper for Pagination UI
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, pageParam - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => updateUrl(queryParam, i, limitParam)}
          className={cn(
            "w-10 h-10 rounded-xl font-bold transition-all active:scale-95",
            pageParam === i
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50"
          )}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">
      <Navbar />

      <main className="pt-24 pb-16 md:pt-32 md:pb-32">
        {/* Header Section */}
        <div className="container px-4 md:px-6 mb-12 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-4 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary md:text-sm">
              <Leaf className="h-4 w-4" />
              {t.products.fullCatalog}
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-7xl mb-6">
              {t.products.ourHarvest.split(' ')[0]} <span className="text-primary italic">{t.products.ourHarvest.split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="max-w-2xl font-body text-base leading-relaxed text-muted-foreground md:text-xl">
              {t.products.catalogDescription}
            </p>
          </motion.div>
        </div>

        {/* Toolbar with Premium Search */}
        <div className="container px-4 md:px-6 mb-12">
          <div className="flex flex-col md:flex-row gap-8 justify-between items-center border-b border-border/80 pb-10">
            <div className="relative w-full md:w-[450px] group">
              {/* Decorative Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative flex items-center">
                <div className="absolute left-4 z-10">
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loader"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="search-icon"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.products.searchPlaceholder}
                  className={cn(
                    "w-full h-14 pl-12 pr-14 rounded-2xl border-2 border-border/60 bg-card/40 backdrop-blur-xl",
                    "font-body text-base placeholder:text-muted-foreground/60 transition-all duration-300",
                    "focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/60 focus:bg-card/80",
                    "hover:border-border group-hover:bg-card/60 shadow-sm"
                  )}
                />

                <AnimatePresence>
                  {searchTerm && (
                    <motion.button
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 p-1 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all active:scale-90"
                      title="Limpiar búsqueda"
                    >
                      <XCircle className="h-5 w-5 fill-muted-foreground/10" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Keyboard Shortcut Hint (Optional/Visual) */}
                {!searchTerm && (
                  <div className="absolute right-5 hidden sm:flex items-center gap-1 px-2 py-1 rounded-md border border-border/50 bg-background/50 text-[10px] font-bold text-muted-foreground/50 pointer-events-none">
                    <span>BUSCAR</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              {/* Results counter */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground font-body">
                {t.products.showingResults.replace('{count}', totalCount.toString()).split(totalCount.toString())[0]}
                <span className="font-bold text-foreground">{totalCount}</span>
                {t.products.showingResults.replace('{count}', totalCount.toString()).split(totalCount.toString())[1]}
              </div>

              <div className="flex items-center gap-3 bg-card/30 backdrop-blur-md border border-border/60 p-1.5 rounded-2xl">
                <div className="flex items-center gap-2 px-3 border-r border-border/60">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={limitParam.toString()}
                    onValueChange={(val) => updateUrl(queryParam, 1, Number(val))}
                  >
                    <SelectTrigger className="w-20 bg-transparent border-none focus:ring-0 shadow-none h-8 font-bold">
                      <SelectValue placeholder="20" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => value && setViewMode(value as any)}
                  className="gap-1"
                >
                  <ToggleGroupItem
                    value="grid"
                    className={cn(
                      "relative rounded-xl px-4 py-2 transition-all active:scale-95",
                      viewMode === 'grid' ? "text-primary-foreground bg-[#a68953] shadow-[0_2px_12px_rgba(166,137,83,0.5)]" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </ToggleGroupItem>

                  <ToggleGroupItem
                    value="compact"
                    className={cn(
                      "relative rounded-xl px-4 py-2 transition-all active:scale-95",
                      viewMode === 'compact' ? "text-primary-foreground bg-[#a68953] shadow-[0_2px_12px_rgba(166,137,83,0.5)]" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Grid2X2 className="h-5 w-5" />
                  </ToggleGroupItem>

                  <ToggleGroupItem
                    value="list"
                    className={cn(
                      "relative rounded-xl px-4 py-2 transition-all active:scale-95",
                      viewMode === 'list' ? "text-primary-foreground bg-[#a68953] shadow-[0_2px_12px_rgba(166,137,83,0.5)]" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <List className="h-5 w-5" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
        </div>

        {/* Grid/List Section */}
        <div className="container mx-auto px-4 md:px-6 min-h-[500px]">
          {displayedProducts.length > 0 ? (
            <>
              <motion.div
                layout
                className={`
                    ${viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6" : ""}
                    ${viewMode === 'compact' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3" : ""}
                    ${viewMode === 'list' ? "flex flex-col gap-6" : ""}
                `}
              >
                <AnimatePresence mode="popLayout">
                  {displayedProducts.map((p, index) => (
                    <motion.div
                      layout
                      key={p.slug}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={viewMode === 'list' ? "w-full" : ""}
                    >
                      <ProductCard p={p as any} priority={index < 10} variant={viewMode} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-20 pt-10 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={pageParam <= 1 || isLoading}
                      onClick={() => updateUrl(queryParam, pageParam - 1, limitParam)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2 mx-2">
                      {renderPageNumbers()}
                    </div>

                    <button
                      disabled={pageParam >= totalPages || isLoading}
                      onClick={() => updateUrl(queryParam, pageParam + 1, limitParam)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="text-sm text-muted-foreground font-body italic">
                    Página <span className="text-foreground font-bold">{pageParam}</span> de {totalPages}
                  </div>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="h-20 w-20 rounded-full bg-secondary/30 flex items-center justify-center mb-6">
                <Search className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-2">
                {isLoading ? "Buscando productos..." : t.products.noResults}
              </h3>
              <p className="text-muted-foreground max-w-sm mb-8">
                {isLoading
                  ? "Conectando con nuestro almacén digital para traerte lo mejor..."
                  : (queryParam.trim() !== ""
                    ? "No pudimos encontrar nada en todo nuestro catálogo. Prueba con otros términos."
                    : "Intenta navegar a otra página o cambiar el límite por página."
                  )
                }
              </p>
              {!isLoading && (
                <button
                  onClick={() => { setSearchTerm(""); updateUrl("", 1, 20); }}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-all active:scale-95"
                >
                  Limpiar filtros
                </button>
              )}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
