"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingCart, ChevronLeft, ChevronRight, Package, Star, Tag, Leaf, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import { SmallProductCardSkeleton } from "@/components/shared/SmallProductCardSkeleton";
import logger from "@/utils/logger";

const log = logger.child();




interface ProductsStageProps {
  t: any;
  language: string;
  initialProducts: Product[];
  loadPopularProducts: (page: number, limit: number) => Promise<{ products: Product[], total: number, totalPages: number }>;
}

const ProductsStage = ({ t, language, initialProducts, loadPopularProducts }: ProductsStageProps) => {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const words = (t.products.catalogDescription || t.products.description || "").split(" ");

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const res = await loadPopularProducts(nextPage, 10);
      if (res && res.products && res.products.length > 0) {
        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProds = res.products.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProds];
        });
        setPage(nextPage);
        if (nextPage >= res.totalPages || res.products.length < 10) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      log.error("Error loading more popular products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const isNearEnd = container.scrollWidth - container.scrollLeft - container.clientWidth < 400;
      if (isNearEnd) {
        loadMore();
      }
    }
  };

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
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">


      {/* Horizontal rule decorations */}
      <div
        className="absolute top-[10%] left-0 w-full h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.7 0.25 150 / 0.12), transparent)",
          animation: "products-line 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[10%] left-0 w-full h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.6 0.2 100 / 0.12), transparent)",
          animation: "products-line 5s ease-in-out 1s infinite",
        }}
      />

      {/* Content */}
      <motion.div
        animate={isNavigating ? { scale: 1.4, opacity: 0, filter: "blur(10px)" } : {}}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="relative z-10 w-full flex flex-col h-full pt-16 sm:pt-20 pb-3 sm:pb-4 gap-2 sm:gap-3"
      >

        {/* Header Title */}
        <div className="shrink-0 container max-w-7xl mx-auto text-center px-4">
          {/* Badge */}
          <div
            className="mb-2"
          >
            <span className="inline-flex items-center gap-2 text-[9px] sm:text-[11px] font-bold text-primary/70 tracking-[0.25em] uppercase">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
                style={{
                  willChange: "transform",
                  animation: "dot-pulse 2s ease-in-out infinite",
                }}
              />
              {language === "es" ? "Nuestra Cosecha" : "Our Harvest"}
            </span>
          </div>

          {/* Title */}
          <h2
            className="text-2xl sm:text-4xl md:text-5xl font-black leading-[1.05] mb-2"
          >
            {t.products.title.split(' ')[0]}{' '}
            <span
              className="inline-block bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_200%] bg-clip-text text-transparent"
              style={{ animation: "gradient-shift 4s ease-in-out infinite" }}
            >
              {t.products.title.split(' ').slice(1).join(' ')}
            </span>
          </h2>

          {/* Animated decorative line */}
          <div
            className="h-0.5 w-14 sm:w-20 bg-gradient-to-r from-primary/60 via-accent/40 to-transparent rounded-full mb-3 mx-auto origin-center"
          />

          {/* Description — CSS word reveal */}
          <p className="text-muted-foreground/90 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
            {words.map((word: string, i: number) => (
              <span
                key={i}
                className="inline-block mr-[0.25em]"
                style={{
                  animation: `word-fade 0.4s ease-out ${0.5 + i * 0.025}s both`,
                }}
              >
                {word}
              </span>
            ))}
          </p>
        </div>

        {/* Floating product showcase - fills remaining space */}
        <div className="flex-1 min-h-0 flex items-center">
          {products.length > 0 ? (
            <div className="relative w-full max-w-6xl mx-auto flex items-center group px-6 sm:px-10">
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
                onScroll={handleScroll}
                className="flex overflow-x-auto gap-2 sm:gap-3 py-1 sm:py-2 px-1 no-scrollbar snap-x snap-mandatory w-full"
                style={{ scrollBehavior: "smooth" }}
              >
                {products.map((p, i) => {
                  return (
                    <div
                      key={p.id || p.name}
                      className="relative shrink-0 snap-center w-[130px] sm:w-[160px] lg:w-[180px]"
                    >
                      <ProductCard p={p} variant="compact" />
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="relative shrink-0 snap-center w-[130px] sm:w-[160px] lg:w-[180px]">
                    <SmallProductCardSkeleton />
                  </div>
                )}
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
            onClick={() => {
              setIsNavigating(true);
              setTimeout(() => {
                router.push('/products');
              }, 800);
            }}
            disabled={isNavigating}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-display text-sm font-bold text-white shadow-lg hover:bg-primary/95 transition-all hover:scale-105 active:scale-95 group cursor-pointer relative z-50 disabled:opacity-70"
          >
            <span>{t.products.viewAll}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </motion.div>

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.5); opacity: 1; }
        }

        @keyframes products-line {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
        @keyframes word-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ProductsStage;
