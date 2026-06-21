"use client";

import { Check, Copy, Eye, Image as ImageIcon, Store, Tag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";
import { calculateDiscountedPrice } from "@/utils/promotions";

interface ProductCardMobileProps {
  product: any;
  copiedId: string | null;
  stockClass: string;
  stockLabel: string;
  onCopyId: () => void;
  onView: () => void;
}

export const ProductCardMobile = ({
  product,
  copiedId,
  stockClass,
  stockLabel,
  onCopyId,
  onView,
}: ProductCardMobileProps) => {
  const discountedPrice = calculateDiscountedPrice(
    Number(product.price),
    product.promotions,
    product.store?.promotions
  );
  
  const hasDiscount = discountedPrice !== null;

  return (
    <div className="flex-1 p-4 lg:hidden relative overflow-hidden">
      {hasDiscount && (
        <div className="absolute top-0 right-0 z-10 pointer-events-none">
          <div className="bg-red-500 text-white text-[8px] font-black uppercase tracking-widest py-0.5 px-6 translate-x-[30%] translate-y-2 rotate-45 shadow-sm shadow-red-500/20">
            Oferta
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-3 pr-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black tracking-tight">#{product.id.slice(-6).toUpperCase()}</span>
          <Badge variant="outline" className={cn("rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-sm", stockClass)}>
            {stockLabel}
          </Badge>
          {hasDiscount && (
            <Badge variant="outline" className="rounded-md border-red-500/30 bg-red-500/10 text-red-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" /> Promo
            </Badge>
          )}
        </div>
        <button
          onClick={onCopyId}
          className="text-muted-foreground/40 hover:text-primary transition-colors flex items-center justify-center p-1"
        >
          {copiedId === product.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 border border-border/50 overflow-hidden">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base truncate pr-2">{product.name}</h3>
          {product.store?.name && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground/80 my-0.5">
              <Store className="w-3 h-3 text-primary/70" />
              <span className="truncate">{product.store.name}</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1 mt-1">
            <span className="truncate mr-1">{product.categories.map((c: any) => c.name).join(", ")}</span>
            {hasDiscount ? (
              <div className="flex items-center gap-1.5">
                <span className="line-through decoration-muted-foreground/50">${Number(product.price).toLocaleString("es-CO")}</span>
                <span className="font-black text-red-500 text-sm">${discountedPrice.toLocaleString("es-CO")}</span>
              </div>
            ) : (
              <span className="font-semibold text-foreground/80 text-sm">${Number(product.price).toLocaleString("es-CO")}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs font-bold" onClick={onView}>
            <Eye className="w-3.5 h-3.5 mr-1" />
            Ver
          </Button>
      </div>
    </div>
  );
};
