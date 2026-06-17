"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, XCircle, Hash, LayoutGrid, Grid2X2, List, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

const categoryTranslations: Record<string, { es: string; en: string }> = {
  fertilizantes: { es: "Fertilizantes", en: "Fertilizers" },
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

interface ProductsToolbarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  isLoading: boolean;
  totalCount: number;
  viewMode: 'grid' | 'compact';
  setViewMode: (val: 'grid' | 'compact') => void;
  limitParam: number;
  updateUrl: (query: string, page: number, limit: number, category?: string) => void;
  queryParam: string;
  t: any;
  categories: string[];
  categoryCounts?: Record<string, number>;
  categoryParam: string;
  groupByCategory?: boolean;
  setGroupByCategory?: (val: boolean) => void;
}

export function ProductsToolbar({
  searchTerm,
  setSearchTerm,
  isLoading,
  totalCount,
  viewMode,
  setViewMode,
  limitParam,
  updateUrl,
  queryParam,
  t,
  categories,
  categoryCounts = {},
  categoryParam,
  groupByCategory = false,
  setGroupByCategory,
}: ProductsToolbarProps) {
  const { language } = useLanguage();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const selectedCategories = categoryParam ? categoryParam.split(",").filter(Boolean) : [];

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

  return (
    <div className="container mx-auto px-4 md:px-6 mb-12">
      {/* 📱 MOBILE VIEW LAYOUT (md:hidden) */}
      <div className="md:hidden flex flex-col gap-4">
        {/* 1. Search Input */}
        <div className="relative w-full group">
          <div className="relative flex items-center">
            <div className="absolute left-4 z-10">
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <Search className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.products.searchPlaceholder}
              className="w-full h-14 pl-12 pr-14 rounded-2xl border-2 border-border/60 bg-card/40 backdrop-blur-xl font-body text-base"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-4 p-1">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Categories Accordion (Under Search Input) */}
        {categories && categories.length > 0 && (
          <div className="w-full border-t border-border/40 pt-4 mt-2">
            <div className="flex items-center justify-between w-full py-2 group">
              <button
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="flex items-center gap-3 font-display text-base font-extrabold text-foreground cursor-pointer hover:text-primary transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                </div>
                <span className="tracking-wide">
                  {language === 'es' ? 'Categorías' : 'Categories'}
                </span>
                {selectedCategories.length > 0 && (
                  <span className="bg-[#a68953]/20 text-[#a68953] text-[10px] px-2 py-0.5 rounded-full font-extrabold shadow-sm">
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
                    className="text-[10px] font-extrabold text-destructive hover:text-destructive/80 transition-colors uppercase tracking-wider focus:outline-none mr-1"
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
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-3"
                >
                  {/* TWO COLUMNS IN MOBILE VIEW */}
                  <div className="grid grid-cols-2 gap-2 pb-2">
                    {categories.map((cat) => {
                      const isChecked = selectedCategories.includes(cat);
                      const count = categoryCounts[cat] || 0;
                      return (
                        <button
                          key={cat}
                          onClick={() => handleCategoryToggle(cat)}
                          className={cn(
                            "flex items-center justify-between w-full px-3 py-2.5 rounded-xl border transition-all duration-200 text-left cursor-pointer focus:outline-none",
                            isChecked
                              ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
                              : "bg-card/25 border-border/50 text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 max-w-[75%] overflow-hidden">
                            <div className={cn(
                              "w-4 h-4 rounded-full border transition-all duration-200 flex items-center justify-center shrink-0",
                              isChecked ? "border-primary bg-primary text-primary-foreground" : "border-border/80 bg-background/60"
                            )}>
                              {isChecked && (
                                <svg className="w-2.5 h-2.5 stroke-current stroke-[4] text-primary-foreground" viewBox="0 0 24 24" fill="none">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span className="text-xs font-semibold capitalize truncate">
                              {getCategoryLabel(cat)}
                            </span>
                          </div>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ml-1 transition-colors duration-200",
                            isChecked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/60"
                          )}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 3. Separator Line */}
        <div className="border-t border-border/80 my-2" />

        {/* 4. Controls Row (Paginador) below Categories */}
        <div className="flex items-center justify-between bg-card/30 backdrop-blur-md border border-border/60 p-1.5 rounded-2xl w-full">
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
            {[
              { val: 'grid', icon: LayoutGrid },
              { val: 'compact', icon: Grid2X2 }
            ].map(({ val, icon: Icon }) => (
              <ToggleGroupItem
                key={val}
                value={val}
                className={cn(
                  "relative rounded-xl px-4 py-2 transition-all active:scale-95",
                  viewMode === val ? "text-primary-foreground bg-[#a68953] shadow-[0_2px_12px_rgba(166,137,83,0.5)]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {/* 🖥️ DESKTOP VIEW LAYOUT (hidden md:flex) */}
      <div className="hidden md:flex flex-row gap-8 justify-between items-center border-b border-border/80 pb-10">
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

            {!searchTerm && (
              <div className="absolute right-5 hidden sm:flex items-center gap-1 px-2 py-1 rounded-md border border-border/50 bg-background/50 text-[10px] font-bold text-muted-foreground/50 pointer-events-none">
                <span>BUSCAR</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
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
              {[
                { val: 'grid', icon: LayoutGrid },
                { val: 'compact', icon: Grid2X2 }
              ].map(({ val, icon: Icon }) => (
                <ToggleGroupItem
                  key={val}
                  value={val}
                  className={cn(
                    "relative rounded-xl px-4 py-2 transition-all active:scale-95",
                    viewMode === val ? "text-primary-foreground bg-[#a68953] shadow-[0_2px_12px_rgba(166,137,83,0.5)]" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {setGroupByCategory && (
              <button
                onClick={() => setGroupByCategory(!groupByCategory)}
                disabled={viewMode !== 'grid'}
                className={cn(
                  "relative rounded-xl px-3 py-2 transition-all active:scale-95 text-xs font-semibold border",
                  groupByCategory && viewMode === 'grid'
                    ? "text-primary-foreground bg-[#a68953] border-[#a68953] shadow-[0_2px_12px_rgba(166,137,83,0.5)]"
                    : "text-muted-foreground hover:text-foreground border-border/60",
                  viewMode !== 'grid' && "opacity-40 cursor-not-allowed"
                )}
                title={language === 'es' ? 'Agrupar por categoría' : 'Group by category'}
              >
                <SlidersHorizontal className="h-4 w-4 inline mr-1" />
                {language === 'es' ? 'Agrupar' : 'Group'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
