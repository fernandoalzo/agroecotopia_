"use client";

import { useState } from "react";
import { ShoppingCart, Tag } from "lucide-react";
import { Product } from "@/types";
import ProductModal from "./ProductModal";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

const ProductCard = ({ p, priority = false, variant = 'grid' }: { p: Product, priority?: boolean, variant?: 'grid' | 'compact' | 'list' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t, language } = useLanguage();

  const productTranslation = t.products.items[p.slug] || {
    name: p.name,
    description: p.description,
    unit: p.unidad
  };

  const isList = variant === 'list';
  const isCompact = variant === 'compact';

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={`group relative w-full mx-auto overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card hover:shadow-2xl cursor-pointer 
          dark:hover:shadow-[0_0_30px_-5px_oklch(0.55_0.12_145_/_0.4)] dark:hover:border-primary/50
          ${p.stock === 0 ? "grayscale-[0.4] opacity-80 shadow-none border-stone-200" : ""}
          ${isList ? "flex flex-col md:flex-row max-w-none p-4 md:p-6 gap-6 items-center" : "flex flex-col max-w-[340px] h-full p-6 md:p-8"}`}
      >

        {p.stock === 0 && (
          <>
            {/* Card Veil */}
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px] z-20 pointer-events-none rounded-2xl" />
            {/* Professional Ribbon */}
            <div className={`absolute top-0 left-0 z-40 overflow-hidden pointer-events-none ${isCompact ? "h-20 w-20" : "h-28 w-28"}`}>
              <div className={`absolute left-[-52px] w-[220px] -rotate-45 bg-[#991b1b] py-2 text-center font-black uppercase tracking-[0.3em] text-[#fefce8] shadow-[0_4px_20px_rgba(0,0,0,0.4)] border-y border-white/10 ${isCompact ? "top-[20px] text-[7px]" : "top-[32px] text-[9px]"}`}>
                {t.products.outOfStock}
              </div>
            </div>
          </>
        )}

        <div className={`${isList ? "flex-shrink-0" : "mb-4 flex items-center justify-between"}`}>
          <div className={`flex items-center justify-center rounded-xl bg-primary/10 shadow-inner relative overflow-hidden
            ${isCompact ? "h-14 w-14 text-3xl" : isList ? "h-28 w-28 md:h-36 md:w-36 text-5xl" : "h-16 w-16 text-4xl md:h-20 md:w-20 md:text-5xl"}`}>
            {p.images && p.images.length > 0 ? (
              <Image 
                src={p.images[0]} 
                alt={productTranslation.name} 
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={priority}
                className="object-cover"
              />
            ) : (
              <span className="relative z-10">{p.emoji}</span>
            )}
          </div>
        </div>

        <div className={`flex flex-col flex-grow ${isList ? "w-full" : ""}`}>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5 text-primary/60 uppercase font-black text-[10px] tracking-[0.15em]">
              <Tag className="w-3 h-3" />
              {p.categoria}
            </div>
            {p.tag && (
              <div className="flex items-center gap-1.5 text-accent uppercase font-black text-[10px] tracking-[0.15em]">
                <Tag className="w-3 h-3" />
                {p.tag}
              </div>
            )}
          </div>

          <h3 className={`font-display font-bold text-card-foreground leading-tight ${isCompact ? "text-base mb-1" : isList ? "text-2xl md:text-3xl mb-2" : "text-xl md:text-2xl mb-2"}`}>
            {productTranslation.name}
          </h3>
          
          <p className={`font-body leading-relaxed text-muted-foreground ${isCompact ? "text-xs mb-3 line-clamp-1" : isList ? "text-sm md:text-base mb-4 md:mb-6 line-clamp-2 md:line-clamp-3" : "text-sm mb-6 line-clamp-3"}`}>
            {productTranslation.description}
          </p>

          <div className={`${isList ? "mt-auto md:mt-0 flex flex-col md:flex-row md:items-center justify-between gap-4" : "mt-auto space-y-4"}`}>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {language === 'es' ? 'Precio sugerido' : 'Suggested price'}
              </span>
              <span className={`font-display font-black text-primary ${isCompact ? "text-xl" : isList ? "text-2xl md:text-4xl" : "text-2xl md:text-3xl"}`}>
                {p.price}
              </span>
            </div>

            <button
              className={`group/btn relative overflow-hidden rounded-xl bg-primary font-body font-bold text-primary-foreground transition-all hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-[1.02] active:scale-95 z-10 flex items-center justify-center gap-2
                ${isCompact ? "w-full py-2.5 text-xs" : isList ? "w-full md:w-auto md:px-8 py-4 text-sm" : "w-full py-4 text-sm"}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
            >
              <ShoppingCart className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
              <span>{t.products.viewDetails}</span>
            </button>
          </div>
        </div>
      </div>

      <ProductModal
        product={p}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ProductCard;
