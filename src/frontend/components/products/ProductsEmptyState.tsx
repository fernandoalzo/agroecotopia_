"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";

interface ProductsEmptyStateProps {
  isLoading: boolean;
  queryParam: string;
  onClear: () => void;
  t: any;
}

export function ProductsEmptyState({
  isLoading,
  queryParam,
  onClear,
  t,
}: ProductsEmptyStateProps) {
  return (
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
          onClick={onClear}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-all active:scale-95"
        >
          Limpiar filtros
        </button>
      )}
    </motion.div>
  );
}
