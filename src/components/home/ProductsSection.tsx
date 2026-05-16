"use client";

import { motion, animate } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface MarqueeRowProps {
  items: Product[];
  direction?: "left" | "right";
  speed?: number;
}

const MarqueeRow = ({ items, direction = "left", speed = 40 }: MarqueeRowProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<any>(null);

  // Duplicar items para un loop infinito perfecto (4 sets = 25% cada uno)
  const duplicated = [...items, ...items, ...items, ...items];

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    // Usamos porcentajes para la animación. Es mucho más robusto para responsive
    // y no requiere medir scrollWidth en cada cambio de pantalla.
    const xRange = direction === "left" ? ["0%", "-25%"] : ["-25%", "0%"];

    // Iniciar la animación con porcentajes
    animationRef.current = animate(
      content,
      { x: xRange },
      {
        duration: speed,
        ease: "linear",
        repeat: Infinity,
      }
    );

    if (isPaused) {
      animationRef.current?.pause();
    }

    return () => animationRef.current?.stop();
  }, [direction, speed, items.length]);

  useEffect(() => {
    if (isPaused) {
      animationRef.current?.pause();
    } else {
      animationRef.current?.play();
    }
  }, [isPaused]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden py-4"
      // Solo pausar con puntero de ratón para evitar problemas en móviles
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setIsPaused(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setIsPaused(false);
      }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background via-background/50 to-transparent md:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background via-background/50 to-transparent md:w-32" />

      <motion.div
        ref={contentRef}
        className="flex w-max gap-4 px-3 md:gap-6"
        drag="x"
        dragConstraints={containerRef}
        onDragStart={() => setIsPaused(true)}
        onDragEnd={() => setIsPaused(false)}
        style={{ cursor: isPaused ? "grabbing" : "grab" }}
      >
        {duplicated.map((p, i) => (
          <ProductCard key={`${p.name}-${i}`} p={p} />
        ))}
      </motion.div>
    </div>
  );
};

interface ProductsSectionProps {
  initialProducts: Product[];
}

const ProductsSection = ({ initialProducts }: ProductsSectionProps) => {
  const { t, language } = useLanguage();
  // Dividir dinámicamente el array de productos en dos filas
  const midPoint = Math.ceil(initialProducts.length / 2);
  const row1 = initialProducts.slice(0, midPoint);
  const row2 = initialProducts.slice(midPoint);

  return (
    <section id="productos" className="relative bg-secondary/30 py-24 md:py-32 overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute left-1/4 top-1/4 -z-10 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute right-1/4 bottom-1/4 -z-10 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" />

      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16 text-center md:mb-24"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary md:text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            {language === 'es' ? "Nuestra Selección" : "Our Selection"}
          </div>
          <h2 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-7xl">
            {t.products.title.split(' ')[0]} <span className="text-primary">{t.products.title.split(' ').slice(1).join(' ')}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl font-body text-base leading-relaxed text-muted-foreground md:text-lg">
            {t.products.description}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 text-xs font-medium text-muted-foreground md:text-sm">
            <span className="h-px w-8 bg-border" />
            {language === 'es' ? 'Pasa el mouse para pausar o desliza para explorar' : 'Hover to pause or swipe to explore'}
            <span className="h-px w-8 bg-border" />
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col gap-8 md:gap-12 mb-16">
        <div className="relative">
          <MarqueeRow items={row1} direction="left" speed={45} />
        </div>
        <div className="relative">
          <MarqueeRow items={row2} direction="right" speed={50} />
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 flex justify-center">
        <Link
          href="/products"
          className="group relative inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-lg font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-primary/25 active:scale-95"
        >
          <span>{t.products.viewAll}</span>
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            →
          </motion.span>
        </Link>
      </div>
    </section>
  );
};

export default ProductsSection;


