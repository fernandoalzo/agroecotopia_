"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ChevronRight, Calendar, MapPin, CreditCard, Clock, CheckCircle2, Truck, Timer, XCircle, RefreshCw, Copy, Check } from "lucide-react";
import { getUserOrdersAction, cancelUserOrderAction, deleteUserOrderAction } from "@/backend/modules/orders/orders.actions";
import { getUserOrderConversationsAction } from "@/backend/modules/chat/chat.actions";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PedidoEstado } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import logger from "@/utils/logger";

const log = logger.child("src/frontend/components/orders/OrdersList.tsx");

interface Order {
  id: string;
  estado: PedidoEstado;
  fechaPedido: Date;
  total: number;
  direccionEntrega: string;
  detalles: {
    id: string;
    cantidad: number;
    precioUnitario: number;
    producto: {
      name: string;
      images: string[];
    };
  }[];
}

const statusConfig = {
  [PedidoEstado.PENDIENTE]: {
    label: "Pendiente",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Clock,
  },
  [PedidoEstado.CONFIRMADO]: {
    label: "Confirmado",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: CheckCircle2,
  },
  [PedidoEstado.EN_PREPARACION]: {
    label: "En Preparación",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    icon: Timer,
  },
  [PedidoEstado.EN_CAMINO]: {
    label: "En Camino",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    icon: Truck,
  },
  [PedidoEstado.ENTREGADO]: {
    label: "Entregado",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: Package,
  },
  [PedidoEstado.CANCELADO]: {
    label: "Cancelado",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    icon: XCircle,
  },
};

