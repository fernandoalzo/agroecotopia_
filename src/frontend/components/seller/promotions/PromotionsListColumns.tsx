import { createColumnHelper } from "@tanstack/react-table";
import { Tag, Percent, DollarSign, Calendar, Package, Store as StoreIcon, Trash2, Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Promotion } from "@/types/store";
import { cn } from "@/lib/utils";
import { useState } from "react";

const columnHelper = createColumnHelper<Promotion>();

const getScopeIcon = (scope: string) => {
  switch (scope) {
    case "ENTIRE_STORE": return <StoreIcon className="w-4 h-4 text-purple-500" />;
    case "SPECIFIC_PRODUCTS": return <Package className="w-4 h-4 text-blue-500" />;
    case "SINGLE_PRODUCT": return <Tag className="w-4 h-4 text-green-500" />;
    default: return <Tag className="w-4 h-4" />;
  }
};

const getScopeText = (scope: string) => {
  switch (scope) {
    case "ENTIRE_STORE": return "Toda la Tienda";
    case "SPECIFIC_PRODUCTS": return "Productos Seleccionados";
    case "SINGLE_PRODUCT": return "Un Solo Producto";
    default: return scope;
  }
};

export const getPromotionsColumns = (
  onToggleStatus: (id: string, isActive: boolean) => Promise<boolean>,
  onDelete: (id: string) => Promise<boolean>
) => [
  columnHelper.accessor("id", {
    header: "Promoción",
    cell: (info) => {
      const promo = info.row.original;
      return (
        <div className="flex flex-col gap-1 min-w-[200px]">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-foreground truncate">{promo.name}</h3>
            <Badge variant="outline" className="rounded-md border px-1.5 py-0 text-[9px] font-black uppercase tracking-widest shadow-sm">
              #{promo.id.slice(-6).toUpperCase()}
            </Badge>
          </div>
          {promo.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">{promo.description}</p>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("scope", {
    header: "Alcance",
    cell: (info) => {
      const promo = info.row.original;
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {getScopeIcon(promo.scope)}
          <span className="font-medium whitespace-nowrap">{getScopeText(promo.scope)}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("expiresAt", {
    header: "Expiración",
    cell: (info) => {
      const promo = info.row.original;
      const isExpired = new Date(promo.expiresAt) < new Date();
      return (
        <div className={cn(
          "flex items-center gap-1.5 text-xs whitespace-nowrap",
          isExpired ? "text-destructive" : "text-muted-foreground"
        )}>
          <Calendar className="w-3.5 h-3.5" />
          <span className="font-medium">{new Date(promo.expiresAt).toLocaleDateString()}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("discountValue", {
    header: "Descuento",
    cell: (info) => {
      const promo = info.row.original;
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 shrink-0">
            {promo.discountType === "PERCENTAGE" ? (
              <Percent className="w-4 h-4 text-emerald-600" />
            ) : (
              <DollarSign className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <span className="font-black text-emerald-600">
            {promo.discountType === "PERCENTAGE"
              ? `${Number(promo.discountValue)}% OFF`
              : `$${Number(promo.discountValue).toLocaleString()}`
            }
          </span>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Estado / Acciones",
    cell: (info) => {
      const promo = info.row.original;
      // We need a local component for the delete button state
      return (
        <PromotionActions 
          promo={promo} 
          onToggleStatus={onToggleStatus} 
          onDelete={onDelete} 
        />
      );
    },
  }),
];

function PromotionActions({ promo, onToggleStatus, onDelete }: any) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await onDelete(promo.id);
    if (!success) {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
          {promo.isActive ? "Activa" : "Inactiva"}
        </span>
        <Switch
          checked={promo.isActive}
          onCheckedChange={(checked) => onToggleStatus(promo.id, checked)}
          className="scale-90"
        />
      </div>
      
      {isDeleting ? (
        <Button variant="ghost" size="icon" disabled className="h-8 w-8 rounded-xl text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      ) : isConfirmingDelete ? (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
            onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(false); }}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="h-8 w-8 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20"
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/15 transition-colors"
          onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(true); }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
