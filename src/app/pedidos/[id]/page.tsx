"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { ArrowLeft, Package, MapPin, CreditCard, Calendar, Clock, CheckCircle2, Truck, Timer, XCircle, FileText, RefreshCw, Copy, Check, ChevronRight, MessageSquare } from "lucide-react";
import { useCart } from "@/context/CartContext";
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
import ProductModal from "@/components/ProductModal";
import { OrderChatPanel, type OrderConversation } from "@/components/chat/OrderChatPanel";
import type { Message } from "@/components/chat/ChatWidget";
import {
  getConversationMessages,
  getOrCreateOrderConversationAction,
  getSellerOrderConversationsAction,
  getUserOrderConversationsAction,
  markAsRead,
} from "@/backend/modules/chat/chat.actions";
import { Product } from "@/types";
import { useSocket } from "@/frontend/context/SocketContext";
import { useSocketRefresh } from "@/frontend/hooks/useSocketRefresh";
import logger from "@/utils/logger";
import { Loader2 } from "lucide-react";

const log = logger.child("src/app/pedidos/[id]/page.tsx");

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
  const { status, data: session } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderChatUnreadCounts, setOrderChatUnreadCounts] = useState<Record<string, number>>({});
  const [orderChat, setOrderChat] = useState<{
    conversation: OrderConversation;
    messages: Message[];
    isLoading: boolean;
    unreadCount: number;
  } | null>(null);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/pedidos");
  };

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
        log.error("Error fetching order detail:", error);
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

      if (statusParam === "success") {
        setLoading(true);
        toast.info("Verificando tu pago...", {
          description: "Estamos confirmando los detalles con Mercado Pago."
        });

        let confirmed = false;
        let verificationError: string | null = null;

        // Fase 1: Polling — esperar a que el webhook confirme el pedido
        // updateEstado() es idempotente (lock optimista), así que es SEGURO
        // que tanto el webhook como el fallback intenten confirmar.
        const pollingAttempts = 3;
        const delayMs = 2000;

        for (let attempt = 0; attempt < pollingAttempts; attempt++) {
          const updatedOrder = await getOrderDetailAction(id as string);
          if (updatedOrder && !("error" in updatedOrder)) {
            setOrder(updatedOrder);
            if (updatedOrder.estado === "CONFIRMADO") {
              confirmed = true;
              break;
            }
          }
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        // Fase 2: Fallback — si el webhook no llegó, verificar directamente con MP API
        // Es seguro: consulta la API de MercadoPago para validar que el pago es real
        if (!confirmed && paymentId) {
          try {
            const result = await processMercadoPagoPaymentAction(paymentId);
            if (result && "success" in result) {
              confirmed = true;
              const updatedOrder = await getOrderDetailAction(id as string);
              if (updatedOrder && !("error" in updatedOrder)) {
                setOrder(updatedOrder);
              }
            } else if (result && "error" in result) {
              verificationError = result.error;
            }
          } catch (err) {
            log.error("Fallback confirmation error:", err);
            verificationError = "No se pudo comunicar con el servidor de pagos.";
          }
        }

        // Resultado visible para el usuario
        if (confirmed) {
          toast.success("¡Pago completado exitosamente!", {
            description: "Tu pedido ha sido confirmado y tu stock reservado."
          });
        } else if (!paymentId) {
          toast.error("Error al verificar el pago", {
            description: "No se recibió un identificador de pago válido de Mercado Pago. Si el cobro se realizó, contáctanos para solucionarlo.",
            duration: 10000,
          });
        } else {
          toast.error("No se pudo confirmar tu pago", {
            description: verificationError || "Hubo un problema verificando la transacción. Si el cobro se realizó, contáctanos para resolverlo.",
            duration: 10000,
          });
        }

        setLoading(false);
        router.replace(`/pedidos/${id}`);
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

  const orderStoreIds: string[] = Array.from(
    new Set<string>(
      (order?.detalles || [])
        .map((detalle: any) => detalle.storeId)
        .filter((storeId: string | null | undefined): storeId is string => Boolean(storeId))
    )
  );

  const getUnreadChatCount = (storeId: string) => orderChatUnreadCounts[storeId] ?? orderChatUnreadCounts[order?.id || ""] ?? 0;

  const { socket } = useSocket();

  const loadUnreadCounts = useCallback(async () => {
    if (!order?.id || orderStoreIds.length === 0) {
      setOrderChatUnreadCounts({});
      return;
    }

    const userRole = session?.user?.role;
    try {
      if (userRole === "seller" || userRole === "admin") {
        const results = await Promise.all(
          orderStoreIds.map(async (storeId) => {
            const res = await getSellerOrderConversationsAction(storeId);
            if (!Array.isArray(res)) return { storeId, count: 0 };
            const matched = res.find((conv: any) => conv?.pedido?.id === order.id);
            return { storeId, count: Number(matched?.unreadCount) || 0 };
          })
        );

        const counts = results.reduce((acc: Record<string, number>, item) => {
          acc[item.storeId] = item.count;
          acc[order.id] = (acc[order.id] || 0) + item.count;
          return acc;
        }, {});

        setOrderChatUnreadCounts(counts);
        return;
      }

      const res = await getUserOrderConversationsAction();
      if (!Array.isArray(res)) return;

      const counts = res.reduce((acc: Record<string, number>, conv: any) => {
        if (conv?.pedido?.id) {
          const unread = Number(conv.unreadCount) || 0;
          acc[conv.pedido.id] = unread;
          if (conv.store?.id) {
            acc[conv.store.id] = unread;
          }
        }
        return acc;
      }, {});

      setOrderChatUnreadCounts(counts);
    } catch (err) {
      log.error("Error loading order unread counts:", err);
    }
  }, [order?.id, orderStoreIds.join("|"), session?.user?.role]);

  useSocketRefresh({
    socket,
    enabled: !!order?.id && orderStoreIds.length > 0,
    refresh: loadUnreadCounts,
  });

  useEffect(() => {
    loadUnreadCounts();
  }, [loadUnreadCounts]);

  const handleRepeatOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!order || !order.detalles || isRepeating) return;

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
      setTimeout(() => {
        router.push("/cart");
      }, 1000);
    } else {
      toast.error("No se pudieron agregar los productos al carrito", { id: "repeat-order-error" });
      setIsRepeating(false);
    }
  };

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

  const handleOpenSellerChat = async (storeId: string) => {
    if (!order?.id) return;

    setIsOpeningChat(true);
    try {
      const conversation = await getOrCreateOrderConversationAction(order.id, storeId);
      if (!conversation || "error" in conversation) {
        toast.error("No se pudo abrir el chat", {
          description: conversation && "error" in conversation ? String(conversation.error) : undefined,
        });
        return;
      }

      // Monta el panel apenas tenemos la conversación para evitar que el botón
      // se sienta "pegado" mientras llega el historial.
      setOrderChat({ conversation: conversation as OrderConversation, messages: [], isLoading: true, unreadCount: 0 });

      const messages = await getConversationMessages(conversation.id);
      if (messages && "error" in messages) {
        setOrderChat({
          conversation: conversation as OrderConversation,
          messages: [],
          isLoading: false,
          unreadCount: 0,
        });
        toast.error("No se pudieron cargar los mensajes", { description: String(messages.error) });
        return;
      }

      const messageList = (messages || []) as Message[];
      const unreadCount = messageList.filter(
        (message) => !message.isRead && message.senderId !== session?.user?.id
      ).length;

      setOrderChat({
        conversation: conversation as OrderConversation,
        messages: messageList,
        isLoading: false,
        unreadCount,
      });

      void markAsRead(conversation.id);
    } catch (err) {
      log.error("Error abriendo chat con vendedor:", err);
      const description = err instanceof Error
        ? err.message
        : "Ocurrió un error abriendo el chat con el vendedor.";
      toast.error("No se pudo abrir el chat", { description });
    } finally {
      setIsOpeningChat(false);
    }
  };

  const handleMarkOrderChatAsRead = async (conversationId: string) => {
    await markAsRead(conversationId);
    setOrderChat((current) => (current ? { ...current, unreadCount: 0 } : current));
  };

  if (loading || (status === "loading" && !session)) {
    return <Loading fullScreen />;
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <XCircle className="h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold">Pedido no encontrado</h2>
        <Button className="mt-6" onClick={handleBack}>Volver a mis pedidos</Button>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.estado as PedidoEstado].icon;
  const closedOrderStatuses: PedidoEstado[] = [PedidoEstado.ENTREGADO, PedidoEstado.CANCELADO];
  const isOrderChatDisabled = closedOrderStatuses.includes(order.estado as PedidoEstado);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">

      <main className="flex-1 pt-24 pb-20 md:pt-32">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Button variant="ghost" className="rounded-full pl-2 pr-4 hover:bg-primary/5 transition-all" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a mis pedidos
            </Button>
          </motion.div>

          {/* Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                    Pedido #{order.id.slice(-6).toUpperCase()}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full mt-1"
                    onClick={() => {
                      navigator.clipboard.writeText(order.id);
                      setIsCopied(true);
                      toast.success("ID copiado", { description: "El ID del pedido ha sido copiado al portapapeles." });
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    title="Copiar ID del pedido"
                  >
                    {isCopied ? (
                      <Check className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <Badge className={cn("rounded-full border px-4 py-1 font-bold", statusConfig[order.estado as PedidoEstado].color)}>
                  {statusConfig[order.estado as PedidoEstado].label}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Realizado el {format(new Date(order.fechaPedido), "PPP 'a las' p", { locale: es })}
              </p>
            </div>

            <div className="flex flex-col items-end gap-4">
              <StatusIcon className={cn("h-16 w-16 opacity-20", statusConfig[order.estado as PedidoEstado].color.split(" ")[1])} />

              <Button
                variant="outline"
                className="rounded-2xl border-primary/20 text-primary hover:bg-primary/5 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={handleRepeatOrder}
                disabled={isRepeating}
              >
                {isRepeating ? (
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isRepeating ? "Repitiendo..." : "Repetir pedido"}
              </Button>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
              {/* Items Card (Invoice Style Flat) */}
              <div className="relative">
                <div className="pb-4 border-b border-dashed border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="font-black text-xl tracking-tight flex items-center gap-2 text-foreground/90">
                    <Package className="h-6 w-6 text-primary" />
                    Detalle de Productos
                  </h3>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                    {order.detalles.length} artículo(s)
                  </div>
                </div>

                <div className="p-0">
                  <div className="divide-y-2 divide-dashed divide-border/30">
                    {order.detalles.map((detalle: any) => (
                      <div
                        key={detalle.id}
                        className="group p-5 md:p-6 flex items-start sm:items-center gap-4 transition-all hover:bg-primary/[0.05] cursor-pointer active:scale-[0.99]"
                        onClick={() => setSelectedProduct(detalle.producto)}
                      >
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-muted overflow-hidden border border-border/40 flex-shrink-0">
                          {detalle.producto.images && detalle.producto.images.length > 0 ? (
                            <img src={detalle.producto.images[0]} alt={detalle.producto.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-primary font-bold">{detalle.producto.name.charAt(0)}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm md:text-base leading-tight text-foreground/90 mb-1.5 group-hover:text-primary transition-colors">{detalle.producto.name}</h4>
                            <p className="text-xs font-bold text-muted-foreground">
                              {detalle.cantidad} {detalle.unidadMedida} <span className="mx-1 text-muted-foreground/50">×</span> ${(detalle.precioUnitario || 0).toLocaleString("es-CO")}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 mt-2 sm:mt-0 shrink-0">
                            <p className="font-black text-base md:text-lg text-foreground/90">${(detalle.subtotal || 0).toLocaleString("es-CO")}</p>
                            <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="pt-6">
                <div className="space-y-6">
                  <h3 className="font-black text-xl tracking-tight flex items-center gap-2 text-foreground/90">
                    <MapPin className="h-6 w-6 text-primary" />
                    Información de Entrega
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60">Dirección</p>
                      <p className="font-bold text-sm text-foreground/80">{order.direccionEntrega}</p>
                    </div>
                    {order.notasCliente && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60">Notas</p>
                        <p className="font-medium text-sm italic text-muted-foreground">"{order.notasCliente}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-8 md:pl-8 md:border-l md:border-dashed md:border-border/40">
              <div className="relative">
                <div className="pb-4 border-b border-dashed border-border/50">
                  <h3 className="font-black text-xl tracking-tight flex items-center gap-2 text-foreground/90">
                    <FileText className="h-6 w-6 text-primary" />
                    Resumen de Pago
                  </h3>
                </div>


                <div className="py-6 space-y-4">
                  <div className="space-y-3.5 text-base">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">Subtotal</span>
                      <span className="font-bold text-foreground/80">${order.subtotal.toLocaleString("es-CO")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">Impuestos</span>
                      <span className="font-bold text-foreground/80">${order.impuestos.toLocaleString("es-CO")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">Envío</span>
                      <span className="font-bold text-foreground/80">${order.costoEnvio.toLocaleString("es-CO")}</span>
                    </div>
                  </div>
                </div>

                {/* Receipt Dashed Divider with Cutouts (Optional, adjust if needed) */}
                <div className="relative h-px w-full my-4">
                  <div className="absolute inset-0 border-t-2 border-dashed border-border/40" />
                </div>

                <div className="pt-4 pb-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/60">Total a Pagar</span>
                    <span className="text-4xl font-black tracking-tight text-primary">${order.total.toLocaleString("es-CO")}</span>
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
                </div>
              </div>
              <div className="rounded-3xl bg-secondary/30 p-6 space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-bold text-sm">Compra protegida</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tu pedido está siendo procesado bajo nuestros estándares de calidad agroecológica. Si tienes dudas, contáctanos.
                </p>
              </div>
              {orderStoreIds.length > 0 && (
                <div className="rounded-3xl border border-border/60 bg-card p-6 space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-bold text-sm">Chat con vendedor</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Escríbele al vendedor asociado a este pedido mientras siga abierto.
                  </p>
                  <div className="space-y-2">
                    {orderStoreIds.map((storeId, index) => (
                      <Button
                        key={storeId}
                        variant="outline"
                        className="relative w-full rounded-2xl justify-start"
                        onClick={() => handleOpenSellerChat(storeId)}
                        disabled={isOrderChatDisabled || isOpeningChat}
                      >
                        {isOpeningChat ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <MessageSquare className="mr-2 h-4 w-4" />
                        )}
                        {orderStoreIds.length > 1 ? `Vendedor ${index + 1}` : "Abrir chat"}
                        {getUnreadChatCount(storeId) > 0 ? (
                          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white animate-pulse shadow-md shadow-red-500/30 border-2 border-background">
                            {getUnreadChatCount(storeId)}
                          </span>
                        ) : null}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          viewOnly={true}
        />
      )}
      {orderChat && (
        <OrderChatPanel
          conversation={orderChat.conversation}
          initialMessages={orderChat.messages}
          isLoading={orderChat.isLoading}
          title={`Pedido #${order.id.slice(-6).toUpperCase()}`}
          disabled={isOrderChatDisabled}
          onClose={() => setOrderChat(null)}
          onMarkAsRead={handleMarkOrderChatAsRead}
        />
      )}
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
