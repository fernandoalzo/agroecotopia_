"use client";

import { useState } from "react";

import { motion } from "framer-motion";
import { Tag, Percent, DollarSign, Calendar, Package, Store as StoreIcon, Trash2, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PromotionCardProps {
  promo: any;
  index: number;
  onToggleStatus: (id: string, isActive: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export const PromotionCard = ({ promo, index, onToggleStatus, onDelete }: PromotionCardProps) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await onDelete(promo.id);
    if (!success) {
      setIsDeleting(false);
    }
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "ENTIRE_STORE": return <StoreIcon className="w-3.5 h-3.5 text-purple-500" />;
      case "SPECIFIC_PRODUCTS": return <Package className="w-3.5 h-3.5 text-blue-500" />;
      case "SINGLE_PRODUCT": return <Tag className="w-3.5 h-3.5 text-green-500" />;
      default: return <Tag className="w-3.5 h-3.5" />;
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

  const isExpired = new Date(promo.expiresAt) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card className={cn(
        "group overflow-hidden rounded-2xl backdrop-blur-md transition-all duration-300 border bg-card/60 hover:bg-card hover:shadow-lg hover:shadow-primary/5",
        promo.isActive ? "hover:border-primary/20 border-border/50" : "border-border/40 opacity-75"
      )}>
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row lg:items-stretch relative">
            
            {/* Visual Indicator Bar */}
            <div className={cn(
              "w-full h-1.5 lg:w-1.5 lg:h-auto absolute lg:relative top-0 left-0 lg:my-4 lg:ml-3 lg:rounded-full shrink-0 transition-all duration-300",
              promo.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30"
            )} />

            <div className="flex-1 p-4 lg:p-5 mt-1.5 lg:mt-0 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 min-w-0">
              
              {/* Promo Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">Promoción</p>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold truncate">{promo.name}</h3>
                  <Badge variant="outline" className="rounded-md border px-1.5 py-0 text-[9px] font-black uppercase tracking-widest shadow-sm">
                    #{promo.id.slice(-6).toUpperCase()}
                  </Badge>
                </div>
                {promo.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{promo.description}</p>
                )}
              </div>

              {/* Scope & Date */}
              <div className="lg:w-48 xl:w-56 flex flex-col gap-1.5 min-w-0 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                  {getScopeIcon(promo.scope)}
                  <span className="truncate font-medium">{getScopeText(promo.scope)}</span>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 text-xs",
                  isExpired ? "text-destructive" : "text-muted-foreground/80"
                )}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="truncate font-medium">Expira: {new Date(promo.expiresAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Discount Value */}
              <div className="lg:w-32 shrink-0 lg:text-right flex items-center lg:justify-end gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 shrink-0">
                  {promo.discountType === "PERCENTAGE" ? (
                    <Percent className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5 lg:hidden">Descuento</p>
                  <p className="text-sm font-black text-emerald-600">
                    {promo.discountType === "PERCENTAGE"
                      ? `${Number(promo.discountValue)}% OFF`
                      : `$${Number(promo.discountValue).toLocaleString()}`
                    }
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 lg:border-l border-border/30 pt-4 lg:pt-0 lg:pl-4 shrink-0 lg:w-32 xl:w-40">
                <div className="flex flex-row lg:flex-col items-center gap-2 lg:gap-1.5">
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
                      onClick={() => setIsConfirmingDelete(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-8 w-8 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20"
                      onClick={handleDelete}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/15 transition-colors"
                    onClick={() => setIsConfirmingDelete(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
