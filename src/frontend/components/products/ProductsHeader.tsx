"use client";

import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

interface ProductsHeaderProps {
  t: any;
}

export function ProductsHeader({ t }: ProductsHeaderProps) {
  return (
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
  );
}
