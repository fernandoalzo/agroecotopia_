import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Check, Copy, Eye, Image as ImageIcon, Store, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Product } from "@/types";
import { calculateDiscountedPrice } from "@/utils/promotions";

export const getAdminProductColumns = (
  onViewProduct: (product: Product) => void
) => {
  const columnHelper = createColumnHelper<Product>();

  return [
    columnHelper.accessor("id", {
      header: "Producto",
      cell: ({ row }) => {
        const product = row.original;
        const [copiedId, setCopiedId] = useState<string | null>(null);

        const handleCopyId = (e: React.MouseEvent) => {
          e.stopPropagation();
          navigator.clipboard.writeText(product.id);
          setCopiedId(product.id);
          toast.success("ID copiado");
          setTimeout(() => setCopiedId(null), 2000);
        };

        const hasStock = Number(product.stock) > 0;
        const stockClass = hasStock ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" : "text-red-500 bg-red-500/10 border-red-500/20";
        const stockLabel = hasStock ? `Stock: ${Number(product.stock)}` : "Agotado";

        return (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-[4px] h-10 shrink-0 rounded-full transition-all duration-300",
                hasStock ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              )}
            />
            <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 border border-border/50 overflow-hidden">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
              )}
            </div>
            <div className="min-w-0 w-40">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight truncate">
                  #{product.id.slice(-6).toUpperCase()}
                </span>
                <button
                  onClick={handleCopyId}
                  className="text-muted-foreground/40 hover:text-primary transition-colors flex items-center justify-center p-0.5"
                  title="Copiar ID"
                >
                  {copiedId === product.id ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md border px-1.5 py-0 text-[9px] font-black uppercase tracking-widest pointer-events-none shadow-sm whitespace-nowrap",
                    stockClass
                  )}
                >
                  {stockLabel}
                </Badge>
              </div>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("name", {
      header: "Detalles",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="min-w-0 w-48 xl:w-64">
            <p className="text-sm font-bold truncate mb-1">
              {product.name}
            </p>
            <div className="flex flex-wrap gap-1">
              {product.categories.map((c: any) => (
                <span key={c.id} className="text-[10px] font-medium text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md border border-border/50">
                  {c.name}
                </span>
              ))}
            </div>
            {product.store?.name && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mt-1.5">
                <Store className="w-3.5 h-3.5 text-primary/70" />
                <span className="truncate">{product.store.name}</span>
              </div>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("price", {
      header: () => <div className="text-right w-full">Precio</div>,
      cell: ({ row }) => {
        const product = row.original;
        const discountedPrice = calculateDiscountedPrice(
          Number(product.price),
          product.promotions,
          product.store?.promotions
        );
        const hasDiscount = discountedPrice !== null;

        return (
          <div className="w-full shrink-0 flex flex-col items-end justify-center pr-2">
            {hasDiscount ? (
              <>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] line-through text-muted-foreground/50">${Number(product.price).toLocaleString("es-CO")}</span>
                  <Tag className="h-3 w-3 text-red-500" />
                </div>
                <span className="text-sm font-black text-red-600">${discountedPrice.toLocaleString("es-CO")}</span>
              </>
            ) : (
              <p className="text-sm font-bold">
                ${Number(product.price).toLocaleString("es-CO")}
              </p>
            )}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 shrink-0 justify-end w-16">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onViewProduct(row.original);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    }),
  ];
};
