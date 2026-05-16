"use client";

import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

interface ProductsGridProps {
  products: Product[];
  viewMode: 'grid' | 'compact' | 'list';
  t: any;
}

export function ProductsGrid({
  products,
  viewMode,
  t,
}: ProductsGridProps) {
  // Helper to chunk products into rows of 5
  const chunkedProducts = [];
  if (viewMode === 'grid') {
    for (let i = 0; i < products.length; i += 5) {
      chunkedProducts.push(products.slice(i, i + 5));
    }
  }

  return (
    <motion.div layout className="transition-all duration-500 w-full space-y-16 md:space-y-24">
      <AnimatePresence mode="popLayout">
        {viewMode === 'grid' ? (
          // Grid Mode: Home-Style Shelves (Full Width with side gradients)
          chunkedProducts.map((row, rowIndex) => (
            <motion.div
              key={`row-${rowIndex}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.1, duration: 0.8 }}
              className="relative group w-full"
            >
              {/* Left/Right Gradients for that "Infinite" look */}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background via-background/50 to-transparent md:w-32" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background via-background/50 to-transparent md:w-32" />

              <div className="flex overflow-x-auto snap-x snap-mandatory pb-8 hide-scrollbar gap-4 md:gap-8 px-6 md:px-[1.5rem] lg:px-[calc((100vw-1280px)/2+1.5rem)]">
                {row.map((p, index) => (
                  <motion.div
                    layout
                    key={p.slug}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="min-w-[85vw] sm:min-w-[45vw] md:min-w-[32%] lg:min-w-[31%] xl:min-w-[24%] 2xl:min-w-[19%] snap-center"
                  >
                    <ProductCard p={p as any} priority={index < 5 && rowIndex === 0} variant={viewMode} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))
        ) : (
          // Other Modes (Compact, List)
          <div className={cn(
            viewMode === 'compact' && "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3",
            viewMode === 'list' && "flex flex-col gap-6"
          )}>
            {products.map((p, index) => (
              <motion.div
                layout
                key={p.slug}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(viewMode === 'list' && "w-full")}
              >
                <ProductCard p={p as any} priority={index < 10} variant={viewMode} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
