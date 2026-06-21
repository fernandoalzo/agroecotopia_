"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Package, Plus } from "lucide-react";
import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { ProductDetailPanel } from "./ProductDetailPanel";
import { ProductCreateModal } from "./ProductCreateModal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/Loading";
import { SearchInput } from "@/components/shared/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
interface ProductsListProps {
  storeId?: string;
  // State
  products: Product[];
  loading: boolean;
  categoryCounts: Record<string, number>;
  categoryFilter: string | "ALL";
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  availableCategories: string[];
  storesList: {id: string, name: string}[];

  // Actions
  setCategoryFilter: (cat: string | "ALL") => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  setLimit: (limit: number) => void;

  // Mutators
  onSubmitCreate: (payload: Record<string, unknown>, storeId?: string) => Promise<boolean>;
  onSubmitUpdate: (productId: string, payload: Record<string, unknown>) => Promise<boolean>;
  onDeleteProduct: (productId: string) => Promise<boolean>;
  onGenerateDescription?: (name: string, categories: string[], tags: string) => Promise<string>;
}

export const ProductsList = ({
  storeId,
  products,
  loading,
  categoryCounts,
  categoryFilter,
  searchQuery,
  currentPage,
  totalPages,
  totalCount,
  limit,
  availableCategories,
  storesList,
  setCategoryFilter,
  setSearchQuery,
  setCurrentPage,
  setLimit,
  onSubmitCreate,
  onSubmitUpdate,
  onDeleteProduct,
  onGenerateDescription,
}: ProductsListProps) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Keep the selected product updated if the products list changes (e.g. after a save or real-time update)
  useEffect(() => {
    if (selectedProduct) {
      const updatedProduct = products.find((p) => p.id === selectedProduct.id);
      if (updatedProduct && JSON.stringify(updatedProduct) !== JSON.stringify(selectedProduct)) {
        setSelectedProduct(updatedProduct);
      }
    }
  }, [products, selectedProduct]);

  const renderPagination = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-secondary/20 border border-border/30 px-6 py-4">
      <p className="text-sm text-muted-foreground flex-1">
        Mostrando productos <span className="font-bold text-foreground">{products.length > 0 ? (currentPage - 1) * limit + 1 : 0}</span> al{" "}
        <span className="font-bold text-foreground">{Math.min(currentPage * limit, totalCount)}</span> de{" "}
        <span className="font-bold text-foreground">{totalCount}</span> totales
      </p>

      {/* Pagination buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-border/50 hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-50"
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 px-1">
            {(() => {
              const getVisiblePages = () => {
                if (totalPages <= 7) {
                  return Array.from({ length: totalPages }, (_, i) => i + 1);
                }
                if (currentPage <= 4) {
                  return [1, 2, 3, 4, 5, "...", totalPages];
                }
                if (currentPage >= totalPages - 3) {
                  return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                }
                return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
              };

              return getVisiblePages().map((page, index) => {
                if (page === "...") {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground font-bold">
                      ...
                    </span>
                  );
                }

                const pageNum = page as number;
                return (
                  <Button
                    key={`page-${pageNum}`}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-9 w-9 rounded-xl font-bold transition-all",
                      currentPage === pageNum
                        ? "shadow-md shadow-primary/20"
                        : "border-border/50 hover:bg-primary/5 hover:text-primary"
                    )}
                    disabled={loading}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              });
            })()}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-border/50 hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-50"
            disabled={currentPage === totalPages || loading}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-4 flex-1 justify-end">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground hidden sm:inline-block">Mostrar:</span>
          <Select
            value={limit.toString()}
            onValueChange={(value) => setLimit(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px] rounded-lg border-border/50 bg-background text-xs font-bold text-foreground focus:ring-primary/30">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10" className="text-xs font-bold">10</SelectItem>
              <SelectItem value="20" className="text-xs font-bold">20</SelectItem>
              <SelectItem value="50" className="text-xs font-bold">50</SelectItem>
              <SelectItem value="100" className="text-xs font-bold">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {categoryFilter !== "ALL" || searchQuery.trim() !== "" ? (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-xs font-bold text-muted-foreground hover:text-primary shrink-0"
            onClick={() => {
              setCategoryFilter("ALL");
              setSearchQuery("");
            }}
          >
            Limpiar filtros
          </Button>
        ) : (
          <div className="w-[100px] hidden sm:block" />
        )}
      </div>
    </div>
  );

  const totalProductsInDb = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  // ── Admin view ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Status filter pills + search ── */}
      {totalProductsInDb > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2",
              categoryFilter === "ALL"
                ? "bg-primary text-primary-foreground"
                : "bg-card/80 text-muted-foreground border border-border/50 hover:bg-card hover:text-foreground"
            )}
          >
            Todos
            <span className={cn(
              "px-1.5 py-0.5 rounded-md text-[10px]",
              categoryFilter === "ALL" ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
            )}>
              {Object.values(categoryCounts).reduce((a, b) => a + b, 0)}
            </span>
          </button>

          {Object.entries(categoryCounts).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2",
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/80 text-muted-foreground border border-border/50 hover:bg-card hover:text-foreground"
              )}
            >
              {cat}
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px]",
                categoryFilter === cat ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          ))}
        </div>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar por ID, nombre o descripción..."
          onClear={() => setSearchQuery("")}
          containerClassName="max-w-md"
        />
      </motion.div>
      )}

      {/* ── Top Pagination ── */}
      {products.length > 0 && renderPagination()}

      {/* ── Compact product rows ── */}
      <div className="space-y-3 relative">
        {loading && products.length > 0 && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
            <Loading text="" subtext="" className="py-0 scale-75" />
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {loading && products.length === 0 ? (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex justify-center"
            >
              <Loading className="scale-75" text="" subtext="" />
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">
                {totalProductsInDb === 0 
                  ? "Aún no tienes productos registrados."
                  : "No se encontraron productos con los filtros aplicados."}
              </p>
            </motion.div>
          ) : (
            products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onView={() => setSelectedProduct(product)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Summary footer + Pagination controls ── */}
      {products.length > 0 && renderPagination()}

      {/* ── Floating Action Button (FAB) ── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-shadow hover:shadow-xl hover:shadow-primary/40 focus:outline-none"
        title="Crear Nuevo Producto"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {selectedProduct && (
        <ProductDetailPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          availableCategories={availableCategories}
          onSubmitUpdate={onSubmitUpdate}
          onDeleteProduct={onDeleteProduct}
          onGenerateDescription={onGenerateDescription}
        />
      )}

      {isCreateModalOpen && (
        <ProductCreateModal
          storeId={storeId}
          onClose={() => setIsCreateModalOpen(false)}
          availableCategories={availableCategories}
          storesList={storesList}
          onSubmitForm={onSubmitCreate}
          onGenerateDescription={onGenerateDescription}
        />
      )}
    </div>
  );
};