export const OrdersList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [repeatingId, setRepeatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unreadChatCounts, setUnreadChatCounts] = useState<Record<string, number>>({});
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await getUserOrdersAction();
        if (Array.isArray(result)) {
          setOrders(result as any);
        }
      } catch (error) {
        log.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    if (orders.length === 0) {
      setUnreadChatCounts({});
      return;
    }

    let cancelled = false;

    const loadUnreadCounts = async () => {
      try {
        const res = await getUserOrderConversationsAction();
        if (cancelled || !Array.isArray(res)) return;

        const counts = res.reduce((acc: Record<string, number>, conv: any) => {
          if (conv?.pedido?.id) {
            acc[conv.pedido.id] = Number(conv.unreadCount) || 0;
          }
          return acc;
        }, {});

        setUnreadChatCounts(counts);
      } catch (error) {
        log.error("Error loading order unread counts:", error);
      }
    };

    loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orders]);

  const handleCancelOrder = async (orderId: string) => {
    setCancelingId(orderId);
    try {
      const result = await cancelUserOrderAction(orderId);
      if (result && "error" in result) {
        toast.error("Error", { description: result.error });
      } else {
        toast.success("Pedido cancelado", { description: "Tu pedido ha sido cancelado exitosamente." });
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, estado: PedidoEstado.CANCELADO } : o))
        );
      }
    } catch (error) {
      toast.error("Error", { description: "Hubo un problema al cancelar el pedido." });
    } finally {
      setCancelingId(null);
      setConfirmingCancelId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setDeletingId(orderId);
    try {
      const result = await deleteUserOrderAction(orderId);
      if (result && "error" in result) {
        toast.error("Error", { description: result.error });
      } else {
        toast.success("Pedido eliminado", { description: "El pedido ha sido eliminado permanentemente." });
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } catch (error) {
      toast.error("Error", { description: "Hubo un problema al eliminar el pedido." });
    } finally {
      setDeletingId(null);
      setConfirmingDeleteId(null);
    }
  };

  const handleRepeatOrder = (e: React.MouseEvent, order: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (!order.detalles || repeatingId === order.id) return;

    setRepeatingId(order.id);
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
      setTimeout(() => {
        router.push("/cart");
      }, 1000);
    } else {
      toast.error("No se pudieron agregar los productos al carrito", { id: "repeat-order-error" });
      setRepeatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
          <Package className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-2xl font-bold">Aún no tienes pedidos</h3>
        <p className="mt-2 text-muted-foreground">
          Cuando realices una compra, aparecerá aquí.
        </p>
        <Button className="mt-8 rounded-2xl px-8 h-12 text-base font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105" asChild>
          <Link href="/products">Ir a la tienda</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-6">
      <AnimatePresence mode="popLayout">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group overflow-hidden rounded-3xl border-border/50 bg-card/50 backdrop-blur-md transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Info Section */}
                  <div className="flex-1 p-6 md:p-8">
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(order.fechaPedido), "PPP", { locale: es })}
                        </div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xl font-bold tracking-tight">
                            Pedido #{order.id.slice(-6).toUpperCase()}
                          </h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigator.clipboard.writeText(order.id);
                              setCopiedId(order.id);
                              toast.success("ID copiado", { description: "El ID del pedido ha sido copiado al portapapeles." });
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            title="Copiar ID del pedido"
                          >
                            {copiedId === order.id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Badge className={cn("rounded-full border px-4 py-1.5 font-bold transition-all group-hover:scale-105", statusConfig[order.estado].color)}>
                        <span className="mr-2 h-2 w-2 rounded-full bg-current animate-pulse" />
                        {statusConfig[order.estado].label}
                      </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-start gap-3 rounded-2xl bg-secondary/30 p-4 transition-colors group-hover:bg-secondary/50">
                        <MapPin className="mt-1 h-4 w-4 text-primary" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Entrega en</p>
                          <p className="text-sm font-medium line-clamp-1">{order.direccionEntrega}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-2xl bg-secondary/30 p-4 transition-colors group-hover:bg-secondary/50">
                        <CreditCard className="mt-1 h-4 w-4 text-primary" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Total pagado</p>
                          <p className="text-sm font-bold">${order.total.toLocaleString("es-CO")}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="relative flex w-full flex-col justify-center border-t border-border/50 bg-secondary/10 p-6 md:w-80 md:border-l md:border-t-0 md:p-8">
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Productos</p>
                      <div className="flex -space-x-3 overflow-hidden">
                        {order.detalles?.slice(0, 4).map((detalle) => (
                          <div
                            key={detalle.id}
                            className="relative h-12 w-12 rounded-full border-2 border-background bg-muted shadow-sm ring-1 ring-border/50 overflow-hidden"
                          >
                            {detalle.producto.images && detalle.producto.images.length > 0 ? (
                              <img
                                src={detalle.producto.images[0]}
                                alt={detalle.producto.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-bold text-primary">
                                {detalle.producto.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        ))}
                        {order.detalles?.length > 4 && (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                            +{order.detalles.length - 4}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium">
                        {order.detalles?.length || 0} {order.detalles?.length === 1 ? "producto" : "productos"}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 mt-6">
                      <Button variant="ghost" className="relative w-full sm:flex-1 rounded-2xl group/btn border border-primary/10 hover:bg-primary/5 hover:text-primary transition-all font-bold" asChild>
                        <Link href={`/pedidos/${order.id}`}>
                          Ver detalles
                          <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                          {unreadChatCounts[order.id] > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white shadow-md shadow-red-500/30 ring-2 ring-background">
                              {unreadChatCounts[order.id]}
                            </span>
                          )}
                        </Link>
                      </Button>

                      {(order.estado === PedidoEstado.CONFIRMADO || order.estado === PedidoEstado.ENTREGADO || order.estado === PedidoEstado.CANCELADO) && (
                        <Button
                          variant="outline"
                          className="w-full sm:flex-1 rounded-2xl border-primary/20 text-primary hover:bg-primary/5 shadow-sm font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                          onClick={(e) => handleRepeatOrder(e, order)}
                          disabled={repeatingId === order.id}
                        >
                          {repeatingId === order.id ? (
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          {repeatingId === order.id ? "Repitiendo..." : "Repetir"}
                        </Button>
                      )}
                    </div>

                    {order.estado === PedidoEstado.PENDIENTE && (
                      confirmingCancelId === order.id ? (
                        <div className="mt-2 flex gap-2 w-full">
                          <Button
                            variant="outline"
                            className="flex-1 rounded-2xl"
                            onClick={() => setConfirmingCancelId(null)}
                            disabled={cancelingId === order.id}
                          >
                            No
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/20"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancelingId === order.id}
                          >
                            {cancelingId === order.id ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              "Sí, cancelar"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="mt-2 w-full rounded-2xl text-rose-500 border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-600"
                          onClick={() => setConfirmingCancelId(order.id)}
                        >
                          Cancelar pedido
                        </Button>
                      )
                    )}

                    {order.estado === PedidoEstado.CANCELADO && (
                      confirmingDeleteId === order.id ? (
                        <div className="mt-2 flex gap-2 w-full">
                          <Button
                            variant="outline"
                            className="flex-1 rounded-2xl"
                            onClick={() => setConfirmingDeleteId(null)}
                            disabled={deletingId === order.id}
                          >
                            No
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold"
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deletingId === order.id}
                          >
                            {deletingId === order.id ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              "Eliminar"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="mt-2 w-full rounded-2xl text-red-600 border-red-500/20 hover:bg-red-500/10 hover:text-red-700"
                          onClick={() => setConfirmingDeleteId(order.id)}
                        >
                          Eliminar pedido
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
