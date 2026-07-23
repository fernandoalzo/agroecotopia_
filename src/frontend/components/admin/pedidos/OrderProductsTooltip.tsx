"use client";

import { Package } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AdminOrder } from "./adminOrderUtils";

interface OrderProductsTooltipProps {
  detalles: AdminOrder["detalles"];
}

export const OrderProductsTooltip = ({ detalles }: OrderProductsTooltipProps) => {
  const totalItems = detalles?.reduce((acc, d) => acc + d.cantidad, 0) || 0;
  const subtotalTotal = detalles?.reduce(
    (acc, d) => acc + d.cantidad * d.precioUnitario,
    0
  ) || 0;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer group/prod py-1 shrink-0">
            <div className="flex -space-x-2">
              {detalles?.slice(0, 3).map((detalle) => (
                <div
                  key={detalle.id}
                  className="relative h-8 w-8 rounded-full border-2 border-background bg-muted shadow-sm ring-1 ring-border/30 overflow-hidden"
                >
                  {detalle.producto?.images && detalle.producto.images.length > 0 ? (
                    /* eslint-disable-next-next/no-img-element */
                    <img
                      src={detalle.producto.images[0]}
                      alt={detalle.producto.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-[10px] font-bold text-primary">
                      {detalle.producto?.name ? detalle.producto.name.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                </div>
              ))}
              {(detalles?.length || 0) > 3 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                  +{detalles.length - 3}
                </div>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground font-medium group-hover/prod:text-primary transition-colors">
              {detalles?.length || 0} {detalles?.length === 1 ? "prod." : "prods."}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          sideOffset={6}
          avoidCollisions={true}
          collisionPadding={12}
          className="z-50 min-w-[280px] max-w-[340px] p-0 border border-border/80 dark:border-emerald-500/40 dark:shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)] bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-top-2"
        >
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-primary" />
              Detalle del Pedido
            </span>
            <span className="text-[10px] font-bold text-muted-foreground bg-background/80 border border-border/50 px-2 py-0.5 rounded-full">
              {detalles?.length || 0} prod. ({totalItems} un.)
            </span>
          </div>
          <div className="p-2 max-h-[240px] overflow-y-auto space-y-1.5 custom-scrollbar">
            {detalles?.map((det) => {
              const imgUrl = det.producto.images?.[0] || "/placeholder-product.png";
              const subtotal = det.cantidad * det.precioUnitario;
              return (
                <div
                  key={det.id}
                  className="flex items-start gap-3 p-2 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-border/30 transition-colors"
                >
                  <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-border/50 bg-secondary/50 flex items-center justify-center">
                    {det.producto?.images?.[0] ? (
                      /* eslint-disable-next-next/no-img-element */
                      <img
                        src={det.producto.images[0]}
                        alt={det.producto.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-primary font-bold text-xs">
                        {det.producto?.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground line-clamp-1 leading-snug">
                      {det.producto.name}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="font-semibold text-muted-foreground">
                        {det.cantidad} x ${det.precioUnitario.toLocaleString("es-CO")}
                      </span>
                      <span className="font-extrabold text-primary">
                        ${subtotal.toLocaleString("es-CO")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-secondary/30 px-4 py-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Subtotal Productos
            </span>
            <span className="text-xs font-black text-foreground">
              ${subtotalTotal.toLocaleString("es-CO")}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
