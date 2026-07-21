"use client";

import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

interface ProductsHeaderProps {
  t: any;
}

export function ProductsHeader({ t }: ProductsHeaderProps) {
  return (
    <div className="container mx-auto px-4 md:px-6 mb-12 md:mb-20">
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
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="h-1 w-48 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_200%] rounded-full mx-auto origin-center"
          style={{
            animation: "gradient-shift-line 4s ease-in-out infinite",
            maskImage: "linear-gradient(to right, black 65%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, black 65%, transparent 100%)"
          }}
        />
        <style>{`
          @keyframes gradient-shift-line {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </motion.div>
    </div>
  );
}
