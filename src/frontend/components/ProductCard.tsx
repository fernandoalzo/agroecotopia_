"use client";

import { useState } from "react";
import { ShoppingCart, Star, StarHalf, Tag, ShieldCheck, Truck, ArrowRight } from "lucide-react";
import { Product } from "@/types";
import ProductModal from "./ProductModal";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { getDeterministicImage } from "@/lib/image-utils";
import { config } from "@/config/config";

interface ProductCardProps {
  p: Product;
  priority?: boolean;
  variant?: 'grid' | 'compact' | 'list';
}

const ProductCard = ({ p, priority = false, variant = 'grid' }: ProductCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t, language } = useLanguage();

  const productTranslation = t.products.items[p.id!] || {
    name: p.name,
    description: p.description,
    unit: p.unidad
  };

  // Mock data for Amazon-style feel
  // We use a constant seed based on name to keep it consistent per product
  const seed = p.name.length;
  const rating = 4.5 + (seed % 6) / 10;
  const totalReviews = 50 + (seed * 7) % 500;
  const isAgroChoice = p.price > 15000 || p.stock < 10;
  const isBestSeller = p.stock > 40;

  const isList = variant === 'list';
  const isCompact = variant === 'compact';

  if (isList) {
    return (
      <>
        <div
          onClick={() => setIsModalOpen(true)}
          className="group relative flex flex-col md:flex-row w-full bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300 rounded-lg overflow-hidden cursor-pointer p-4 gap-6"
        >
          {/* List Image */}
          <div className="relative w-full md:w-[240px] aspect-square bg-secondary/40 dark:bg-[#121212] flex items-center justify-center rounded-md overflow-hidden flex-shrink-0 transition-all duration-500">
            {p.images && p.images.length > 0 && p.images[0]?.trim() !== "" ? (
              <Image
                src={getDeterministicImage(p.images[0], p.id!)}
                alt={productTranslation.name}
                fill
                sizes="240px"
                priority={priority}
                loading={priority ? "eager" : "lazy"}
                className="object-contain p-4 group-hover:scale-115 transition-transform duration-700 ease-out"
              />
            ) : (
              <span className="text-7xl drop-shadow-[0_0_30px_rgba(var(--primary),0.2)]">{p.emoji || "📦"}</span>
            )}

            {p.stock === 0 && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-30 overflow-hidden">
                <div className="absolute top-10 -right-12 w-48 rotate-45 bg-[#b12704] py-1.5 text-center text-[12px] font-black uppercase tracking-[0.2em] text-white shadow-xl border-y border-white/20">
                  {t.products.outOfStock}
                </div>
              </div>
            )}
          </div>

          {/* List Details */}
          <div className="flex flex-col flex-grow py-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              {isBestSeller && (
                <div className="bg-[#e47911] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm">
                  {language === 'es' ? 'Los más vendidos' : 'Best Seller'}
                </div>
              )}
              {isAgroChoice && (
                <div className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] dark:from-[#fbbf24] dark:to-[#f59e0b] text-white dark:text-black text-[10px] font-black px-2.5 py-1 rounded-sm shadow-lg flex items-center gap-1.5 border border-white/20 dark:border-black/10">
                  <span className="uppercase tracking-tighter">{config.app.name}'s</span> 
                  <span className="uppercase tracking-widest text-[#fefce8] dark:text-black/80 font-black">Choice</span>
                </div>
              )}
            </div>

            <h3 className="font-display font-bold text-xl md:text-2xl text-foreground mb-1 group-hover:text-[#007185] transition-colors line-clamp-2">
              {productTranslation.name}
            </h3>

            <div className="flex items-center gap-1 mb-3">
              <div className="flex text-[#ffa41c]">
                {[...Array(4)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                <StarHalf className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="text-sm text-[#007185] hover:text-[#c45500] font-medium">
                {totalReviews}
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-sm font-bold">$</span>
              <span className="text-3xl font-black text-foreground">{p.price.toLocaleString()}</span>
              {p.unidad && <span className="text-xs text-muted-foreground font-medium ml-1">/ {p.unidad}</span>}
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Truck className="w-4 h-4 text-primary" />
                <span>{language === 'es' ? 'Envío gratis disponible' : 'Free shipping available'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>{language === 'es' ? 'Producto de origen agroecológico' : 'Agroecological source product'}</span>
              </div>
              {p.stock < 10 && p.stock > 0 && (
                <p className="text-xs font-bold text-[#b12704]">
                  {language === 'es' ? `¡Solo quedan ${p.stock} en stock!` : `Only ${p.stock} left in stock!`}
                </p>
              )}
            </div>

            <div className="mt-auto flex flex-wrap gap-4">
              <button
                className={`flex items-center justify-center gap-2 py-2 px-8 rounded-full font-bold text-sm transition-all shadow-sm
                  ${p.stock === 0
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] active:shadow-inner border border-[#fcd200]"}`}
              >
                <ShoppingCart className="w-4 h-4" />
                {p.stock === 0 ? t.products.noStock : t.products.addToCart}
              </button>
              <button className="text-sm font-bold text-[#007185] hover:text-[#c45500] flex items-center gap-1 transition-colors px-4">
                {t.products.viewDetails} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <ProductModal product={p} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  if (isCompact) {
    return (
      <>
        <div
          onClick={() => setIsModalOpen(true)}
          className="group relative flex flex-col w-full bg-card border border-border shadow-card hover:shadow-card-hover hover:scale-[1.03] hover:-translate-y-2 hover:border-primary transition-all duration-500 rounded-xl overflow-hidden cursor-pointer"
        >
          <div className="relative aspect-square w-full bg-secondary/40 dark:bg-[#121212] flex items-center justify-center overflow-hidden transition-all duration-500">
            {p.images && p.images.length > 0 && p.images[0]?.trim() !== "" ? (
              <Image
                src={getDeterministicImage(p.images[0], p.id!)}
                alt={productTranslation.name}
                fill
                sizes="200px"
                priority={priority}
                loading={priority ? "eager" : "lazy"}
                className="object-contain p-2 group-hover:scale-115 transition-transform duration-700 ease-out"
              />
            ) : (
              <span className="text-5xl drop-shadow-[0_0_20px_rgba(var(--primary),0.2)]">{p.emoji || "📦"}</span>
            )}

            {p.stock === 0 && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[0.5px] z-30 overflow-hidden">
                <div className="absolute top-6 -right-10 w-32 rotate-45 bg-[#b12704] py-1 text-center text-[8px] font-black uppercase tracking-[0.15em] text-white shadow-lg border-y border-white/20">
                  {t.products.outOfStock}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 flex flex-col flex-grow">
            <h3 className="font-display font-bold text-sm text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {productTranslation.name}
            </h3>

            <div className="flex items-center gap-1 mb-2">
              <div className="flex text-[#ffa41c]">
                <Star className="w-3 h-3 fill-current" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">
                {rating.toFixed(1)} ({totalReviews})
              </span>
            </div>

            <div className="mt-auto">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[10px] font-bold">$</span>
                <span className="text-lg font-black text-foreground">{p.price.toLocaleString()}</span>
              </div>
              {p.stock === 0 ? (
                <p className="text-[10px] font-bold text-red-600 uppercase mt-1">{t.products.outOfStock}</p>
              ) : (
                <div className="flex items-center gap-1 text-[9px] text-[#007600] font-bold mt-1">
                  <Truck className="w-2.5 h-2.5" />
                  {language === 'es' ? 'Recíbelo pronto' : 'Get it soon'}
                </div>
              )}
            </div>
          </div>
        </div>

        <ProductModal product={p} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // Default Grid layout
  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group relative flex flex-col w-full h-full bg-card border border-border shadow-card hover:shadow-card-hover hover:scale-[1.03] hover:-translate-y-2 hover:border-primary transition-all duration-500 rounded-xl overflow-hidden cursor-pointer"
      >
        {/* Amazon-style Badges */}
        <div className="absolute top-0 left-0 z-20 flex flex-col gap-1 p-2">
          {isBestSeller && (
            <div className="bg-[#e47911] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current" />
              {language === 'es' ? 'Los más vendidos' : 'Best Seller'}
            </div>
          )}
          {isAgroChoice && (
            <div className="bg-[#232f3e] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm flex items-center gap-1">
              <span className="text-primary-foreground">{config.app.name}'s</span>
              <span className="text-[#e47911]">Choice</span>
            </div>
          )}
        </div>

        {/* Product Image Container */}
        <div className="relative aspect-square w-full bg-secondary/40 dark:bg-[#121212] flex items-center justify-center overflow-hidden transition-all duration-500">
          {p.images && p.images.length > 0 && p.images[0]?.trim() !== "" ? (
            <Image
              src={getDeterministicImage(p.images[0], p.id!)}
              alt={productTranslation.name}
              fill
              sizes="300px"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              className="object-contain p-4 group-hover:scale-115 transition-transform duration-700 ease-out"
            />
          ) : (
            <span className="text-7xl group-hover:scale-115 transition-transform duration-700 ease-out drop-shadow-[0_0_40px_rgba(var(--primary),0.3)]">{p.emoji || "📦"}</span>
          )}

          {/* Quick View Overlay (Only visible on hover) */}
          <div className="absolute inset-0 bg-black/5 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 z-20">
            <span className="bg-white/90 dark:bg-black/60 dark:text-white backdrop-blur-md text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg border border-border/50 dark:border-white/10 text-foreground">
              {language === 'es' ? 'Vista Rápida' : 'Quick View'}
            </span>
          </div>

          {/* Sold Out Ribbon */}
          {p.stock === 0 && (
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px] z-30 overflow-hidden pointer-events-none">
              <div className="absolute top-10 -right-12 w-48 rotate-45 bg-[#b12704] py-2 text-center text-[12px] font-black uppercase tracking-[0.2em] text-white shadow-2xl border-y border-white/20">
                {t.products.outOfStock}
              </div>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Category & Icons */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
              {p.categories.map((c: any) => c.name).join(", ")}
            </span>
            <div className="flex gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              <Truck className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>

          <h3 className="font-display font-bold text-base text-foreground mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {productTranslation.name}
          </h3>

          {/* Amazon Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex text-[#ffa41c]">
              {[...Array(4)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
              <StarHalf className="w-3 h-3 fill-current" />
            </div>
            <span className="text-xs text-[#007185] hover:text-[#c45500] font-medium">
              {totalReviews}
            </span>
          </div>

          {/* Price Section */}
          <div className="mt-auto pt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold self-start mt-1">$</span>
              <span className="text-2xl font-black text-foreground">{p.price.toLocaleString()}</span>
              {p.unidad && <span className="text-[10px] text-muted-foreground font-medium ml-1">/ {p.unidad}</span>}
            </div>

            {/* Delivery/Stock Info */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Truck className="w-3 h-3" />
                <span>{language === 'es' ? 'Envío gratis disponible' : 'Free shipping available'}</span>
              </div>

              {p.stock < 10 && p.stock > 0 && (
                <p className="text-[10px] font-bold text-[#b12704]">
                  {language === 'es' ? `¡Solo quedan ${p.stock} en stock!` : `Only ${p.stock} left in stock!`}
                </p>
              )}
              {p.stock === 0 && (
                <p className="text-[10px] font-bold text-[#b12704]">
                  {t.products.outOfStock}
                </p>
              )}
            </div>

            {/* Amazon-style Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className={`w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-full font-bold text-xs transition-all shadow-sm
                ${p.stock === 0
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] active:shadow-inner border border-[#fcd200]"}`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {p.stock === 0 ? t.products.noStock : t.products.viewDetails}
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
