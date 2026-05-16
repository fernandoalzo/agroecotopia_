"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, XCircle, Hash, LayoutGrid, Grid2X2, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface ProductsToolbarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  isLoading: boolean;
  totalCount: number;
  viewMode: 'grid' | 'compact' | 'list';
  setViewMode: (val: 'grid' | 'compact' | 'list') => void;
  limitParam: number;
  updateUrl: (query: string, page: number, limit: number) => void;
  queryParam: string;
  t: any;
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
}: ProductsToolbarProps) {
  return (
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
                { val: 'compact', icon: Grid2X2 },
                { val: 'list', icon: List }
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
      </div>
    </div>
  );
}
