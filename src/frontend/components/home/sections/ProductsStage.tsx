"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingCart, ChevronLeft, ChevronRight, Package, Star, Tag, Leaf, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";

const FLOATING_ICONS = [
  { Icon: ShoppingCart, x: 5, y: 12, size: 22, delay: 0, driftX: 35, driftY: -25, duration: 8 },
  { Icon: Package, x: 92, y: 20, size: 20, delay: 1.5, driftX: -30, driftY: -30, duration: 10 },
  { Icon: Star, x: 10, y: 78, size: 18, delay: 0.8, driftX: 25, driftY: 20, duration: 9 },
  { Icon: Tag, x: 88, y: 75, size: 24, delay: 2.2, driftX: -20, driftY: -25, duration: 11 },
  { Icon: Leaf, x: 50, y: 6, size: 16, delay: 3, driftX: 40, driftY: 15, duration: 7 },
];

function FloatingIcon({
  Icon,
  x,
  y,
  size,
  delay,
  driftX,
  driftY,
  duration,
}: {
  Icon: React.ElementType;
  x: number;
  y: number;
  size: number;
  delay: number;
  driftX: number;
  driftY: number;
  duration: number;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        willChange: "transform",
        animation: `products-float ${duration}s ease-in-out ${delay}s infinite`,
        "--dx1": `${driftX * 0.3}px`,
        "--dy1": `${driftY * 0.3}px`,
        "--dx2": `${driftX * 0.7}px`,
        "--dy2": `${driftY * 0.7}px`,
        "--dx3": `${driftX}px`,
        "--dy3": `${driftY}px`,
      } as React.CSSProperties}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
        <Icon className="text-primary/30" style={{ width: size, height: size }} />
      </div>
    </div>
  );
}

interface ProductsStageProps {
  t: any;
  language: string;
  featuredProducts: Product[];
}

const ProductsStage = ({ t, language, featuredProducts }: ProductsStageProps) => {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const words = (t.products.catalogDescription || t.products.description || "").split(" ");

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
      {/* Floating icons */}
      <div className="absolute inset-0 pointer-events-none">
        {FLOATING_ICONS.map((item, i) => (
          <FloatingIcon key={i} {...item} />
        ))}
      </div>

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
          {featuredProducts.length > 0 ? (
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
                className="flex overflow-x-auto gap-2 sm:gap-3 py-1 sm:py-2 px-1 no-scrollbar snap-x snap-mandatory w-full"
                style={{ scrollBehavior: "smooth" }}
              >
                {featuredProducts.map((p, i) => {
                  return (
                    <div
                      key={p.id || p.name}
                      className="relative shrink-0 snap-center w-[130px] sm:w-[160px] lg:w-[180px]"
                    >
                      <ProductCard p={p} variant="compact" />
                    </div>
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
        @keyframes products-float {
          0% { opacity: 0; transform: translate(0, 0) scale(0) rotate(0deg); }
          25% { opacity: 0.25; transform: translate(var(--dx1), var(--dy1)) scale(1) rotate(15deg); }
          50% { opacity: 0.15; transform: translate(var(--dx2), var(--dy2)) scale(0.9) rotate(-10deg); }
          75% { opacity: 0.25; transform: translate(var(--dx3), var(--dy3)) scale(1) rotate(5deg); }
          100% { opacity: 0; transform: translate(0, 0) scale(0) rotate(0deg); }
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
