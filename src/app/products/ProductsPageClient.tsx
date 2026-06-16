"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

import { ChevronDown, SlidersHorizontal } from "lucide-react";

// Modular Components
import { ProductsHeader } from "@/components/products/ProductsHeader";
import { ProductsToolbar } from "@/components/products/ProductsToolbar";
import { ProductsGrid } from "@/components/products/ProductsGrid";
import { ProductsPagination } from "@/components/products/ProductsPagination";
import { ProductsEmptyState } from "@/components/products/ProductsEmptyState";

const categoryTranslations: Record<string, { es: string; en: string }> = {
  fertilizantes: { es: "Fertilizantes", en: "Fertizers" },
  semillas: { es: "Semillas", en: "Seeds" },
  maquinaria: { es: "Maquinaria", en: "Machinery" },
  insumos: { es: "Insumos", en: "Supplies" },
  equipos: { es: "Equipos", en: "Equipment" },
  enmiendas: { es: "Enmiendas", en: "Soil Amendments" },
  abonos: { es: "Abonos", en: "Compost & Manure" },
  riego: { es: "Riego", en: "Irrigation" },
  herramientas: { es: "Herramientas", en: "Tools" },
  sustratos: { es: "Sustratos", en: "Substrates" },
};

interface ProductsPageClientProps {
  initialData: {
    products: any[];
    total: number;
    totalPages: number;
  };
  categories: string[];
  categoryCounts?: Record<string, number>;
  selectedCategory: string;
}

export default function ProductsPageClient({ initialData, categories, categoryCounts = {}, selectedCategory }: ProductsPageClientProps) {
  const { t, language } = useLanguage();
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
  const categoryParam = searchParams.get("category") || "";

  // View & UI state
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Data derived from props
  const { products: displayedProducts, total: totalCount, totalPages } = initialData;

  // Selected categories list
  const selectedCategories = categoryParam ? categoryParam.split(",").filter(Boolean) : [];

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Stop loading when new data arrives
  useEffect(() => {
    setIsLoading(false);
  }, [initialData]);

  // Navigation Logic
  const updateUrl = useCallback((newQuery: string, newPage: number, newLimit: number, newCategory?: string) => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams);

    if (newQuery.trim()) params.set("q", newQuery.trim());
    else params.delete("q");

    if (newCategory !== undefined) {
      if (newCategory.trim()) params.set("category", newCategory.trim());
      else params.delete("category");
    } else if (categoryParam) {
      params.set("category", categoryParam);
    }

    params.set("page", newPage.toString());
    params.set("limit", newLimit.toString());

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname, categoryParam]);

  // Search Debounce Logic
  useEffect(() => {
    const query = searchTerm.trim();
    if (query === queryParam) return;

    const delayDebounceFn = setTimeout(() => {
      updateUrl(query, 1, limitParam);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, queryParam, limitParam, updateUrl]);

  // Toggle Category selection
  const handleCategoryToggle = (category: string) => {
    let nextCategories: string[];
    if (selectedCategories.includes(category)) {
      nextCategories = selectedCategories.filter((c) => c !== category);
    } else {
      nextCategories = [...selectedCategories, category];
    }
    const categoryQuery = nextCategories.join(",");
    updateUrl(queryParam, 1, limitParam, categoryQuery);
  };

  const getCategoryLabel = (category: string) => {
    const key = category.toLowerCase();
    const translation = categoryTranslations[key];
    if (translation) {
      return language === "es" ? translation.es : translation.en;
    }
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-body">

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
          categories={categories}
          categoryCounts={categoryCounts}
          categoryParam={categoryParam}
        />

        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-10">
            {/* Sidebar Column */}
            <aside className="w-full md:w-64 shrink-0 md:sticky md:top-28 h-fit hidden md:block">
              <div className="border-b border-border/80 pb-6 mb-6">
                <div className="flex items-center justify-between w-full py-2 group">
                  <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="flex items-center gap-3 font-display text-lg font-extrabold text-foreground cursor-pointer hover:text-primary transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                    </div>
                    <span className="tracking-wide">
                      {language === 'es' ? 'Categorías' : 'Categories'}
                    </span>
                    {selectedCategories.length > 0 && (
                      <span className="bg-[#a68953]/20 text-[#a68953] text-[10px] px-2.5 py-0.5 rounded-full font-black shadow-sm transition-all animate-pulse">
                        {selectedCategories.length}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-3">
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateUrl(queryParam, 1, limitParam, "");
                        }}
                        className="text-[10px] font-extrabold text-destructive hover:text-destructive/80 transition-colors uppercase tracking-wider cursor-pointer focus:outline-none mr-1"
                        title={language === 'es' ? 'Limpiar todos los filtros' : 'Clear all filters'}
                      >
                        {language === 'es' ? 'Limpiar' : 'Clear'}
                      </button>
                    )}
                    <button
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      className={cn(
                        "w-7 h-7 rounded-full border border-border/80 flex items-center justify-center bg-card/40 text-muted-foreground",
                        "group-hover:border-primary/40 group-hover:text-primary transition-all duration-300 focus:outline-none"
                      )}
                    >
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-300",
                        isCategoryOpen ? "rotate-180 text-primary" : "rotate-0"
                      )} />
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isCategoryOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden mt-4"
                    >
                      <div className="flex flex-col gap-2.5 pl-1">
                        {categories.map((cat) => {
                          const isChecked = selectedCategories.includes(cat);
                          const count = categoryCounts[cat] || 0;
                          return (
                            <button
                              key={cat}
                              onClick={() => handleCategoryToggle(cat)}
                              className={cn(
                                "flex items-center justify-between w-full px-4 py-3 rounded-2xl border transition-all duration-300 group cursor-pointer focus:outline-none",
                                isChecked
                                  ? "bg-primary/10 border-primary/40 text-primary shadow-[0_4px_20px_rgba(166,137,83,0.12)]"
                                  : "bg-card/25 border-border/50 hover:border-primary/25 hover:bg-card/60 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <div className="flex items-center gap-3.5">
                                <div className="relative flex items-center justify-center shrink-0">
                                  {/* Custom Checkbox Ring */}
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center",
                                    isChecked
                                      ? "border-primary bg-primary text-primary-foreground scale-110 shadow-sm"
                                      : "border-border/80 group-hover:border-primary/40 bg-background/60"
                                  )}>
                                    {isChecked && (
                                      <motion.svg
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-3.5 h-3.5 stroke-current stroke-[3.5] text-primary-foreground"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </motion.svg>
                                    )}
                                  </div>
                                </div>
                                <span className="text-sm font-semibold capitalize tracking-wide transition-colors duration-200">
                                  {getCategoryLabel(cat)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full font-semibold transition-colors duration-350",
                                  isChecked
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground/70 group-hover:bg-primary/10 group-hover:text-primary"
                                )}>
                                  {count}
                                </span>
                                {/* Elegant micro-arrow indicator that slides on hover */}
                                <div className={cn(
                                  "text-xs font-semibold select-none transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1",
                                  isChecked ? "text-primary/70" : "text-muted-foreground/50"
                                )}>
                                  →
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>

            {/* Main Content Column */}
            <div className="flex-1 min-h-[500px]">
              {displayedProducts.length > 0 ? (
                <>
                  <ProductsGrid
                    products={displayedProducts as any}
                    viewMode={viewMode}
                    t={t}
                  />

                  <div className="mt-12">
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
                <ProductsEmptyState
                  isLoading={isLoading}
                  queryParam={queryParam}
                  onClear={() => { setSearchTerm(""); updateUrl("", 1, 20, ""); }}
                  t={t}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
