"use client";

import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

interface ProductGroup {
  label: string;
  products: Product[];
}

interface ProductsGridProps {
  products?: Product[];
  groups?: ProductGroup[];
  viewMode: 'grid' | 'compact';
  t: any;
}

export function ProductsGrid({
  products,
  groups,
  viewMode,
  t,
}: ProductsGridProps) {
  if (groups && groups.length > 0) {
    return (
      <motion.div layout className="transition-all duration-500 w-full space-y-12 md:space-y-16">
        <AnimatePresence mode="popLayout">
          {groups.map((group, groupIndex) => {
            // Chunk group products into rows of 5 (same as flat view)
            const rows: Product[][] = [];
            for (let i = 0; i < group.products.length; i += 5) {
              rows.push(group.products.slice(i, i + 5));
            }

            return (
              <motion.section
                key={`group-${groupIndex}-${group.label}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1, duration: 0.6 }}
                className="relative w-full"
              >
                <h2 className="font-display text-lg md:text-xl font-black text-foreground mb-4 md:mb-5 flex items-center gap-3">
                  <span className="w-1 h-6 md:h-7 bg-primary rounded-full" />
                  {group.label}
                  <span className="text-sm font-bold text-muted-foreground/60">
                    ({group.products.length})
                  </span>
                </h2>

                {rows.map((row, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="flex overflow-x-auto snap-x snap-mandatory pb-6 hide-scrollbar gap-6 md:gap-8 px-1">
                    {row.map((p, index) => (
                      <motion.div
                        layout
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: index * 0.03 }}
                        className="min-w-[85vw] sm:min-w-[45vw] md:min-w-[31%] lg:min-w-[23.5%] snap-center"
                      >
                        <ProductCard p={p as any} priority={index < 3 && groupIndex === 0} variant={viewMode} />
                      </motion.div>
                    ))}
                  </div>
                ))}
              </motion.section>
            );
          })}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Flat list (legacy) — chunk into rows of 5
  const chunkedProducts: Product[][] = [];
  if (products && viewMode === 'grid') {
    for (let i = 0; i < products.length; i += 5) {
      chunkedProducts.push(products.slice(i, i + 5));
    }
  }

  return (
    <motion.div layout className="transition-all duration-500 w-full space-y-16 md:space-y-24">
      <AnimatePresence mode="popLayout">
        {viewMode === 'grid' ? (
          chunkedProducts.map((row, rowIndex) => (
            <motion.div
              key={`row-${rowIndex}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.1, duration: 0.8 }}
              className="relative group w-full"
            >
              <div className="flex overflow-x-auto snap-x snap-mandatory pb-8 hide-scrollbar gap-6 md:gap-8 px-1">
                {row.map((p, index) => (
                  <motion.div
                    layout
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="min-w-[85vw] sm:min-w-[45vw] md:min-w-[31%] lg:min-w-[23.5%] snap-center"
                  >
                    <ProductCard p={p as any} priority={index < 5 && rowIndex === 0} variant={viewMode} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {products?.map((p, index) => (
              <motion.div
                layout
                key={p.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
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
