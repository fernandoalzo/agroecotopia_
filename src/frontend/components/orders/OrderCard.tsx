"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, MapPin, Clock, CheckCircle2, Truck, Timer, XCircle, RefreshCw, Copy, Check, Trash2, Store, Package, Warehouse } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { PedidoEstado } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface Order {
  id: string;
  estado: PedidoEstado;
  tipoEntrega?: string;
  fechaPedido: Date;
  total: number;
  direccionEntrega: string;
  bodega?: {
    id: string;
    name: string;
    address: string;
    city: string;
  } | null;
  detalles: {
    id: string;
    cantidad: number;
    precioUnitario: number;
    producto: {
      name: string;
      images: string[];
    };
    store?: {
      id: string;
      name: string;
    };
  }[];
}

export const statusConfig = {
  [PedidoEstado.PENDIENTE]: {
    label: "Pendiente",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    barColor: "bg-gradient-to-b from-amber-400 to-amber-600",
    glowColor: "shadow-[2px_0_12px_rgba(245,158,11,0.3)]",
    cardBorderClass: "border-amber-500/20 bg-amber-500/[0.02]",
    hoverClasses: "hover:border-amber-500/40 hover:shadow-[0_8px_30px_-5px_rgba(245,158,11,0.12)] hover:bg-amber-500/[0.04]",
    icon: Clock,
    dotColor: "bg-amber-500",
  },
  [PedidoEstado.CONFIRMADO]: {
    label: "Confirmado",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    barColor: "bg-gradient-to-b from-blue-400 to-blue-600",
    glowColor: "shadow-[2px_0_12px_rgba(59,130,246,0.3)]",
    cardBorderClass: "border-blue-500/20 bg-blue-500/[0.02]",
    hoverClasses: "hover:border-blue-500/40 hover:shadow-[0_8px_30px_-5px_rgba(59,130,246,0.12)] hover:bg-blue-500/[0.04]",
    icon: CheckCircle2,
    dotColor: "bg-blue-500",
  },
  [PedidoEstado.EN_PREPARACION]: {
    label: "En Preparación",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    barColor: "bg-gradient-to-b from-indigo-400 to-indigo-600",
    glowColor: "shadow-[2px_0_12px_rgba(99,102,241,0.3)]",
    cardBorderClass: "border-indigo-500/20 bg-indigo-500/[0.02]",
    hoverClasses: "hover:border-indigo-500/40 hover:shadow-[0_8px_30px_-5px_rgba(99,102,241,0.12)] hover:bg-indigo-500/[0.04]",
    icon: Timer,
    dotColor: "bg-indigo-500",
  },
  [PedidoEstado.EN_CAMINO]: {
    label: "En Camino",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    barColor: "bg-gradient-to-b from-purple-400 to-purple-600",
    glowColor: "shadow-[2px_0_12px_rgba(168,85,247,0.3)]",
    cardBorderClass: "border-purple-500/20 bg-purple-500/[0.02]",
    hoverClasses: "hover:border-purple-500/40 hover:shadow-[0_8px_30px_-5px_rgba(168,85,247,0.12)] hover:bg-purple-500/[0.04]",
    icon: Truck,
    dotColor: "bg-purple-500",
  },
  [PedidoEstado.ENTREGADO]: {
    label: "Entregado",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    barColor: "bg-gradient-to-b from-emerald-400 to-emerald-600",
    glowColor: "shadow-[2px_0_12px_rgba(16,185,129,0.3)]",
    cardBorderClass: "border-emerald-500/20 bg-emerald-500/[0.02]",
    hoverClasses: "hover:border-emerald-500/40 hover:shadow-[0_8px_30px_-5px_rgba(16,185,129,0.12)] hover:bg-emerald-500/[0.04]",
    icon: Package,
    dotColor: "bg-emerald-500",
  },
  [PedidoEstado.CANCELADO]: {
    label: "Cancelado",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    barColor: "bg-gradient-to-b from-rose-400 to-rose-600",
    glowColor: "shadow-[2px_0_12px_rgba(244,63,94,0.3)]",
    cardBorderClass: "border-rose-500/20 bg-rose-500/[0.02]",
    hoverClasses: "hover:border-rose-500/40 hover:shadow-[0_8px_30px_-5px_rgba(244,63,94,0.12)] hover:bg-rose-500/[0.04]",
    icon: XCircle,
    dotColor: "bg-rose-500",
  },
};

