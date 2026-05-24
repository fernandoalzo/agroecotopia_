"use client";

import { Check, Copy, Eye, Edit, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@prisma/client";

interface AdminProductCardDesktopProps {
  product: any;
  copiedId: string | null;
  hasStock: boolean;
  stockClass: string;
  stockLabel: string;
  onCopyId: () => void;
  onView: () => void;
  onEdit: () => void;
}

export const AdminProductCardDesktop = ({
  product,
  copiedId,
  hasStock,
  stockClass,
  stockLabel,
  onCopyId,
  onView,
  onEdit,
}: AdminProductCardDesktopProps) => {
  return (
    <div className="hidden lg:flex flex-1 items-stretch">
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
            <Badge variant="outline" className={cn("rounded-md border px-1.5 py-0 text-[9px] font-black uppercase tracking-widest shadow-sm", stockClass)}>
              {stockLabel}
            </Badge>
          </div>
        </div>

        {/* Name & Category */}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">Producto</p>
          <div className="text-sm font-bold truncate flex items-center gap-2">
            {product.name} 
            <div className="flex gap-1">
              {product.categories.map((c: any) => (
                <span key={c.id} className="text-xs font-normal text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md border border-border/50">{c.name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="w-24 shrink-0 text-right">
          <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">Precio</p>
          <p className="text-sm font-bold">${product.price.toLocaleString("es-CO")}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 justify-end w-24">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-colors" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-colors" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
