"use client";

import { Check, Copy, Eye, Edit, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@prisma/client";

interface ProductCardMobileProps {
  product: any;
  copiedId: string | null;
  stockClass: string;
  stockLabel: string;
  onCopyId: () => void;
  onView: () => void;
  onEdit: () => void;
}

export const ProductCardMobile = ({
  product,
  copiedId,
  stockClass,
  stockLabel,
  onCopyId,
  onView,
  onEdit,
}: ProductCardMobileProps) => {
  return (
    <div className="flex-1 p-4 lg:hidden">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black tracking-tight">#{product.id.slice(-6).toUpperCase()}</span>
          <Badge variant="outline" className={cn("rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-sm", stockClass)}>
            {stockLabel}
          </Badge>
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
          <h3 className="font-bold text-base truncate">{product.name}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="truncate">{product.categories.map((c: any) => c.name).join(", ")}</span> • <span className="font-semibold text-foreground/80">${product.price.toLocaleString("es-CO")}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs font-bold" onClick={onView}>
            <Eye className="w-3.5 h-3.5 mr-1" />
            Ver
          </Button>
      </div>
    </div>
  );
};