interface OrderCardProps {
  order: Order;
  index: number;
  unreadChatCount?: number;
  onCancelOrder: (orderId: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
}

export const OrderCard = ({ order, index, unreadChatCount = 0, onCancelOrder, onDeleteOrder }: OrderCardProps) => {
  const [isCanceling, setIsCanceling] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const { addToCart } = useCart();

  const handleCancelOrder = async () => {
    setIsCanceling(true);
    try {
      await onCancelOrder(order.id);
      toast.success("Pedido cancelado", { description: "Tu pedido ha sido cancelado exitosamente." });
    } catch (error) {
      toast.error("Error", { description: "Hubo un problema al cancelar el pedido." });
    } finally {
      setIsCanceling(false);
      setIsConfirmingCancel(false);
    }
  };

  const handleDeleteOrder = async () => {
    setIsDeleting(true);
    try {
      await onDeleteOrder(order.id);
      toast.success("Pedido eliminado", { description: "El pedido ha sido eliminado permanentemente." });
    } catch (error) {
      toast.error("Error", { description: "Hubo un problema al eliminar el pedido." });
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  const handleRepeatOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!order.detalles || isRepeating) return;

    setIsRepeating(true);
    let addedCount = 0;
    order.detalles.forEach((detalle: any) => {
      if (detalle.producto) {
        addToCart(detalle.producto, detalle.cantidad, false);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success("Productos agregados al carrito", {
        id: "repeat-order-toast",
        description: "Serás redirigido al carrito..."
      });
    } else {
      toast.error("No se pudieron agregar los productos al carrito", { id: "repeat-order-error" });
      setIsRepeating(false);
    }
  };

  const cfg = statusConfig[order.estado];
  const StatusIcon = cfg.icon;
  const showRepeat = order.estado === PedidoEstado.CONFIRMADO || order.estado === PedidoEstado.ENTREGADO || order.estado === PedidoEstado.CANCELADO;
  const isPending = order.estado === PedidoEstado.PENDIENTE;
  const isCancelled = order.estado === PedidoEstado.CANCELADO;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
    >
      <Card className={cn(
        "group overflow-hidden rounded-2xl backdrop-blur-md transition-all duration-300 border",
        cfg.cardBorderClass,
        cfg.hoverClasses
      )}>
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Status color bar */}
            <div
              className={cn(
                "w-[4px] shrink-0 rounded-full my-3 ml-2.5 transition-all duration-300",
                cfg.barColor,
                cfg.glowColor
              )}
            />

            {/* Main content row */}
            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 md:py-4 md:px-5 min-w-0">
              {/* Left: Order ID + Date + Status Badge */}
              <div className="flex items-center justify-between md:justify-start gap-3 min-w-0 md:w-56 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm md:text-base font-black tracking-tight">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigator.clipboard.writeText(order.id);
                        setIsCopied(true);
                        toast.success("ID copiado", { description: "El ID del pedido ha sido copiado al portapapeles." });
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      className="text-muted-foreground/40 hover:text-primary transition-colors p-0.5"
                      title="Copiar ID del pedido"
                    >
                      {isCopied ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    {format(new Date(order.fechaPedido), "dd MMM yyyy", { locale: es })}
                  </p>
                </div>

                {/* Status badge (visible on mobile next to ID, on desktop beside it) */}
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider pointer-events-none shadow-sm whitespace-nowrap",
                    cfg.color
                  )}
                >
                  <StatusIcon className="mr-1 h-2.5 w-2.5" />
                  {cfg.label}
                </Badge>
              </div>

              {/* Center: Address/Delivery + Store + Total (compact info row) */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Delivery type indicator */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {order.tipoEntrega === "RECOJO_EN_BODEGA" ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <Warehouse className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs text-emerald-600 font-semibold truncate">
                        {order.bodega?.name || "Recojo en bodega"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <Store className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {order.detalles[0]?.store?.name || "Tienda no disponible"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold">${order.total.toLocaleString("es-CO")}</p>
                </div>
              </div>

              {/* Product thumbnails */}
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <div className="flex -space-x-2">
                  {order.detalles?.slice(0, 3).map((detalle) => (
                    <div
                      key={detalle.id}
                      className="relative h-8 w-8 rounded-full border-2 border-background bg-muted shadow-sm ring-1 ring-border/30 overflow-hidden"
                    >
                      {detalle.producto.images && detalle.producto.images.length > 0 ? (
                        <img
                          src={detalle.producto.images[0]}
                          alt={detalle.producto.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-[10px] font-bold text-primary">
                          {detalle.producto.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  ))}
                  {(order.detalles?.length || 0) > 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                      +{order.detalles.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {order.detalles?.length || 0} {order.detalles?.length === 1 ? "prod." : "prods."}
                </span>
              </div>

              {/* Right: Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Cancel / Delete confirmation overlays */}
                <AnimatePresence mode="wait">
                  {isConfirmingCancel ? (
                    <motion.div
                      key="confirm-cancel"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-1.5 bg-secondary/60 border border-border/80 rounded-xl px-2.5 py-1 shadow-sm"
                    >
                      <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">¿Cancelar?</span>
                      <Button
                        size="sm"
                        className="rounded-lg text-[11px] font-extrabold h-6 px-2.5 bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all"
                        disabled={isCanceling}
                        onClick={handleCancelOrder}
                      >
                        {isCanceling ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          "Sí"
                        )}
                      </Button>
                      <button
                        className="rounded-lg text-[11px] font-bold h-6 px-2 hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-all cursor-pointer inline-flex items-center"
                        disabled={isCanceling}
                        onClick={() => setIsConfirmingCancel(false)}
                      >
                        No
                      </button>
                    </motion.div>
                  ) : isConfirmingDelete ? (
                    <motion.div
                      key="confirm-delete"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-1.5 bg-secondary/60 border border-border/80 rounded-xl px-2.5 py-1 shadow-sm"
                    >
                      <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">¿Eliminar?</span>
                      <Button
                        size="sm"
                        className="rounded-lg text-[11px] font-extrabold h-6 px-2.5 bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all"
                        disabled={isDeleting}
                        onClick={handleDeleteOrder}
                      >
                        {isDeleting ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          "Sí"
                        )}
                      </Button>
                      <button
                        className="rounded-lg text-[11px] font-bold h-6 px-2 hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-all cursor-pointer inline-flex items-center"
                        disabled={isDeleting}
                        onClick={() => setIsConfirmingDelete(false)}
                      >
                        No
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="actions"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="flex items-center gap-1"
                    >
                      {/* Cancel button for PENDIENTE */}
                      {isPending && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-[11px] font-bold h-7 px-2.5 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-all"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsConfirmingCancel(true);
                          }}
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Cancelar
                        </Button>
                      )}

                      {/* Delete button for CANCELADO */}
                      {isCancelled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-[11px] font-bold h-7 px-2.5 text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsConfirmingDelete(true);
                          }}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Eliminar
                        </Button>
                      )}

                      {/* Repeat button */}
                      {showRepeat && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-[11px] font-bold h-7 px-2.5 text-primary hover:bg-primary/10 transition-all"
                          onClick={handleRepeatOrder}
                          disabled={isRepeating}
                        >
                          {isRepeating ? (
                            <span className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <RefreshCw className="mr-1 h-3 w-3" />
                          )}
                          {isRepeating ? "..." : "Repetir"}
                        </Button>
                      )}

                      {/* View Details */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="relative rounded-xl text-[11px] font-bold h-7 px-2.5 text-foreground hover:text-primary hover:bg-primary/5 transition-all"
                        asChild
                      >
                        <Link href={`/pedidos/${order.id}`}>
                          Ver detalles
                          <ChevronRight className="ml-0.5 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                          {unreadChatCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white shadow-md shadow-red-500/30 ring-2 ring-background">
                              {unreadChatCount}
                            </span>
                          )}
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
