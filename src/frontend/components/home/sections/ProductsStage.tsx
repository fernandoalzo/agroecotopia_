"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";

interface ProductsStageProps {
  t: any;
  language: string;
  featuredProducts: Product[];
}

const ProductsStage = ({ t, language, featuredProducts }: ProductsStageProps) => {
  const router = useRouter();

  return (
    <div className="container max-w-7xl mx-auto flex flex-col h-full justify-center">

      {/* Header Title */}
      <div className="text-center mb-6 shrink-0">
        <span className="text-xs font-bold text-primary tracking-widest uppercase mb-1 block">
          {language === "es" ? "Nuestra Cosecha" : "Our Harvest"}
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-foreground mb-3">
          {t.products.title.split(' ')[0]} <span className="text-primary italic">{t.products.title.split(' ').slice(1).join(' ')}</span>
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto">
          {t.products.catalogDescription || t.products.description}
        </p>
      </div>

      {/* Floating product showcase - 3D grid layout */}
      {featuredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 overflow-y-auto max-h-[66vh] py-2 px-3 no-scrollbar mb-2">
          {featuredProducts.map((p, i) => {
            return (
              <motion.div
                key={p.id || p.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                whileHover={{
                  scale: 1.05,
                  z: 30,
                  boxShadow: "0px 15px 30px rgba(var(--color-primary), 0.12)"
                }}
                style={{
                  transformStyle: "preserve-3d"
                }}
                className="transition-all duration-300 relative"
              >
                <ProductCard p={p} />
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 bg-card/50 rounded-2xl border border-dashed border-border/80">
          <p className="text-muted-foreground">{t.products.noResults}</p>
        </div>
      )}

      {/* View all products button */}
      <div className="text-center mt-8 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            window.location.href = "/products";
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 font-display text-base font-bold text-white shadow-xl hover:bg-primary/95 transition-all hover:scale-105 active:scale-95 group cursor-pointer relative z-50"
        >
          <span>{t.products.viewAll}</span>
          <ShoppingCart className="w-4 h-4 transition-transform group-hover:rotate-6" />
        </button>
      </div>

    </div>
  );
};

export default ProductsStage;
