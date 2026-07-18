"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Package,
  MapPin,
  User,
  Calendar,
  Check,
  Copy,
  Clock,
  CheckCircle2,
  Timer,
  Warehouse,
  XCircle,
  Truck,
  Tag,
  Building2,
  ChevronRight,
  ChevronDown,
  ArrowRightCircle,
  Loader2,
  RefreshCw,
  Store,
  Navigation,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/Loading";
import { PedidoEstado } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { getNextStatuses, getPreviousStatus, getNextStatusLineal } from "./adminOrderUtils";

const statusConfig: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
}> = {
  [PedidoEstado.PENDIENTE]: {
    label: "Pendiente",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    icon: Clock,
  },
  [PedidoEstado.CONFIRMADO]: {
    label: "Confirmado",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    icon: CheckCircle2,
  },
  [PedidoEstado.EN_PREPARACION]: {
    label: "En Preparación",
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    icon: Timer,
  },
  [PedidoEstado.EN_CAMINO]: {
    label: "En Camino",
    color: "text-sky-600",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    icon: Navigation,
  },
  [PedidoEstado.EN_BODEGA]: {
    label: "En Bodega",
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    icon: Warehouse,
  },
  [PedidoEstado.ENTREGADO]: {
    label: "Entregado",
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    icon: Package,
  },
  [PedidoEstado.CANCELADO]: {
    label: "Cancelado",
    color: "text-rose-600",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    icon: XCircle,
  },
};

