"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Package, Plus } from "lucide-react";
import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { ProductDetailPanel } from "./ProductDetailPanel";
import { ProductCreatePanel } from "./ProductCreatePanel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/Loading";
import { SearchInput } from "@/components/shared/SearchInput";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { getAdminProductColumns } from "./AdminProductsTableColumns";
import { Filter } from "lucide-react";
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
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);

  // Keep the selected product updated if the products list changes (e.g. after a save or real-time update)
  useEffect(() => {
    if (selectedProduct) {
      const updatedProduct = products.find((p) => p.id === selectedProduct.id);
      if (updatedProduct && JSON.stringify(updatedProduct) !== JSON.stringify(selectedProduct)) {
        setSelectedProduct(updatedProduct);
      }
    }
  }, [products, selectedProduct]);

  const columns = useMemo(() => getAdminProductColumns(setSelectedProduct), []);

  const totalProductsInDb = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  const selectedCategories = categoryFilter === "ALL" ? [] : categoryFilter.split(",");

  const toggleCategory = (cat: string) => {
    if (cat === "ALL") {
      setCategoryFilter("ALL");
      return;
    }
    
    let newSelection = [...selectedCategories];
    if (newSelection.includes(cat)) {
      newSelection = newSelection.filter(c => c !== cat);
    } else {
      newSelection.push(cat);
    }
    
    if (newSelection.length === 0) {
      setCategoryFilter("ALL");
    } else {
      setCategoryFilter(newSelection.join(","));
    }
  };

  // ── Admin view ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col space-y-4 flex-1 min-h-0 relative">
      {/* ── Status filter pills + search ── */}
      {totalProductsInDb > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 shrink-0"
        >
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 h-10 px-4 rounded-xl bg-card border border-border/50 text-xs font-bold shadow-sm hover:bg-accent transition-colors">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  Categorías
                  {selectedCategories.length > 0 && (
                    <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-md bg-primary text-primary-foreground text-[10px]">
                      {selectedCategories.length}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[280px] rounded-xl p-2 max-h-[350px] overflow-y-auto">
                <DropdownMenuLabel className="text-xs text-muted-foreground px-2">Filtrar por categoría</DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-2" />
                <DropdownMenuCheckboxItem
                  checked={categoryFilter === "ALL"}
                  onCheckedChange={() => toggleCategory("ALL")}
                  onSelect={(e) => e.preventDefault()}
                  className="text-xs font-bold py-2 rounded-lg cursor-pointer"
                >
                  Todas las categorías
                  <span className="ml-auto text-muted-foreground">({totalProductsInDb})</span>
                </DropdownMenuCheckboxItem>
                {Object.entries(categoryCounts).map(([cat, count]) => (
                  <DropdownMenuCheckboxItem
                    key={cat}
                    checked={selectedCategories.includes(cat)}
                    onCheckedChange={() => toggleCategory(cat)}
                    onSelect={(e) => e.preventDefault()}
                    className="text-xs font-bold py-2 rounded-lg cursor-pointer"
                  >
                    {cat}
                    <span className="ml-auto text-muted-foreground">({count})</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar por ID, nombre o descripción..."
            onClear={() => setSearchQuery("")}
            containerClassName="max-w-md w-full"
            inputClassName="h-10"
          />
        </motion.div>
      )}

      {/* ── DataTable Implementation ── */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        pageCount={totalPages}
        currentPage={currentPage}
        pageSize={limit}
        totalEntries={totalCount}
        onPageChange={setCurrentPage}
        onPageSizeChange={setLimit}
        pageSizeOptions={[10, 20, 50, 100]}
        emptyTitle={
          totalProductsInDb === 0
            ? "Aún no tienes productos registrados."
            : "No se encontraron productos con los filtros aplicados."
        }
        emptyIcon={Package}
        footerLeftContent={
          <>
            <p className="text-xs text-muted-foreground">
              Mostrando productos <span className="font-bold text-foreground">{products.length > 0 ? (currentPage - 1) * limit + 1 : 0}</span> al{" "}
              <span className="font-bold text-foreground">{Math.min(currentPage * limit, totalCount)}</span> de{" "}
              <span className="font-bold text-foreground">{totalCount}</span> totales
            </p>
            {(categoryFilter !== "ALL" || searchQuery.trim() !== "") && (
              <button
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                onClick={() => {
                  setCategoryFilter("ALL");
                  setSearchQuery("");
                }}
              >
                Limpiar filtros
              </button>
            )}
          </>
        }
      />

      {/* ── Floating Action Button (FAB) ── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsCreatePanelOpen(true)}
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

      <ProductCreatePanel
        open={isCreatePanelOpen}
        storeId={storeId}
        onClose={() => setIsCreatePanelOpen(false)}
        availableCategories={availableCategories}
        storesList={storesList}
        onSubmitForm={onSubmitCreate}
        onGenerateDescription={onGenerateDescription}
      />
    </div>
  );
};
