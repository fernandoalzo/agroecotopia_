"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ChevronRight, Calendar, MapPin, CreditCard, Clock, CheckCircle2, Truck, Timer, XCircle } from "lucide-react";
import { getUserOrdersAction } from "@/backend/modules/orders/orders.actions";
import { PedidoEstado } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await getUserOrdersAction();
        if (Array.isArray(result)) {
          setOrders(result as any);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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
        <div className="mb-6 rounded-full bg-primary/10 p-6">
          <Package className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-2xl font-bold">Aún no tienes pedidos</h3>
        <p className="mt-2 text-muted-foreground">
          Cuando realices una compra, aparecerá aquí.
        </p>
        <Button className="mt-8 rounded-full px-8" asChild>
          <a href="/products">Ir a la tienda</a>
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
                        <h4 className="text-xl font-bold tracking-tight">
                          Pedido #{order.id.slice(-6).toUpperCase()}
                        </h4>
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
                    
                    <Button variant="ghost" className="mt-6 w-full rounded-2xl group/btn" asChild>
                      <a href={`/pedidos/${order.id}`}>
                        Ver detalles
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </a>
                    </Button>
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