const getTimelineStatuses = (tipoEntrega?: string): PedidoEstado[] => {
  if (tipoEntrega === "ENVIO") {
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

interface OrderDetailPanelProps {
  pedidoId: string;
  storeId: string;
  onClose: () => void;
  getOrderDetail: (pedidoId: string) => Promise<any>;
  updateStoreOrderStatus: (storeId: string, pedidoId: string, newStatus: PedidoEstado) => Promise<any>;
  onDeleteOrder?: (pedidoId: string) => Promise<any>;
  onNavigateToEnvio?: (pedidoId: string) => void;
}

export function OrderDetailPanel({
  pedidoId,
  storeId,
  onClose,
  getOrderDetail,
  updateStoreOrderStatus,
  onDeleteOrder,
  onNavigateToEnvio,
}: OrderDetailPanelProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [isCopied, setIsCopied] = useState(false);
  const [confirmingStatus, setConfirmingStatus] = useState<PedidoEstado | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updatingToStatus, setUpdatingToStatus] = useState<PedidoEstado | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      // Solo mostrar spinner en la carga inicial (cuando no hay datos aún)
      const isInitialLoad = !order;
      if (isInitialLoad) {
        setLoading(true);
        setError(null);
      }
      try {
        const result = await getOrderDetail(pedidoId);
        if (result && "error" in result) {
          if (isInitialLoad) setError(result.error);
        } else {
          setOrder(result);
        }
      } catch {
        if (isInitialLoad) setError("Error al cargar el pedido");
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    };
    if (pedidoId) fetchOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId, getOrderDetail]);

  const handleUpdateStatus = async (nuevoEstado: PedidoEstado) => {
    setIsUpdatingStatus(true);
    setUpdatingToStatus(nuevoEstado);
    setConfirmingStatus(null);
    setShowStatusOptions(false);

    try {
      const result = await updateStoreOrderStatus(storeId, order.id, nuevoEstado);
      if (result && "error" in result) {
        toast.error(result.error);
      } else {
        // Re-fetch from server to ensure the UI reflects the DB-confirmed state
        const updatedOrder = await getOrderDetail(order.id);
        if (updatedOrder && !("error" in updatedOrder)) {
          setOrder(updatedOrder);
          toast.success(`Estado actualizado a ${statusConfig[updatedOrder.estado as PedidoEstado]?.label}`);
          
          if (nuevoEstado === "EN_PREPARACION" && updatedOrder.tipoEntrega === "ENVIO" && onNavigateToEnvio) {
            onNavigateToEnvio(updatedOrder.id);
            onClose();
          }
        } else {
          // Fallback: use the local value if re-fetch fails
          setOrder((prev: any) => prev ? { ...prev, estado: nuevoEstado } : prev);
          toast.success(`Estado actualizado a ${statusConfig[nuevoEstado]?.label}`);
          
          if (nuevoEstado === "EN_PREPARACION" && order.tipoEntrega === "ENVIO" && onNavigateToEnvio) {
            onNavigateToEnvio(order.id);
            onClose();
          }
        }
      }
    } catch {
      toast.error("No se pudo actualizar el estado del pedido");
    } finally {
      setIsUpdatingStatus(false);
      setUpdatingToStatus(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!onDeleteOrder) return;
    setIsDeleting(true);
    try {
      const result = await onDeleteOrder(order.id);
      if (result?.error) {
        toast.error("Error", { description: result.error });
      } else {
        toast.success("Pedido eliminado", { description: "El pedido ha sido eliminado permanentemente." });
        onClose();
      }
    } catch (err: any) {
      toast.error("Error", { description: err.message || "Error al eliminar el pedido" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <AnimatePresence>
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 backdrop-blur-[3px] z-40 cursor-pointer"
          />
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h2 className="text-lg font-bold tracking-tight">Cargando pedido...</h2>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Loading text="Cargando pedido..." subtext="Conectando a la huerta digital" className="py-0" />
          </div>
          </motion.div>
        </>
      </AnimatePresence>
    );
  }

  if (error || !order) {
    return (
      <AnimatePresence>
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 backdrop-blur-[3px] z-40 cursor-pointer"
          />
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h2 className="text-lg font-bold tracking-tight">Pedido</h2>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <XCircle className="h-12 w-12 text-rose-500 mb-4" />
            <p className="font-semibold text-muted-foreground">
              {error === "FORBIDDEN" ? "No tienes permiso para ver este pedido" : "Pedido no encontrado"}
            </p>
          </div>
          </motion.div>
        </>
      </AnimatePresence>
    );
  }

  const cfg = statusConfig[order.estado as PedidoEstado];
  const StatusIcon = cfg?.icon || Package;
  const nextStatuses = getNextStatuses(order.estado as PedidoEstado, order.tipoEntrega);
  const prevStatus = getPreviousStatus(order.estado as PedidoEstado, order.tipoEntrega);
  const nextStatusLineal = getNextStatusLineal(order.estado as PedidoEstado, order.tipoEntrega);
  const esEnvio = order.tipoEntrega === "ENVIO";
  const esRecojo = order.tipoEntrega === "RECOJO_EN_BODEGA";
  const esEnvioEnProceso = esEnvio && ([PedidoEstado.EN_PREPARACION, PedidoEstado.EN_CAMINO, PedidoEstado.ENTREGADO] as PedidoEstado[]).includes(order.estado as PedidoEstado);

  const totalDiscount = order.detalles?.reduce((acc: number, d: any) => {
    const diff = (d.producto?.price || 0) - d.precioUnitario;
    return acc + (diff > 0 ? diff * d.cantidad : 0);
  }, 0) || 0;
  const hasDiscount = totalDiscount > 0;

  const timelineStatuses = getTimelineStatuses(order.tipoEntrega);

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 backdrop-blur-[3px] z-40 cursor-pointer"
        />
        <motion.div
          key="panel"
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight truncate">
                Pedido #{order.id?.slice(-6).toUpperCase()}
              </h2>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(order.id);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className="text-muted-foreground/40 hover:text-primary transition-colors p-0.5 shrink-0"
                title="Copiar ID del pedido"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3" />
              {order.fechaPedido
                ? format(new Date(order.fechaPedido), "dd MMM yyyy, HH:mm", { locale: es })
                : "-"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Status Badge + Tipo de Entrega Banner */}
          <div className="flex items-center gap-3">
            <span className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border",
              cfg?.bgColor,
              cfg?.borderColor,
              cfg?.color
            )}>
              <StatusIcon className="w-4 h-4" />
              {cfg?.label}
            </span>
            {esRecojo && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <Store className="w-3.5 h-3.5" />
                Recojo en bodega
              </span>
            )}
          </div>

          {/* Delivery Type Banner */}
          <section>
            {esEnvio && (
              <div className="rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-blue-500/5 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-sky-700 dark:text-sky-300">
                      Envío a Domicilio
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.direccionEntrega || "Dirección no especificada"}
                    </p>
                    {order.ciudad && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {order.ciudad}{order.departamento ? `, ${order.departamento}` : ""}
                      </p>
                    )}
                    <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black bg-sky-500/10 text-sky-600 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                      <Truck className="h-3 w-3" />
                      {order.costoEnvio
                        ? `Costo: $${(order.costoEnvio || 0).toLocaleString("es-CO")}`
                        : "Costo de envío aplicado"}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {esRecojo && (
              <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-green-500/5 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Store className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                      Recojo en Bodega
                    </p>
                    {order.bodega && (
                      <>
                        <p className="text-sm font-semibold text-foreground/80 mt-1 flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-emerald-600" />
                          {order.bodega.name}
                        </p>
                        {order.bodega.address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {order.bodega.address}
                          </p>
                        )}
                        {order.bodega.city && (
                          <p className="text-xs text-muted-foreground/70 flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            {order.bodega.city}
                          </p>
                        )}
                      </>
                    )}
                    <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                      <Store className="h-3 w-3" />
                      Sin costo de envío
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!esEnvio && !esRecojo && (
              <div className="rounded-xl border border-border/30 bg-secondary/30 p-4">
                <p className="text-sm font-semibold text-muted-foreground">
                  Tipo de entrega no especificado
                </p>
              </div>
            )}
          </section>

          {/* Customer Info */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </h3>
            <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium">
                {order.usuario?.name || "Usuario"}
              </p>
              {order.usuario?.email && (
                <p className="text-sm text-muted-foreground">{order.usuario.email}</p>
              )}
            </div>
          </section>

          {/* Products List */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos ({order.detalles?.length || 0})
            </h3>
            <div className="divide-y divide-border/40 rounded-xl border border-border/30 overflow-hidden">
              {order.detalles?.map((detalle: any) => (
                <div key={detalle.id} className="flex items-start gap-3 p-3">
                  <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden border border-border/40 flex-shrink-0">
                    {detalle.producto?.images?.[0] ? (
                      <img src={detalle.producto.images[0]} alt={detalle.producto.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-primary font-bold text-xs">
                        {detalle.producto?.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{detalle.producto?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {detalle.cantidad} x ${(detalle.precioUnitario || 0).toLocaleString("es-CO")}
                    </p>
                  </div>
                  <p className="text-sm font-bold shrink-0">
                    ${(detalle.subtotal || 0).toLocaleString("es-CO")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Payment Summary */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              Resumen de Pago
            </h3>
            <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">${(order.subtotal || 0).toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Impuestos</span>
                <span className="font-semibold">${(order.impuestos || 0).toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Envío</span>
                {esRecojo ? (
                  <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                    Sin costo
                  </span>
                ) : (
                  <span className="font-semibold">${(order.costoEnvio || 0).toLocaleString("es-CO")}</span>
                )}
              </div>
              <div className="border-t border-border/40 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                    Total {hasDiscount && <Tag className="h-3.5 w-3.5 text-red-500" />}
                  </span>
                  {hasDiscount ? (
                    <div className="flex flex-col items-end">
                      <span className="text-sm line-through text-muted-foreground/50">${(order.total + totalDiscount).toLocaleString("es-CO")}</span>
                      <span className="text-xl font-black tracking-tight text-red-600">${order.total.toLocaleString("es-CO")}</span>
                    </div>
                  ) : (
                    <span className="text-xl font-black tracking-tight">${(order.total || 0).toLocaleString("es-CO")}</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Notes */}
          {order.notasCliente && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Notas del Cliente
              </h3>
              <div className="bg-secondary/30 rounded-xl p-4">
                <p className="text-sm italic text-muted-foreground">&ldquo;{order.notasCliente}&rdquo;</p>
              </div>
            </section>
          )}

          {/* Progress Timeline */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Progreso del Pedido
              {esEnvio && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-sky-500/10 text-sky-600 border border-sky-500/20 uppercase tracking-wider">
                  <Truck className="h-2.5 w-2.5" />
                  Envío
                </span>
              )}
              {esRecojo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-wider">
                  <Store className="h-2.5 w-2.5" />
                  Recojo
                </span>
              )}
            </h3>
            <div className={cn("relative px-1 transition-opacity duration-200", isUpdatingStatus && "opacity-40 pointer-events-none")}>
              <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border/60" />
              <div className="relative space-y-0">
                {timelineStatuses.map((status, idx) => {
                  const stCfg = statusConfig[status];
                  const StIcon = stCfg?.icon || Package;
                  const currentIdx = timelineStatuses.indexOf(order.estado as PedidoEstado);
                  const isCancelled = order.estado === PedidoEstado.CANCELADO;
                  const isCompleted = idx <= currentIdx && !isCancelled;
                  const isCurrent = idx === currentIdx && !isCancelled;

                  return (
                    <div key={status} className="relative flex items-start gap-4 pb-6 last:pb-0">
                      <div className={cn(
                        "relative z-10 mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                        isCurrent
                          ? "border-primary bg-primary shadow-[0_0_0_4px_rgba(34,197,94,0.15)]"
                          : isCompleted
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-border/40 bg-background"
                      )}>
                        {isCompleted && !isCurrent ? (
                          <Check className="h-[9px] w-[9px] text-white" />
                        ) : isCurrent ? (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        ) : null}
                      </div>
                      <div className={cn(
                        "min-w-0 pt-0",
                        isCurrent ? "font-bold text-foreground" : isCompleted ? "text-muted-foreground/80" : "text-muted-foreground/40"
                      )}>
                        <div className="flex items-center gap-1.5">
                          <StIcon className={cn(
                            "h-3 w-3",
                            isCurrent ? "text-primary" : isCompleted ? "text-emerald-500" : "text-muted-foreground/30"
                          )} />
                          <span className={cn(
                            "text-xs font-semibold",
                            isCurrent && "text-primary"
                          )}>
                            {stCfg?.label}
                          </span>
                          {isCurrent && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {order.estado === PedidoEstado.CANCELADO && (
                  <div className="relative flex items-start gap-4 pb-0">
                    <div className="relative z-10 mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-2 border-rose-500 bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.15)]">
                      <XCircle className="h-[9px] w-[9px] text-white" />
                    </div>
                    <div className="min-w-0 pt-0 font-bold text-rose-500">
                      <div className="flex items-center gap-1.5">
                        <XCircle className="h-3 w-3" />
                        <span className="text-xs font-bold">Cancelado</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Status Update (Premium Arrows) */}
          {(!esEnvioEnProceso && order.estado !== PedidoEstado.CANCELADO) && (
            <section>
              <h3 className="text-sm font-semibold mb-4 text-foreground/90 uppercase tracking-wider flex items-center gap-2">
              {isUpdatingStatus
                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                : <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              }
              {isUpdatingStatus 
                ? (order.tipoEntrega === "ENVIO" && updatingToStatus === PedidoEstado.EN_PREPARACION 
                    ? "Confirmando y Creando Envío…" 
                    : "Confirmando cambio…") 
                : "Progreso del Pedido"}
              </h3>

              <div className="bg-secondary/20 border border-border/40 rounded-xl p-2 relative overflow-hidden group/status">
                {/* Decorative background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover/status:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                
                <div className="flex items-center justify-between gap-2 relative z-10">
                  {/* Retroceder Button */}
                  <button
                    onClick={() => {
                      const prevStatus = getPreviousStatus(order.estado, order.tipoEntrega, isAdmin);
                      if (prevStatus) handleUpdateStatus(prevStatus);
                    }}
                    disabled={isUpdatingStatus || !getPreviousStatus(order.estado, order.tipoEntrega, isAdmin)}
                    className="h-10 w-12 flex items-center justify-center rounded-lg border border-border/50 bg-background hover:bg-secondary/80 hover:text-foreground text-muted-foreground disabled:opacity-40 disabled:hover:bg-background disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex flex-col items-center px-2 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1.5">
                      {isUpdatingStatus ? "ACTUALIZANDO…" : "ESTADO ACTUAL"}
                    </span>
                    <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-full border border-border/50 shadow-sm">
                      {isUpdatingStatus
                        ? <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        : <StatusIcon className={cn("w-4 h-4", cfg?.color)} />
                      }
                      <span className="text-sm font-bold text-foreground">{cfg?.label}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => nextStatusLineal && handleUpdateStatus(nextStatusLineal)}
                    disabled={isUpdatingStatus || !nextStatusLineal}
                    title={nextStatusLineal ? `Avanzar a ${statusConfig[nextStatusLineal]?.label}` : "No se puede avanzar"}
                    className="p-3 rounded-xl bg-primary/10 hover:bg-primary/20 hover:shadow-md border border-primary/20 text-primary transition-all disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-primary/10 disabled:cursor-not-allowed group relative"
                  >
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Cancelar Action */}
                {order.estado !== PedidoEstado.ENTREGADO && (
                   <>
                     {!confirmingStatus ? (
                       <button
                         type="button"
                         onClick={() => setConfirmingStatus(PedidoEstado.CANCELADO)}
                         className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 text-xs font-semibold text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-lg transition-colors"
                       >
                         <XCircle className="w-4 h-4" />
                         Cancelar Pedido
                       </button>
                     ) : (
                       <div className="p-3 mt-3 border border-rose-500/20 bg-rose-500/5 rounded-lg">
                         <div className="flex items-center gap-2 mb-3">
                           <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                           <p className="text-xs font-medium text-rose-700 dark:text-rose-400">
                             ¿Seguro que deseas cancelar este pedido?
                           </p>
                         </div>
                         <div className="flex gap-2">
                           <button
                             type="button"
                             onClick={() => setConfirmingStatus(null)}
                             className="flex-1 rounded-lg border border-border/40 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
                           >
                             Volver
                           </button>
                           <button
                             type="button"
                             onClick={() => handleUpdateStatus(PedidoEstado.CANCELADO)}
                             className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center justify-center gap-1.5"
                           >
                             <Check className="h-3.5 w-3.5" />
                             Confirmar Cancelación
                           </button>
                         </div>
                       </div>
                     )}
                   </>
                )}

                {/* Delete Order Action (Admin Only) */}
                {isAdmin && onDeleteOrder && (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    {!confirmingDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(true)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-red-600 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Eliminar Permanentemente
                      </button>
                    ) : (
                      <div className="flex items-center justify-between p-2.5 border border-red-500/30 bg-red-500/10 rounded-lg">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 pl-2">
                          ¿Confirmar eliminación del pedido?
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setConfirmingDelete(false)}
                            disabled={isDeleting}
                            className="p-2 text-muted-foreground hover:bg-red-500/10 rounded-md transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleDeleteOrder}
                            disabled={isDeleting}
                            className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center justify-center"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Envío tracking info (for ENVIO + EN_PREPARACION / EN_CAMINO) */}
          {esEnvioEnProceso && !!order.envio && (
            <section>
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      Seguimiento de Envío
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este pedido es de tipo env&iacute;o a domicilio. El seguimiento se gestiona desde la secci&oacute;n <strong>Env&iacute;os</strong> del panel de tu tienda.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigateToEnvio) {
                          onNavigateToEnvio(order.id);
                          onClose();
                        }
                      }}
                      className="inline-flex items-center gap-1.5 mt-3 rounded-lg text-xs font-bold h-8 px-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-black transition-all"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Ir a Envíos
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>ID: {order.id?.slice(-6).toUpperCase()}</span>
            <a
              href={`/pedidos/${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              Ver p&aacute;gina completa <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
