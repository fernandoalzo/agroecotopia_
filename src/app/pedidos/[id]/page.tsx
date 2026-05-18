"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { ArrowLeft, Package, MapPin, CreditCard, Calendar, Clock, CheckCircle2, Truck, Timer, XCircle, FileText } from "lucide-react";
import { getOrderDetailAction, cancelUserOrderAction, deleteUserOrderAction } from "@/backend/modules/orders/orders.actions";
import { processMercadoPagoPaymentAction } from "@/backend/modules/payments/payments.actions";
import { toast } from "sonner";
import { PedidoEstado } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/Loading";

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

export default function OrderDetailPage() {
  const { id } = useParams();
  const { status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/pedidos/${id}`);
    }
  }, [status, router, id]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const result = await getOrderDetailAction(id as string);
        if (result && !("error" in result)) {
          setOrder(result);
        }
      } catch (error) {
        console.error("Error fetching order detail:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  useEffect(() => {
    const processPaymentRedirect = async () => {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get("status");
      const paymentId = params.get("payment_id");

      if (statusParam === "success" && paymentId) {
        setLoading(true);
        toast.info("Verificando tu pago...", {
          description: "Estamos confirmando los detalles con Mercado Pago."
        });

        try {
          const result = await processMercadoPagoPaymentAction(paymentId);
          
          if (result && "success" in result) {
            toast.success("¡Pago completado exitosamente!", {
              description: "Tu pedido ha sido confirmado y tu stock reservado."
            });
            
            // Refrescar los detalles del pedido en pantalla consultando la DB actualizada
            const updatedOrder = await getOrderDetailAction(id as string);
            if (updatedOrder && !("error" in updatedOrder)) {
              setOrder(updatedOrder);
            }
          } else {
            toast.error("No se pudo verificar el pago", {
              description: "Si el cobro se realizó, por favor contáctanos para solucionarlo."
            });
          }
        } catch (err) {
          toast.error("Error al confirmar el pago");
        } finally {
          setLoading(false);
          // Limpiar parámetros de la URL para evitar reprocesamientos al recargar
          router.replace(`/pedidos/${id}`);
        }
      } else if (statusParam === "pending") {
        toast.warning("Pago en proceso", {
          description: "Mercado Pago está procesando la transacción. Te notificaremos pronto."
        });
        router.replace(`/pedidos/${id}`);
      }
    };

    if (id) {
      processPaymentRedirect();
    }
  }, [id, router]);

  const handleCancelOrder = async () => {
    setCanceling(true);
    try {
      const result = await cancelUserOrderAction(order.id);
      if (result && "error" in result) {
        toast.error("Error", { description: result.error });
      } else {
        toast.success("Pedido cancelado", { description: "Tu pedido ha sido cancelado exitosamente." });
        setOrder({ ...order, estado: PedidoEstado.CANCELADO });
      }
    } catch (error) {
      toast.error("Error", { description: "Hubo un problema al cancelar el pedido." });
    } finally {
      setCanceling(false);
      setIsConfirmingCancel(false);
    }
  };

  const handleDeleteOrder = async () => {
    setDeleting(true);
    try {
      const result = await deleteUserOrderAction(order.id);
      if (result && "error" in result) {
        toast.error("Error", { description: result.error });
      } else {
        toast.success("Pedido eliminado", { description: "El pedido ha sido eliminado permanentemente." });
        router.push("/pedidos");
      }
    } catch (error) {
      toast.error("Error", { description: "Hubo un problema al eliminar el pedido." });
    } finally {
      setDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  if (loading || status === "loading") {
    return <Loading fullScreen />;
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <XCircle className="h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold">Pedido no encontrado</h2>
        <Button className="mt-6" onClick={() => router.push("/pedidos")}>Volver a mis pedidos</Button>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.estado as PedidoEstado].icon;

  return (
    <div className="min-h-screen flex flex-col bg-background/50 selection:bg-primary/20">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-20 md:pt-32">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Button variant="ghost" className="rounded-full pl-2 pr-4 hover:bg-primary/5 transition-all" onClick={() => router.push("/pedidos")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a mis pedidos
            </Button>
          </motion.div>

          {/* Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                  Pedido #{order.id.slice(-6).toUpperCase()}
                </h1>
                <Badge className={cn("rounded-full border px-4 py-1 font-bold", statusConfig[order.estado as PedidoEstado].color)}>
                  {statusConfig[order.estado as PedidoEstado].label}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Realizado el {format(new Date(order.fechaPedido), "PPP 'a las' p", { locale: es })}
              </p>
            </div>
            
            <StatusIcon className={cn("h-16 w-16 opacity-20", statusConfig[order.estado as PedidoEstado].color.split(" ")[1])} />
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
              {/* Items Card */}
              <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-md overflow-hidden">
                <div className="p-6 border-b border-border/50 bg-secondary/10">
                  <h3 className="font-bold flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Productos en este pedido
                  </h3>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {order.detalles.map((detalle: any) => (
                      <div key={detalle.id} className="p-6 flex items-center gap-4 transition-all hover:bg-primary/5">
                        <div className="h-16 w-16 rounded-2xl bg-muted overflow-hidden border border-border/50 flex-shrink-0">
                          {detalle.producto.images && detalle.producto.images.length > 0 ? (
                            <img src={detalle.producto.images[0]} alt={detalle.producto.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-primary font-bold">{detalle.producto.name.charAt(0)}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm md:text-base truncate">{detalle.producto.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {detalle.cantidad} {detalle.unidadMedida} x ${detalle.precioUnitario.toLocaleString("es-CO")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm md:text-base">${detalle.subtotal.toLocaleString("es-CO")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Info */}
              <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-md">
                <CardContent className="p-6 space-y-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Información de entrega
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Dirección</p>
                      <p className="font-medium">{order.direccionEntrega}</p>
                    </div>
                    {order.notasCliente && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Notas</p>
                        <p className="font-medium italic">"{order.notasCliente}"</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-8">
              <Card className="rounded-3xl border-border/50 bg-primary/5 border-primary/20">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Resumen de pago
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${order.subtotal.toLocaleString("es-CO")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Impuestos</span>
                      <span className="font-medium">${order.impuestos.toLocaleString("es-CO")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Envío</span>
                      <span className="font-medium">${order.costoEnvio.toLocaleString("es-CO")}</span>
                    </div>
                    <div className="pt-3 border-t border-border/50 flex justify-between items-end">
                      <span className="font-bold">Total</span>
                      <span className="text-2xl font-black text-primary">${order.total.toLocaleString("es-CO")}</span>
                    </div>
                  </div>

                  {order.estado === PedidoEstado.PENDIENTE && (
                    isConfirmingCancel ? (
                      <div className="mt-6 flex gap-2 w-full">
                        <Button 
                          variant="outline" 
                          className="flex-1 rounded-2xl"
                          onClick={() => setIsConfirmingCancel(false)}
                          disabled={canceling}
                        >
                          No
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/20"
                          onClick={handleCancelOrder}
                          disabled={canceling}
                        >
                          {canceling ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            "Sí, cancelar"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="mt-6 w-full rounded-2xl text-rose-500 border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-600"
                        onClick={() => setIsConfirmingCancel(true)}
                      >
                        Cancelar pedido
                      </Button>
                    )
                  )}

                  {order.estado === PedidoEstado.CANCELADO && (
                    isConfirmingDelete ? (
                      <div className="mt-6 flex gap-2 w-full">
                        <Button 
                          variant="outline" 
                          className="flex-1 rounded-2xl"
                          onClick={() => setIsConfirmingDelete(false)}
                          disabled={deleting}
                        >
                          No
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold"
                          onClick={handleDeleteOrder}
                          disabled={deleting}
                        >
                          {deleting ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            "Sí, eliminar"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="mt-6 w-full rounded-2xl text-red-600 border-red-500/20 hover:bg-red-500/10 hover:text-red-700"
                        onClick={() => setIsConfirmingDelete(true)}
                      >
                        Eliminar pedido
                      </Button>
                    )
                  )}
                </CardContent>
              </Card>

              <div className="rounded-3xl bg-secondary/30 p-6 space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-bold text-sm">Compra protegida</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tu pedido está siendo procesado bajo nuestros estándares de calidad agroecológica. Si tienes dudas, contáctanos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Re-using ShieldCheck icon locally as it was not imported
const ShieldCheck = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
