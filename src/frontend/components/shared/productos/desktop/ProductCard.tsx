"use client";

import { Check, Copy, Eye, Image as ImageIcon, Store, Tag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";
import { calculateDiscountedPrice } from "@/utils/promotions";

interface ProductCardDesktopProps {
  product: any;
  copiedId: string | null;
  hasStock: boolean;
  stockClass: string;
  stockLabel: string;
  onCopyId: () => void;
  onView: () => void;
}

export const ProductCardDesktop = ({
  product,
  copiedId,
  hasStock,
  stockClass,
  stockLabel,
  onCopyId,
  onView,
}: ProductCardDesktopProps) => {
  const discountedPrice = calculateDiscountedPrice(
    Number(product.price),
    product.promotions,
    product.store?.promotions
  );
  
  const hasDiscount = discountedPrice !== null;

  return (
    <div className="hidden lg:flex flex-1 items-stretch relative overflow-hidden">
      {hasDiscount && (
        <div className="absolute top-0 right-0 z-10 pointer-events-none">
          <div className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-8 translate-x-[25%] translate-y-3 rotate-45 shadow-sm shadow-red-500/20">
            Oferta
          </div>
        </div>
      )}

      <div className={cn("w-[4px] h-auto my-4 shrink-0 rounded-full ml-3 transition-all duration-300", hasStock ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]")} />

      <div className="flex-1 p-3 xl:p-5 flex items-center gap-4 xl:gap-6 min-w-0">

        {/* ID & Image */}
        <div className="flex items-center gap-3 w-44 xl:w-56 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 border border-border/50 overflow-hidden">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm font-black tracking-tight truncate">#{product.id.slice(-6).toUpperCase()}</span>
              <button onClick={onCopyId} className="text-muted-foreground/40 hover:text-primary transition-colors">
                {copiedId === product.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("rounded-md border px-1.5 py-0 text-[9px] font-black uppercase tracking-widest shadow-sm", stockClass)}>
                {stockLabel}
              </Badge>
              {hasDiscount && (
                <Badge variant="outline" className="rounded-md border-red-500/30 bg-red-500/10 text-red-500 px-1.5 py-0 text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" /> Promo
                </Badge>
              )}
            </div>
            {/* Store Info */}
            {product.store?.name && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mt-1">
                <Store className="w-3.5 h-3.5 text-primary/70" />
                <span className="truncate">{product.store.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Name & Category */}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">Producto</p>
          <div className="text-sm font-bold truncate flex items-center gap-2 mb-1">
            {product.name}
            <div className="flex gap-1">
              {product.categories.map((c: any) => (
                <span key={c.id} className="text-xs font-normal text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md border border-border/50">{c.name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="w-24 xl:w-32 shrink-0 text-right pr-4">
          <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">Precio</p>
          {hasDiscount ? (
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground line-through decoration-muted-foreground/50">${Number(product.price).toLocaleString("es-CO")}</span>
              <span className="text-sm font-black text-red-500">${discountedPrice.toLocaleString("es-CO")}</span>
            </div>
          ) : (
            <p className="text-sm font-bold">${Number(product.price).toLocaleString("es-CO")}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 justify-end w-24">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-colors" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
