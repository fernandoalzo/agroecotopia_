"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Footer from "@/components/Footer";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRightCircle, Package, MapPin, CreditCard, Calendar, Clock, CheckCircle2, Truck, Timer, XCircle, FileText, RefreshCw, Copy, Check, ChevronRight, ChevronDown, MessageSquare, Tag, Warehouse, Building2, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
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
import { Product } from "@/types";
import { useSocket } from "@/frontend/context/SocketContext";
import { useSocketRefresh } from "@/frontend/hooks/useSocketRefresh";
import logger from "@/utils/logger";
import { Loader2 } from "lucide-react";

import { getNextStatuses } from "@/frontend/components/admin/pedidos/adminOrderUtils";
import { getRelatedProductsAction } from "@/backend/modules/product/product.actions";
import { BulkRatingModal } from "@/frontend/components/products/BulkRatingModal";
import { rateProductAction, getPendingRatingsAction, getUserProductRatingAction } from "@/backend/modules/productRating/productRating.actions";
const log = logger.child("src/app/pedidos/[id]/page.tsx");


const statusConfig = {
  [PedidoEstado.PENDIENTE]: {
    label: "Pendiente",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    btnClass: "bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-black hover:border-amber-500/50 hover:shadow-[0_4px_12px_rgba(245,158,11,0.2)]",
    icon: Clock,
  },
  [PedidoEstado.CONFIRMADO]: {
    label: "Confirmado",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    btnClass: "bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-black hover:border-blue-500/50 hover:shadow-[0_4px_12px_rgba(59,130,246,0.2)]",
    icon: CheckCircle2,
  },
  [PedidoEstado.EN_PREPARACION]: {
    label: "En Preparación",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    btnClass: "bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-black hover:border-indigo-500/50 hover:shadow-[0_4px_12px_rgba(99,102,241,0.2)]",
    icon: Timer,
  },
  [PedidoEstado.EN_CAMINO]: {
    label: "En Camino",
    color: "bg-sky-500/10 text-sky-600 border-sky-500/20",
    btnClass: "bg-sky-500/10 dark:bg-sky-500/5 border border-sky-500/20 text-sky-600 dark:text-sky-400 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 dark:hover:text-black hover:border-sky-500/50 hover:shadow-[0_4px_12px_rgba(14,165,233,0.2)]",
    icon: MapPin,
  },
  [PedidoEstado.EN_BODEGA]: {
    label: "En Bodega",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    btnClass: "bg-purple-500/10 dark:bg-purple-500/5 border border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white dark:hover:bg-purple-500 dark:hover:text-black hover:border-purple-500/50 hover:shadow-[0_4px_12px_rgba(168,85,247,0.2)]",
    icon: Warehouse,
  },
  [PedidoEstado.ENTREGADO]: {
    label: "Entregado",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    btnClass: "bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-black hover:border-emerald-500/50 hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)]",
    icon: Package,
  },
  [PedidoEstado.CANCELADO]: {
    label: "Cancelado",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    btnClass: "bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white hover:border-rose-500/50 hover:shadow-[0_4px_12px_rgba(244,63,94,0.2)]",
    icon: XCircle,
  },
};

interface OrderDetailPageClientProps {
  id: string;
  getOrderDetail: (orderId: string) => Promise<any>;
  cancelUserOrder: (orderId: string, motivoCancelacion?: string) => Promise<any>;
  deleteUserOrder: (orderId: string) => Promise<any>;
  processMercadoPagoPayment: (storeId: string, paymentId: string) => Promise<any>;
  getConversationMessages: (conversationId: string) => Promise<any>;
  getOrCreateOrderConversation: (pedidoId: string, storeId: string) => Promise<any>;
  getSellerOrderConversations: (storeId: string) => Promise<any>;
  getUserOrderConversations: () => Promise<any>;
  markConversationAsRead: (conversationId: string) => Promise<any>;
  openOrderChat: (pedidoId: string, storeId: string) => Promise<any>;
  updateStoreOrderStatus: (storeId: string, pedidoId: string, nuevoEstado: PedidoEstado) => Promise<any>;
  removeProductFromOrder: (storeId: string, pedidoId: string, detalleId: string) => Promise<any>;
}

