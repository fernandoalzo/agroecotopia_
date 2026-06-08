"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";

interface ProductsStageProps {
  t: any;
  language: string;
  featuredProducts: Product[];
}

const ProductsStage = ({ t, language, featuredProducts }: ProductsStageProps) => {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        left: container.scrollLeft - 320,
        behavior: "smooth"
      });
    }
  };

  const scrollRight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        left: container.scrollLeft + 320,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="w-full flex flex-col h-full pt-8 sm:pt-14 pb-6 sm:pb-8 gap-3 sm:gap-4">

      {/* Header Title */}
      <div className="shrink-0 container max-w-7xl mx-auto text-center px-4">
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

      {/* Floating product showcase - fills remaining space */}
      <div className="flex-1 min-h-0 flex items-center">
        {featuredProducts.length > 0 ? (
          <div className="relative w-full max-w-6xl mx-auto flex items-center group px-8 sm:px-12">
            {/* Left Arrow */}
            <button 
              type="button"
              onClick={scrollLeft}
              className="absolute left-0 z-40 p-1.5 sm:p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg text-primary hover:bg-primary hover:text-white transition-all opacity-100"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-3 sm:gap-4 py-2 sm:py-3 px-2 no-scrollbar snap-x snap-mandatory w-full"
              style={{ scrollBehavior: "smooth" }}
            >
              {featuredProducts.map((p, i) => {
                return (
                  <motion.div
                    key={p.id || p.name}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    whileHover={{
                      scale: 1.05,
                      z: 30,
                      boxShadow: "0px 15px 30px rgba(var(--color-primary), 0.12)"
                    }}
                    className="transition-all duration-300 relative shrink-0 snap-center w-[180px] sm:w-[220px] lg:w-[240px]"
                  >
                    <ProductCard p={p} variant="compact" />
                  </motion.div>
                );
              })}
            </div>

            {/* Right Arrow */}
            <button 
              type="button"
              onClick={scrollRight}
              className="absolute right-0 z-40 p-1.5 sm:p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg text-primary hover:bg-primary hover:text-white transition-all opacity-100"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        ) : (
          <div className="w-full text-center py-10 bg-card/50 rounded-2xl border border-dashed border-border/80 mx-4">
            <p className="text-muted-foreground">{t.products.noResults}</p>
          </div>
        )}
      </div>

      {/* View all products button */}
      <div className="shrink-0 container max-w-7xl mx-auto text-center px-4">
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
