"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { searchProductsAction, getPaginatedProductsAction } from "@/backend/modules/product/product.actions";

// Modular Components
import { ProductsHeader } from "@/components/products/ProductsHeader";
import { ProductsToolbar } from "@/components/products/ProductsToolbar";
import { ProductsGrid } from "@/components/products/ProductsGrid";
import { ProductsPagination } from "@/components/products/ProductsPagination";
import { ProductsEmptyState } from "@/components/products/ProductsEmptyState";

function groupProductsByCategory(products: any[]): ProductGroup[] {
  const groups = new Map<string, any[]>();
  for (const p of products) {
    const cats = (p.categories || []).map((c: any) => c?.name).filter(Boolean);
    const key = cats.length > 0 ? cats[0] : "Otros";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  return Array.from(groups.entries()).map(([label, prods]) => ({ label, products: prods }));
}

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

interface ProductGroup {
  label: string;
  products: any[];
}

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
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Hydration state
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // URL States (solo lectura)
  const pageParam = Number(searchParams.get("page")) || 1;
  const limitParam = Number(searchParams.get("limit")) || 20;
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";

  // View & UI state
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [searchTerm, setSearchTerm] = useState(queryParam);

  // ── Resultados locales (no dependen de props) ──
  const [products, setProducts] = useState(initialData.products);
  const [total, setTotal] = useState(initialData.total);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [isSearching, setIsSearching] = useState(false);

  // Derived groups for category grouping
  const groups = groupByCategory
    ? groupProductsByCategory(products)
    : undefined;

  // Inicializar desde props solo en montaje
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hydrated.current) {
      setProducts(initialData.products);
      setTotal(initialData.total);
      setTotalPages(initialData.totalPages);
      hydrated.current = true;
    }
  }, [initialData]);

  // Selected categories list
  const selectedCategories = categoryParam ? categoryParam.split(",").filter(Boolean) : [];

  // ── Helpers compartidos ──
  const fetchData = useCallback(async (q: string, p: number, l: number, cat: string) => {
    try {
      const cats = cat ? cat.split(",").filter(Boolean) : [];
      const catStr = cats.length > 0 ? cats.join(",") : undefined;

      if (q.trim()) {
        const result = await searchProductsAction(q.trim(), p, l, catStr);
        setProducts(result.products);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } else {
        const result = await getPaginatedProductsAction(p, l, catStr);
        setProducts(result.products);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      setProducts([]);
      setTotal(0);
      setTotalPages(0);
    }
  }, []);

  const syncUrl = useCallback((q: string, p: number, l: number, cat: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat) params.set("category", cat);
    params.set("page", String(p));
    params.set("limit", String(l));
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  }, [pathname]);

  const doSearch = useCallback(async (q: string, p: number, cat: string) => {
    setIsSearching(true);
    try {
      await fetchData(q, p, limitParam, cat);
      syncUrl(q, p, limitParam, cat);
    } finally { setIsSearching(false); }
  }, [limitParam, fetchData, syncUrl]);

  // ── AbortController para cancelar búsquedas en vuelo ──
  const abortRef = useRef<AbortController | null>(null);
  const prevSearchTermRef = useRef(queryParam);

  // ── Búsqueda local (escribe → fetch + URL silenciosa) ──
  useEffect(() => {
    if (searchTerm === prevSearchTermRef.current) {
      return; // Ignorar el primer render y renders de Strict Mode
    }
    prevSearchTermRef.current = searchTerm;
    
    const query = searchTerm.trim();
    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    const delayFn = setTimeout(() => {
      if (!abort.signal.aborted) doSearch(query, 1, categoryParam);
    }, 300);

    return () => { clearTimeout(delayFn); abort.abort(); };
  }, [searchTerm]); // SOLO searchTerm

  // ── Navegación explícita (paginación, categorías, limpiar) ──
  const navigate = useCallback(async (
    newQuery: string, newPage: number, newLimit: number, newCategory?: string,
  ) => {
    const q = newQuery !== undefined ? newQuery : searchTerm;
    const cat = newCategory !== undefined ? newCategory : categoryParam;
    await doSearch(q, newPage, cat);
  }, [searchTerm, categoryParam, doSearch]);

  // ── Sincronizar desde URL externa (back/forward, link directo) ──
  useEffect(() => {
    const onPopState = () => {
      const p = new URLSearchParams(window.location.search);
      const newQ = p.get("q") || "";
      prevSearchTermRef.current = newQ; // Prevenir trigger del effect
      setSearchTerm(newQ);
      const page = Number(p.get("page")) || 1;
      const cat = p.get("category") || "";
      doSearch(newQ, page, cat);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [doSearch]);

  // ── Primera carga desde props ──
  useEffect(() => {
    if (!hydrated.current) {
      setProducts(initialData.products);
      setTotal(initialData.total);
      setTotalPages(initialData.totalPages);
      hydrated.current = true;
    }
  }, [initialData]);

  // Toggle Category selection
  const handleCategoryToggle = (category: string) => {
    let nextCategories: string[];
    if (selectedCategories.includes(category)) {
      nextCategories = selectedCategories.filter((c) => c !== category);
    } else {
      nextCategories = [...selectedCategories, category];
    }
    const categoryQuery = nextCategories.join(",");
    navigate(queryParam, 1, limitParam, categoryQuery);
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
          isLoading={isSearching}
          totalCount={total}
          viewMode={viewMode}
          setViewMode={setViewMode}
          limitParam={limitParam}
          updateUrl={navigate}
          queryParam={queryParam}
          t={t}
          categories={categories}
          categoryCounts={categoryCounts}
          categoryParam={categoryParam}
          groupByCategory={groupByCategory}
          setGroupByCategory={setGroupByCategory}
        />

        <div className="container mx-auto px-4 md:px-6">
          <div className="min-h-[500px]">
              {(products.length > 0 || (groups && groups.length > 0)) ? (
                <>
                  <ProductsGrid
                    products={groups ? undefined : products}
                    groups={groups}
                    viewMode={viewMode}
                    t={t}
                  />

                  <div className="mt-12">
                    <ProductsPagination
                      pageParam={pageParam}
                      totalPages={totalPages}
                      updateUrl={navigate}
                      isLoading={isSearching}
                      queryParam={queryParam}
                      limitParam={limitParam}
                      t={t}
                    />
                  </div>
                </>
              ) : (
                <ProductsEmptyState
                  isLoading={isSearching}
                  queryParam={queryParam}
                  onClear={() => { setSearchTerm(""); navigate("", 1, 20, ""); }}
                  t={t}
                />
              )}
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