export default function OrderDetailPageClient({
  id,
  getOrderDetail,
  cancelUserOrder,
  deleteUserOrder,
  processMercadoPagoPayment,
  getConversationMessages,
  getOrCreateOrderConversation,
  getSellerOrderConversations,
  getUserOrderConversations,
  markConversationAsRead,
  openOrderChat,
  updateStoreOrderStatus,
  removeProductFromOrder,
}: OrderDetailPageClientProps) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
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

  // ─── Seller-specific state ───
  const [confirmingStatus, setConfirmingStatus] = useState<PedidoEstado | null>(null);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updatingToStatus, setUpdatingToStatus] = useState<PedidoEstado | null>(null);
  const [stockErrorProducts, setStockErrorProducts] = useState<{ productId: string; productName: string; detalleId: string }[] | null>(null);
  const [removingProductId, setRemovingProductId] = useState<string | null>(null);

  // ─── Rating state ───
  const [targetRatingProductIds, setTargetRatingProductIds] = useState<string[] | null>(null);
  const [ratedProductIds, setRatedProductIds] = useState<Set<string>>(new Set());
  const [bulkRatingOpen, setBulkRatingOpen] = useState(false);
  const [existingProductRatings, setExistingProductRatings] = useState<Record<string, { score: number; comment?: string | null }>>({});
  const [isRatingsLoaded, setIsRatingsLoaded] = useState(false);

  const isBuyer = session?.user?.id === order?.usuarioId;
  const sellerStore: { id: string; name: string } | null = React.useMemo(() => {
    if (!order || !session?.user?.id || isBuyer) return null;
    for (const detalle of order.detalles || []) {
      if (detalle.store?.ownerId === session.user.id) {
        return { id: detalle.store.id, name: detalle.store.name };
      }
    }
    return null;
  }, [order, session?.user?.id, isBuyer]);

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
        const result = await getOrderDetail(id);
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

  // ─── Auto-open bulk rating modal from notification ───
  const rateParam = searchParams.get("rate");
  useEffect(() => {
    if (rateParam === "all" && order?.estado === PedidoEstado.ENTREGADO) {
      setTargetRatingProductIds(null);
      setBulkRatingOpen(true);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("rate");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [order?.estado, rateParam]);

  // ─── Fetch existing ratings on load ───
  useEffect(() => {
    if (order?.estado !== PedidoEstado.ENTREGADO || !order?.detalles?.length) return;
    const fetchExistingRatings = async () => {
      const productIds = order.detalles.map((d: any) => d.productoId);
      const results = await Promise.all(
        productIds.map((pid: string) =>
          getUserProductRatingAction(pid, order.id).catch(() => null)
        )
      );
      const map: Record<string, { score: number; comment?: string | null }> = {};
      for (let i = 0; i < productIds.length; i++) {
        const r = results[i];
        if (r && !("error" in r) && r !== null) {
          map[productIds[i]] = { score: r.score, comment: r.comment };
        }
      }
      setExistingProductRatings(map);
      setIsRatingsLoaded(true);
    };
    fetchExistingRatings();
  }, [order?.estado, order?.id]);

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
          const updatedOrder = await getOrderDetail(id);
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
            const storeId = orderStoreIds[0] || (order?.detalles?.[0]?.storeId);
            if (!storeId) {
               throw new Error("No se pudo determinar la tienda para verificar el pago");
            }
            const result = await processMercadoPagoPayment(storeId, paymentId);
            if (result && "success" in result) {
              confirmed = true;
              const updatedOrder = await getOrderDetail(id);
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
  }, [getOrderDetail, id, processMercadoPagoPayment, router]);

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
            const res = await getSellerOrderConversations(storeId);
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

      const res = await getUserOrderConversations();
      if (!Array.isArray(res)) {
        log.debug("[chat badge] getUserOrderConversations no devolvió array", { res });
        return;
      }

      const counts = res.reduce((acc: Record<string, number>, conv: any) => {
        if (conv?.pedido?.id) {
          const unread = Number(conv.unreadCount) || 0;
          acc[conv.pedido.id] = (acc[conv.pedido.id] || 0) + unread;
          if (conv.store?.id) {
            acc[conv.store.id] = (acc[conv.store.id] || 0) + unread;
          }
        }
        return acc;
      }, {});

      setOrderChatUnreadCounts(counts);
    } catch (err) {
      log.error("[chat badge] Error loading order unread counts:", err);
    }
  }, [getSellerOrderConversations, getUserOrderConversations, order?.id, orderStoreIds.join("|"), session?.user?.role]);

  useSocketRefresh({
    socket,
    enabled: !!order?.id && orderStoreIds.length > 0,
    refresh: loadUnreadCounts,
  });

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("join_order", { pedidoId: id });
    return () => { socket.emit("leave_order", { pedidoId: id }); };
  }, [socket, id]);

  const orderUpdateEvents = React.useMemo(
    () => ["order:status_updated", "order:delivered"],
    []
  );

  useSocketRefresh({
    socket,
    enabled: !!order?.id,
    refresh: async () => {
      try {
        const result = await getOrderDetail(id);
        if (result && !("error" in result)) {
          setOrder(result);
          toast.info(`El pedido ha sido actualizado`, {
            description: `El estado del pedido ahora es ${statusConfig[result.estado as PedidoEstado]?.label || result.estado}`
          });
        }
      } catch (error) {
        log.error("Error fetching updated order detail via socket:", error);
      }
    },
    events: orderUpdateEvents,
  });

  // Listen to envio events (emitted globally — filter by pedidoId)
  useSocketRefresh({
    socket,
    enabled: !!order?.id,
    refresh: async () => {
      try {
        const result = await getOrderDetail(id);
        if (result && !("error" in result)) {
          setOrder(result);
        }
      } catch (error) {
        log.error("Error fetching order detail after envio event:", error);
      }
    },
    events: React.useMemo(() => ["envio:created", "envio:status_updated"], []),
  });

  useEffect(() => {
    loadUnreadCounts();
  }, [loadUnreadCounts]);

  const handleRepeatOrder = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!order || !order.detalles || isRepeating) return;

    setIsRepeating(true);

    const { getAvailableStockBatchAction } = await import("@/backend/modules/stockGuardian/stockGuardian.actions");

    const productIds = order.detalles
      .filter((d: any) => d.producto?.id)
      .map((d: any) => d.producto.id);

    const stockMap = productIds.length > 0 ? await getAvailableStockBatchAction(productIds) : {};

    let addedCount = 0;
    const unavailable: { name: string; requested: number; available: number }[] = [];

    for (const detalle of order.detalles) {
      if (!detalle.producto) continue;
      const available = stockMap[detalle.producto.id] ?? 0;
      if (available >= detalle.cantidad) {
        addToCart(detalle.producto, detalle.cantidad, false);
        addedCount++;
      } else {
        unavailable.push({
          name: detalle.producto.name,
          requested: detalle.cantidad,
          available,
        });
      }
    }

    if (addedCount > 0) {
      if (unavailable.length > 0) {
        toast.success(`${addedCount} producto(s) agregados al carrito`, {
          id: "repeat-order-partial",
          description: `Sin stock suficiente: ${unavailable.map((u) => u.name).join(", ")}`,
          duration: 5000,
        });
      } else {
        toast.success("Productos agregados al carrito", {
          id: "repeat-order-toast",
          description: "Serás redirigido al carrito...",
        });
      }
      setIsNavigating(true);
      setTimeout(() => {
        router.push("/cart");
      }, 800);
    } else {
      if (unavailable.length > 0) {
        toast.error("No hay stock suficiente", {
          id: "repeat-order-error",
          description: `Sin stock disponible: ${unavailable.map((u) => u.name).join(", ")}`,
          duration: 5000,
        });
      } else {
        toast.error("No se pudieron agregar los productos al carrito", { id: "repeat-order-error" });
      }
      setIsRepeating(false);
    }
  };

  const handleCancelOrder = async () => {
    setCanceling(true);
    try {
      const result = await cancelUserOrder(order.id, cancelReason.trim() || undefined);
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
      setCancelReason("");
    }
  };

  const handleDeleteOrder = async () => {
    setDeleting(true);
    try {
      const result = await deleteUserOrder(order.id);
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
      const res = await openOrderChat(order.id, storeId);
      if (!res || "error" in res) {
        toast.error("No se pudo abrir el chat", {
          description: res && "error" in res ? String(res.error) : undefined,
        });
        return;
      }

      const conversation = res.conversation as OrderConversation;
      const messageList = (res.messages || []) as Message[];
      const unreadCount = messageList.filter(
        (message) => !message.isRead && message.senderId !== session?.user?.id
      ).length;

      setOrderChat({
        conversation,
        messages: messageList,
        isLoading: false,
        unreadCount,
      });

      // Actualizar localmente el estado de no leídos para evitar otra carga redundante
      setOrderChatUnreadCounts((prev) => ({
        ...prev,
        [storeId]: unreadCount,
        [order.id]: unreadCount,
      }));
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
    await markConversationAsRead(conversationId);
    setOrderChat((current) => (current ? { ...current, unreadCount: 0 } : current));
  };

  const handleUpdateStatus = async (nuevoEstado: PedidoEstado) => {
    if (!sellerStore) return;
    setIsUpdatingStatus(true);
    setUpdatingToStatus(nuevoEstado);
    try {
      const result = await updateStoreOrderStatus(sellerStore.id, order.id, nuevoEstado);
      if (result && "error" in result) {
        if (result.outOfStockProducts && result.outOfStockProducts.length > 0) {
          setStockErrorProducts(result.outOfStockProducts);
          setConfirmingStatus(null);
          setShowStatusOptions(false);
        } else {
          toast.error("Error", { description: result.error });
        }
      } else {
        // Re-fetch from server to ensure the UI reflects the DB-confirmed state,
        // not an optimistic local value.
        const updatedOrder = await getOrderDetail(order.id);
        if (updatedOrder && !("error" in updatedOrder)) {
          setOrder(updatedOrder);
          toast.success("Estado actualizado", { description: `Pedido cambiado a ${statusConfig[updatedOrder.estado as PedidoEstado].label}` });
        } else {
          // Fallback: use the local value if re-fetch fails
          setOrder((prev: any) => prev ? { ...prev, estado: nuevoEstado } : prev);
          toast.success("Estado actualizado", { description: `Pedido cambiado a ${statusConfig[nuevoEstado].label}` });
        }
        setStockErrorProducts(null);
        setConfirmingStatus(null);
      }
    } catch {
      toast.error("Error", { description: "No se pudo actualizar el estado del pedido." });
    } finally {
      setIsUpdatingStatus(false);
      setUpdatingToStatus(null);
    }
  };

  const handleRemoveProduct = async (detalleId: string) => {
    if (!sellerStore) return;
    setRemovingProductId(detalleId);
    try {
      const result = await removeProductFromOrder(sellerStore.id, order.id, detalleId);
      if (result && "error" in result) {
        toast.error("Error", { description: result.error });
      } else {
        toast.success("Producto retirado", { description: "El producto ha sido retirado del pedido." });
        const updatedOrder = await getOrderDetail(order.id);
        if (updatedOrder && !("error" in updatedOrder)) {
          setOrder(updatedOrder);
        }
        setStockErrorProducts((prev) => {
          if (!prev) return null;
          const remaining = prev.filter((p) => p.detalleId !== detalleId);
          if (remaining.length === 0) {
            setShowStatusOptions(true);
            return null;
          }
          return remaining;
        });
      }
    } catch {
      toast.error("Error", { description: "No se pudo retirar el producto." });
    } finally {
      setRemovingProductId(null);
    }
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
  const closedOrderStatuses: PedidoEstado[] = [PedidoEstado.ENTREGADO];
  const isOrderChatDisabled = closedOrderStatuses.includes(order.estado as PedidoEstado);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">

      <main className="flex-1 pt-24 pb-20 md:pt-32">
        <motion.div
          animate={isNavigating ? { scale: 1.4, opacity: 0, filter: "blur(10px)" } : { opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="container px-4 md:px-6 max-w-4xl mx-auto"
        >
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

              {isBuyer && (
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
              )}
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
                    {order.detalles.map((detalle: any) => {
                      const isOutOfStock = sellerStore && !isBuyer && Number(detalle.producto.stock) < Number(detalle.cantidad);
                      return (
                      <div
                        key={detalle.id}
                        className={cn(
                          "group p-5 md:p-6 flex items-start sm:items-center gap-4 transition-all",
                          isOutOfStock ? "bg-rose-500/5 cursor-default" : "hover:bg-primary/[0.05] cursor-pointer active:scale-[0.99]"
                        )}
                        onClick={() => !isOutOfStock && setSelectedProduct(detalle.producto)}
                      >
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-muted overflow-hidden border border-border/40 flex-shrink-0">
                          {detalle.producto.images && detalle.producto.images.length > 0 ? (
                            <img src={detalle.producto.images[0]} alt={detalle.producto.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-primary font-bold">{detalle.producto.name.charAt(0)}</div>
                          )}
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-rose-500/10 flex items-center justify-center">
                              <XCircle className="h-6 w-6 text-rose-500/60" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm md:text-base leading-tight text-foreground/90 mb-1.5 flex items-center gap-2 flex-wrap">
                              {detalle.producto.name}
                              {detalle.precioUnitario < detalle.producto.price && (
                                <Badge className="bg-red-500 text-white hover:bg-red-600 text-[10px] px-1.5 py-0">OFERTA</Badge>
                              )}
                              {isOutOfStock && (
                                <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full text-[10px] font-bold px-2 py-0">
                                  SIN STOCK
                                </Badge>
                              )}
                            </h4>
                            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                              <span>{detalle.cantidad} {detalle.unidadMedida}</span>
                              <span className="text-muted-foreground/50">×</span>
                              {detalle.precioUnitario < detalle.producto.price && (
                                <span className="line-through text-muted-foreground/50">${(detalle.producto.price || 0).toLocaleString("es-CO")}</span>
                              )}
                              <span className={cn(detalle.precioUnitario < detalle.producto.price && "text-red-600 font-black")}>
                                ${(detalle.precioUnitario || 0).toLocaleString("es-CO")}
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-4 mt-2 sm:mt-0 shrink-0">
                            <div className="flex flex-col items-end">
                              {detalle.precioUnitario < detalle.producto.price && (
                                <span className="text-xs line-through text-muted-foreground/50">
                                  ${((detalle.producto.price || 0) * detalle.cantidad).toLocaleString("es-CO")}
                                </span>
                              )}
                              <p className={cn("font-black text-base md:text-lg", detalle.precioUnitario < detalle.producto.price ? "text-red-600" : "text-foreground/90")}>
                                ${(detalle.subtotal || 0).toLocaleString("es-CO")}
                              </p>
                            </div>
                            {isOutOfStock ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0 rounded-lg text-xs h-8 border-red-500/20 text-red-600 hover:bg-red-500/10"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleRemoveProduct(detalle.id);
                                }}
                                disabled={removingProductId === detalle.id}
                              >
                                {removingProductId === detalle.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  "Retirar"
                                )}
                              </Button>
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ─── Rating Section (Buyer, ENTREGADO) ─── */}
              {(() => {
                if (!isBuyer || order.estado !== PedidoEstado.ENTREGADO || !isRatingsLoaded) return null;
                const unratedProducts = order.detalles.filter(
                  (d: any) => !ratedProductIds.has(d.productoId) && !existingProductRatings[d.productoId]
                );
                if (unratedProducts.length === 0) return null;

                return (
                  <div className="pt-4">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">
                            {t.ratings?.pendingTitle || "Califica tus productos"}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {t.ratings?.pendingDescription || "Ayuda a la comunidad con tu opinión"}
                          </p>
                        </div>
                      </div>
                      <div className="divide-y divide-emerald-500/10">
                        {unratedProducts.map((detalle: any) => (
                          <div key={detalle.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3 min-w-0">
                              {detalle.producto.images?.[0] ? (
                                <img src={detalle.producto.images[0]} alt={detalle.producto.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                              ) : (
                                <span className="text-2xl shrink-0">{detalle.producto.emoji || "📦"}</span>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{detalle.producto.name}</p>
                                <p className="text-[10px] text-muted-foreground">{detalle.cantidad} {detalle.unidadMedida}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="shrink-0 rounded-xl text-xs font-bold h-9 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                              onClick={() => {
                                setTargetRatingProductIds([detalle.productoId]);
                                setBulkRatingOpen(true);
                              }}
                            >
                              <Star className="w-3.5 h-3.5 mr-1.5" />
                              {t.ratings?.rateNow || "Calificar"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Delivery Info */}
              <div className="pt-6">
                <div className="space-y-6">
                  <h3 className="font-black text-xl tracking-tight flex items-center gap-2 text-foreground/90">
                    {order.tipoEntrega === "RECOJO_EN_BODEGA" ? (
                      <Warehouse className="h-6 w-6 text-primary" />
                    ) : (
                      <MapPin className="h-6 w-6 text-primary" />
                    )}
                    Información de Entrega
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {order.tipoEntrega === "RECOJO_EN_BODEGA" ? (
                      <div className="space-y-1.5 sm:col-span-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60">Recojo en Bodega</p>
                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                          <p className="font-bold text-sm text-foreground/80 flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-emerald-600" />
                            {order.bodega?.name || "Bodega"}
                          </p>
                          {order.bodega && (
                            <>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5" />
                                {order.bodega.address}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5" />
                                {order.bodega.city}
                              </p>
                            </>
                          )}
                          <span className="inline-flex text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            Sin costo de envío
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60">Dirección</p>
                        <p className="font-bold text-sm text-foreground/80">{order.direccionEntrega}</p>
                      </div>
                    )}
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
                      {order.tipoEntrega === "RECOJO_EN_BODEGA" ? (
                        <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          Sin costo
                        </span>
                      ) : (
                        <span className="font-bold text-foreground/80">${order.costoEnvio.toLocaleString("es-CO")}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Receipt Dashed Divider with Cutouts (Optional, adjust if needed) */}
                <div className="relative h-px w-full my-4">
                  <div className="absolute inset-0 border-t-2 border-dashed border-border/40" />
                </div>

                <div className="pt-4 pb-6">
                  {(() => {
                    const totalDiscount = order.detalles.reduce((acc: number, d: any) => {
                      const diff = (d.producto.price || 0) - d.precioUnitario;
                      return acc + (diff > 0 ? diff * d.cantidad : 0);
                    }, 0);
                    const hasDiscount = totalDiscount > 0;
                    
                    return (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                          Total a Pagar {hasDiscount && <Tag className="h-4 w-4 text-red-500" />}
                        </span>
                        {hasDiscount ? (
                          <div className="flex flex-col">
                            <span className="text-lg line-through text-muted-foreground/50">${(order.total + totalDiscount).toLocaleString("es-CO")}</span>
                            <span className="text-4xl font-black tracking-tight text-red-600">${order.total.toLocaleString("es-CO")}</span>
                          </div>
                        ) : (
                          <span className="text-4xl font-black tracking-tight text-primary">${order.total.toLocaleString("es-CO")}</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* ─── Progress Timeline (buyer view) ─── */}
                  {isBuyer && (
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <RefreshCw className={cn("h-4 w-4", isUpdatingStatus && "animate-spin")} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">Progreso del pedido</h4>
                          <p className="text-[11px] text-muted-foreground">
                            {isUpdatingStatus
                              ? <span className="font-semibold text-primary animate-pulse">Actualizando…</span>
                              : <><span className="text-muted-foreground">Estado actual: </span><span className="font-semibold text-foreground">{statusConfig[order.estado as PedidoEstado].label}</span></>
                            }
                          </p>
                        </div>
                      </div>

                      {(() => {
                        const getStatuses = () => {
                          if (order.tipoEntrega === "ENVIO") {
                            return [
                              PedidoEstado.PENDIENTE,
                              PedidoEstado.CONFIRMADO,
                              PedidoEstado.EN_PREPARACION,
                              PedidoEstado.EN_CAMINO,
                              PedidoEstado.ENTREGADO,
                            ];
                          }
                          return [
                            PedidoEstado.PENDIENTE,
                            PedidoEstado.CONFIRMADO,
                            PedidoEstado.EN_PREPARACION,
                            PedidoEstado.EN_BODEGA,
                            PedidoEstado.ENTREGADO,
                          ];
                        };
                        const allStatuses: PedidoEstado[] = getStatuses();
                        const currentIdx = allStatuses.indexOf(order.estado as PedidoEstado);
                        const isCancelled = order.estado === PedidoEstado.CANCELADO;

                        return (
                          <div className={cn("relative px-1 transition-opacity duration-200", isUpdatingStatus && "opacity-40 pointer-events-none")}>
                            <div className="absolute left-6 top-0 bottom-0 w-px bg-border/60" />

                            <div className="relative space-y-0">
                              {allStatuses.map((status, idx) => {
                                const StatusIcon = statusConfig[status].icon;
                                const isCompleted = idx <= currentIdx && !isCancelled;
                                const isCurrent = idx === currentIdx && !isCancelled;

                                return (
                                  <div key={status} className="relative flex items-start gap-4 pb-6 last:pb-0">
                                    <div
                                      className={cn(
                                        "relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                                        isCurrent
                                          ? "border-primary bg-primary shadow-[0_0_0_4px_rgba(34,197,94,0.15)]"
                                          : isCompleted
                                            ? "border-emerald-500 bg-emerald-500"
                                            : "border-border/40 bg-background"
                                      )}
                                    >
                                      {isCompleted && !isCurrent ? (
                                        <Check className="h-3 w-3 text-white" />
                                      ) : isCurrent ? (
                                        <div className="h-2 w-2 rounded-full bg-white" />
                                      ) : null}
                                    </div>

                                    <div className={cn(
                                      "min-w-0 pt-0.5",
                                      isCurrent ? "font-bold text-foreground" : isCompleted ? "text-muted-foreground/80" : "text-muted-foreground/40"
                                    )}>
                                      <div className="flex items-center gap-2">
                                        <StatusIcon className={cn(
                                          "h-3.5 w-3.5",
                                          isCurrent ? "text-primary" : isCompleted ? "text-emerald-500" : "text-muted-foreground/30"
                                        )} />
                                        <span className={cn(
                                          "text-xs font-semibold",
                                          isCurrent && "text-primary"
                                        )}>
                                          {statusConfig[status].label}
                                        </span>
                                        {isCurrent && (
                                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}

                              {isCancelled && (
                                <div className="relative flex items-start gap-4 pb-0">
                                  <div className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-rose-500 bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.15)]">
                                    <XCircle className="h-3 w-3 text-white" />
                                  </div>
                                  <div className="min-w-0 pt-0.5 font-bold text-rose-500">
                                    <div className="flex items-center gap-2">
                                      <XCircle className="h-3.5 w-3.5" />
                                      <span className="text-xs font-bold">Cancelado</span>
                                    </div>
                                    {order.motivoCancelacion && (
                                      <p className="text-[11px] font-medium text-muted-foreground mt-1 italic">
                                        &ldquo;{order.motivoCancelacion}&rdquo;
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {isBuyer && order.estado === PedidoEstado.PENDIENTE && (
                    isConfirmingCancel ? (
                      <div className="mt-6 space-y-3">
                        <textarea
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="¿Por qué cancelas el pedido? (opcional)"
                          rows={2}
                          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                        <div className="flex gap-2 w-full">
                          <Button
                            variant="outline"
                            className="flex-1 rounded-2xl"
                            onClick={() => {
                              setIsConfirmingCancel(false);
                              setCancelReason("");
                            }}
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

                  {isBuyer && (order.estado === PedidoEstado.EN_BODEGA || order.estado === PedidoEstado.ENTREGADO) && (
                    <Button
                      variant="outline"
                      className="mt-6 w-full rounded-2xl text-muted-foreground border-border/20 hover:bg-muted/50 cursor-not-allowed opacity-50"
                      disabled
                    >
                      <Warehouse className="mr-2 h-4 w-4" />
                      {order.estado === PedidoEstado.EN_BODEGA
                        ? "El pedido está listo para recoger en bodega, ya no se puede cancelar"
                        : "El pedido ya fue entregado, no se puede cancelar"}
                    </Button>
                  )}

                  {isBuyer && order.estado === PedidoEstado.CANCELADO && (
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

                  {sellerStore && !isBuyer && (
                    <div className="mt-8 space-y-6">
                      {/* ─── Progress Timeline ─── */}
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            {isUpdatingStatus
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <RefreshCw className="h-4 w-4" />
                            }
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">Progreso del pedido</h4>
                            <p className="text-[11px] text-muted-foreground">
                              {isUpdatingStatus
                                ? <span className="font-semibold text-primary animate-pulse">
                                    {order.tipoEntrega === "ENVIO" && updatingToStatus === PedidoEstado.EN_PREPARACION 
                                      ? "Confirmando y Creando Envío…" 
                                      : "Confirmando con la base de datos…"}
                                  </span>
                                : <><span className="text-muted-foreground">Estado actual: </span><span className="font-semibold text-foreground">{statusConfig[order.estado as PedidoEstado].label}</span></>
                              }
                            </p>
                          </div>
                        </div>

                        {(() => {
                          const getStatuses = () => {
                            if (order.tipoEntrega === "ENVIO") {
                              return [
                                PedidoEstado.PENDIENTE,
                                PedidoEstado.CONFIRMADO,
                                PedidoEstado.EN_PREPARACION,
                                PedidoEstado.EN_CAMINO,
                                PedidoEstado.ENTREGADO,
                              ];
                            }
                            return [
                              PedidoEstado.PENDIENTE,
                              PedidoEstado.CONFIRMADO,
                              PedidoEstado.EN_PREPARACION,
                              PedidoEstado.EN_BODEGA,
                              PedidoEstado.ENTREGADO,
                            ];
                          };
                          const allStatuses: PedidoEstado[] = getStatuses();
                          const currentIdx = allStatuses.indexOf(order.estado as PedidoEstado);
                          const isCancelled = order.estado === PedidoEstado.CANCELADO;

                          return (
                            <div className={cn("relative px-1 transition-opacity duration-200", isUpdatingStatus && "opacity-40 pointer-events-none")}>
                              {/* Barra de progreso de fondo */}
                              <div className="absolute left-6 top-0 bottom-0 w-px bg-border/60" />

                              <div className="relative space-y-0">
                                {allStatuses.map((status, idx) => {
                                  const StatusIcon = statusConfig[status].icon;
                                  const isCompleted = idx <= currentIdx && !isCancelled;
                                  const isCurrent = idx === currentIdx && !isCancelled;

                                  return (
                                    <div key={status} className="relative flex items-start gap-4 pb-6 last:pb-0">
                                      {/* Círculo indicador */}
                                      <div
                                        className={cn(
                                          "relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                                          isCurrent
                                            ? "border-primary bg-primary shadow-[0_0_0_4px_rgba(34,197,94,0.15)]"
                                            : isCompleted
                                              ? "border-emerald-500 bg-emerald-500"
                                              : "border-border/40 bg-background"
                                        )}
                                      >
                                        {isCompleted && !isCurrent ? (
                                          <Check className="h-3 w-3 text-white" />
                                        ) : isCurrent ? (
                                          <div className="h-2 w-2 rounded-full bg-white" />
                                        ) : null}
                                      </div>

                                      {/* Label */}
                                      <div className={cn(
                                        "min-w-0 pt-0.5",
                                        isCurrent ? "font-bold text-foreground" : isCompleted ? "text-muted-foreground/80" : "text-muted-foreground/40"
                                      )}>
                                        <div className="flex items-center gap-2">
                                          <StatusIcon className={cn(
                                            "h-3.5 w-3.5",
                                            isCurrent ? "text-primary" : isCompleted ? "text-emerald-500" : "text-muted-foreground/30"
                                          )} />
                                          <span className={cn(
                                            "text-xs font-semibold",
                                            isCurrent && "text-primary"
                                          )}>
                                            {statusConfig[status].label}
                                          </span>
                                          {isCurrent && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Estado cancelado */}
                                {isCancelled && (
                                  <div className="relative flex items-start gap-4 pb-0">
                                    <div className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-rose-500 bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.15)]">
                                      <XCircle className="h-3 w-3 text-white" />
                                    </div>
                                    <div className="min-w-0 pt-0.5 font-bold text-rose-500">
                                      <div className="flex items-center gap-2">
                                        <XCircle className="h-3.5 w-3.5" />
                                        <span className="text-xs font-bold">Cancelado</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* ─── Status Update ─── */}
                      {(() => {
                        const nextStatuses = getNextStatuses(order.estado, order.tipoEntrega);
                        const esEnvioEnPreparacion = order.tipoEntrega === "ENVIO" && order.estado === PedidoEstado.EN_PREPARACION;
                        if (nextStatuses.length === 0 && !esEnvioEnPreparacion) return null;
                        if (esEnvioEnPreparacion) {
                          return (
                            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                              <div className="flex items-start gap-3">
                                <Truck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                    Seguimiento de Envío
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Este pedido es de tipo envío a domicilio. El seguimiento se gestiona desde la sección <strong>Envíos</strong> del panel de tu tienda.
                                  </p>
                                  <Link
                                    href="/mi-tienda?tab=envios"
                                    className="inline-flex items-center gap-1.5 mt-3 rounded-lg text-xs font-bold h-8 px-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-black transition-all"
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    Ir a Envíos
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="overflow-hidden rounded-xl border border-border/30 bg-card/30">
                            <button
                              type="button"
                              onClick={() => setShowStatusOptions(s => !s)}
                              className={cn(
                                "flex items-center justify-between w-full px-4 py-3 text-xs font-semibold transition-colors",
                                showStatusOptions || confirmingStatus
                                  ? "text-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <span className="flex items-center gap-2.5">
                                <ArrowRightCircle className="h-3.5 w-3.5 text-primary/70" />
                                Avanzar pedido
                              </span>
                              <ChevronDown className={cn(
                                "h-3.5 w-3.5 transition-transform duration-200",
                                (showStatusOptions || confirmingStatus) && "rotate-180"
                              )} />
                            </button>

                            <AnimatePresence>
                              {(showStatusOptions || confirmingStatus) && (
                                <motion.div
                                  key="content"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-border/20 overflow-hidden"
                                >
                                  {confirmingStatus ? (
                                    <div className="p-3">
                                      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 mb-3">
                                        <Timer className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                          ¿{statusConfig[confirmingStatus].label}?
                                        </p>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setConfirmingStatus(null)}
                                          disabled={isUpdatingStatus}
                                          className="flex-1 rounded-lg border border-border/40 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateStatus(confirmingStatus)}
                                          disabled={isUpdatingStatus}
                                          className={cn(
                                            "flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5",
                                            confirmingStatus === PedidoEstado.CANCELADO
                                              ? "bg-rose-600 hover:bg-rose-700"
                                              : "bg-primary hover:bg-primary/90"
                                          )}
                                        >
                                          {isUpdatingStatus ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Check className="h-3.5 w-3.5" />
                                          )}
                                          Confirmar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-1.5">
                                      {nextStatuses.map((ns) => {
                                        const Icon = statusConfig[ns].icon;
                                        const isCancel = ns === PedidoEstado.CANCELADO;
                                        return (
                                          <button
                                            key={ns}
                                            type="button"
                                            onClick={() => setConfirmingStatus(ns)}
                                            className={cn(
                                              "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                              isCancel
                                                ? "text-rose-600 hover:bg-rose-500/10"
                                                : "text-foreground/70 hover:bg-accent hover:text-foreground"
                                            )}
                                          >
                                            <Icon className={cn(
                                              "h-4 w-4",
                                              isCancel && "text-rose-500"
                                            )} />
                                            <span className="flex-1 text-left">{statusConfig[ns].label}</span>
                                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })()}
                    </div>
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

            </div>
          </div>
        </motion.div>
      </main>

      <Footer />

      {stockErrorProducts && sellerStore && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Stock insuficiente</h3>
                  <p className="text-sm text-muted-foreground">
                    Estos productos no tienen stock disponible. Retíralos del pedido para continuar.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-border/40 rounded-xl border border-border/30">
                {stockErrorProducts.map((fp) => (
                  <div key={fp.detalleId} className="flex items-center justify-between gap-3 p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge className="shrink-0 bg-rose-500/10 text-rose-600 border-rose-500/20 rounded-full text-[10px] font-bold px-2 py-0">
                        SIN STOCK
                      </Badge>
                      <span className="text-sm font-semibold truncate">{fp.productName}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 rounded-lg text-xs h-8 border-red-500/20 text-red-600 hover:bg-red-500/10"
                      onClick={() => handleRemoveProduct(fp.detalleId)}
                      disabled={removingProductId === fp.detalleId}
                    >
                      {removingProductId === fp.detalleId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Retirar del pedido"
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              {stockErrorProducts.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg text-xs"
                    onClick={() => setStockErrorProducts(null)}
                  >
                    Cerrar
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          viewOnly={true}
          fetchRelatedProducts={getRelatedProductsAction}
        />
      )}
      <BulkRatingModal
        open={bulkRatingOpen}
        onOpenChange={(open) => {
          setBulkRatingOpen(open);
          if (!open) {
            setExistingProductRatings({});
            setTimeout(() => setTargetRatingProductIds(null), 300); // reset after animation
          }
        }}
        products={(order?.detalles || [])
          .filter((d: any) => targetRatingProductIds ? targetRatingProductIds.includes(d.productoId) : true)
          .map((d: any) => ({
            productId: d.productoId,
            productName: d.producto.name,
            productEmoji: d.producto.emoji,
            productImage: d.producto.images?.[0] || null,
            pedidoId: order.id,
          }))}
        existingRatings={existingProductRatings}
        onRate={async (productId, pedidoId, score, comment) => {
          await rateProductAction(productId, pedidoId, score, comment);
          setRatedProductIds(prev => new Set(prev).add(productId));
          setExistingProductRatings(prev => ({
            ...prev,
            [productId]: { score, comment }
          }));
        }}
      />

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

      {/* Floating Chat Button */}
      {orderStoreIds.length > 0 && !orderChat && order.estado !== PedidoEstado.ENTREGADO && (
        <div className="fixed bottom-6 right-6 z-[998]">
          <AnimatePresence>
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              onClick={() => handleOpenSellerChat(orderStoreIds[0])}
              disabled={isOrderChatDisabled || isOpeningChat}
              className="flex items-center gap-3 rounded-full bg-primary px-5 py-3.5 text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 disabled:opacity-70"
            >
              {isOpeningChat ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
              ) : (
                <MessageSquare className="h-5 w-5 shrink-0" />
              )}
              <span className="text-sm font-semibold whitespace-nowrap">
                {session?.user?.id === order.usuarioId
                  ? "Habla con el vendedor"
                  : `Habla con ${order.usuario?.name || "el cliente"}`}
              </span>
              {(() => {
                const totalUnread = orderStoreIds.reduce((sum, sid) => sum + getUnreadChatCount(sid), 0);
                return totalUnread > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-primary">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                ) : null;
              })()}
            </motion.button>
          </AnimatePresence>
        </div>
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
