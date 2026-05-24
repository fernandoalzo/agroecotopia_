"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Tag, Hash, Calendar, Box, Image as ImageIcon } from "lucide-react";
import { Product } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminProductModalProps {
  product: any | null;
  onClose: () => void;
}

export const AdminProductModal = ({ product, onClose }: AdminProductModalProps) => {
  if (!product) return null;

  const hasStock = Number(product.stock) > 0;
  const stockClass = hasStock
    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    : "bg-red-500/10 text-red-500 border-red-500/20";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-all duration-300"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto custom-scrollbar rounded-3xl border border-border/50 bg-card shadow-2xl shadow-primary/5"
        >
          {/* Header Gradient */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent opacity-50" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/50 backdrop-blur-md text-muted-foreground hover:bg-background hover:text-foreground transition-all border border-border/50"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
              
              {/* Image Section */}
              <div className="w-full sm:w-1/3 shrink-0">
                <div className="aspect-square w-full rounded-2xl bg-secondary/50 flex items-center justify-center border border-border/50 overflow-hidden shadow-inner group relative">
                  {product.images?.[0] ? (
                    <>
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {product.emoji && (
                        <div className="absolute bottom-2 right-2 text-2xl bg-background/50 backdrop-blur-sm rounded-full p-1.5 border border-border/50 shadow-sm">
                          {product.emoji}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
                      <ImageIcon className="h-10 w-10" />
                      <span className="text-xs font-bold uppercase tracking-wider">Sin Imagen</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Section */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className={cn("rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-sm", stockClass)}>
                      {hasStock ? `Stock: ${Number(product.stock)}` : "Agotado"}
                    </Badge>
                    <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px] font-bold shadow-sm">
                      <Tag className="h-3 w-3 mr-1 inline" />
                      {product.categories.map((c: any) => c.name).join(", ")}
                    </Badge>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2">
                    {product.name}
                  </h2>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed mb-6 line-clamp-3">
                    {product.description || "Sin descripción detallada."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 mb-1">
                    Precio de venta
                  </p>
                  <p className="text-3xl font-black text-foreground flex items-baseline gap-1">
                    ${product.price.toLocaleString("es-CO")}
                    <span className="text-sm font-medium text-muted-foreground">/{product.unidad || "ud"}</span>
                  </p>
                </div>
              </div>
            </div>

            <hr className="my-6 border-border/50 border-dashed" />

            {/* Extra Meta Data */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-background border border-border/30">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                  <Hash className="h-3 w-3" /> ID
                </p>
                <p className="text-xs font-bold truncate text-foreground/90">
                  {product.id}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border/30">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                  <Box className="h-3 w-3" /> Etiqueta
                </p>
                <p className="text-xs font-bold text-foreground/90">
                  {product.tag || "N/A"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border/30">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                  <Package className="h-3 w-3" /> Stock exacto
                </p>
                <p className="text-xs font-bold text-foreground/90">
                  {Number(product.stock)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border/30">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Creado
                </p>
                <p className="text-xs font-bold text-foreground/90">
                  {format(new Date(product.createdAt), "dd MMM yyyy", { locale: es })}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" className="rounded-xl font-bold" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
