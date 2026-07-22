import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Copy, User, Warehouse, Truck, Tag, MessageSquare, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PedidoEstado } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminOrder, statusConfig, getNextStatuses, isEnvioEnProceso } from "./adminOrderUtils";
import { AnimatePresence, motion } from "framer-motion";

interface OrderRowActionsProps {
  order: AdminOrder;
  isUpdating: boolean;
  onUpdateStatus: (orderId: string, newStatus: PedidoEstado) => Promise<boolean>;
  onOpenOrderChat?: (order: AdminOrder) => void;
  unreadChatCount?: number;
  isOpeningChat?: boolean;
  onOpenOrderDetail?: (orderId: string) => void;
  onNavigateToEnvio?: (pedidoId: string) => void;
  navigatingEnvioOrderId?: string | null;
}

const OrderRowActions = ({
  order,
  isUpdating,
  onUpdateStatus,
  onOpenOrderChat,
  unreadChatCount = 0,
  isOpeningChat = false,
  onOpenOrderDetail,
  onNavigateToEnvio,
  navigatingEnvioOrderId,
}: OrderRowActionsProps) => {
  const [confirmingStatus, setConfirmingStatus] = useState<PedidoEstado | null>(null);
  const nextStatuses = getNextStatuses(order.estado, order.tipoEntrega);
  const esEnvioEnProceso = isEnvioEnProceso(order);
  const isNavigatingThisEnvio = navigatingEnvioOrderId === order.id;

  const handleConfirm = async () => {
    if (confirmingStatus) {
      const success = await onUpdateStatus(order.id, confirmingStatus);
      if (!success) {
        toast.error("No se pudo actualizar el estado del pedido");
      }
      setConfirmingStatus(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
      <AnimatePresence mode="wait">
        {isUpdating ? (
          <motion.div
            key="updating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 bg-secondary/60 border border-border/80 rounded-xl px-3 py-1 shadow-sm"
          >
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs font-bold text-muted-foreground">Actualizando…</span>
          </motion.div>
        ) : confirmingStatus ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.95, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 10 }}
            className="flex items-center gap-2 bg-secondary/60 border border-border/80 rounded-xl px-3 py-1 shadow-sm"
          >
            <span className="text-xs font-bold text-muted-foreground">
              ¿Confirmar {statusConfig[confirmingStatus].label}?
            </span>
            <Button
              size="sm"
              className="rounded-lg text-xs font-extrabold h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              disabled={isUpdating}
              onClick={handleConfirm}
            >
              Sí
            </Button>
            <button
              className="rounded-lg text-xs font-bold h-7 px-3 hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUpdating}
              onClick={() => setConfirmingStatus(null)}
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
            className="flex items-center gap-1.5"
          >
            {esEnvioEnProceso && (
              onNavigateToEnvio ? (
                <button
                  type="button"
                  disabled={isNavigatingThisEnvio}
                  onClick={() => onNavigateToEnvio(order.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl text-xs font-bold h-8 px-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-black transition-all cursor-pointer whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isNavigatingThisEnvio ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Redirigiendo...
                    </>
                  ) : (
                    <>
                      <Truck className="w-3.5 h-3.5" />
                      Ir a Envíos
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/mi-tienda?tab=envios"
                  className="inline-flex items-center gap-1.5 rounded-xl text-xs font-bold h-8 px-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-black transition-all whitespace-nowrap"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Ir a Envíos
                </Link>
              )
            )}
            {nextStatuses.map((ns) => (
              <button
                key={ns}
                className={cn(
                  "rounded-xl text-xs font-bold h-8 px-3 transition-all duration-200 cursor-pointer inline-flex items-center justify-center whitespace-nowrap",
                  statusConfig[ns].btnClass
                )}
                onClick={() => setConfirmingStatus(ns)}
              >
                {statusConfig[ns].label}
              </button>
            ))}
            {onOpenOrderChat && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-colors"
                  disabled={isOpeningChat}
                  onClick={() => onOpenOrderChat(order)}
                >
                  {isOpeningChat ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </Button>
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-md shadow-red-500/30 ring-2 ring-background">
                    {unreadChatCount}
                  </span>
                )}
              </div>
            )}
            {onOpenOrderDetail && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-colors"
                onClick={() => onOpenOrderDetail(order.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const getAdminOrderColumns = (
  isUpdatingMap: Record<string, boolean>,
  onUpdateStatus: (orderId: string, newStatus: PedidoEstado) => Promise<boolean>,
  onOpenOrderChat?: (order: AdminOrder) => void,
  unreadChatCounts?: Record<string, number>,
  openingChatOrderId?: string | null,
  onOpenOrderDetail?: (orderId: string) => void,
  onNavigateToEnvio?: (pedidoId: string) => void,
  navigatingEnvioOrderId?: string | null
) => {
  const columnHelper = createColumnHelper<AdminOrder>();

  return [
    columnHelper.accessor("id", {
      header: "Pedido",
      cell: ({ row }) => {
        const order = row.original;
        const cfg = statusConfig[order.estado];
        const StatusIcon = cfg.icon;
        const [copiedId, setCopiedId] = useState<string | null>(null);

        const handleCopyId = (e: React.MouseEvent) => {
          e.stopPropagation();
          navigator.clipboard.writeText(order.id);
          setCopiedId(order.id);
          toast.success("ID copiado");
          setTimeout(() => setCopiedId(null), 2000);
        };

        return (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-[4px] h-10 shrink-0 rounded-full transition-all duration-300",
                cfg.barColor,
                cfg.glowColor
              )}
            />
            <div className="min-w-0 w-40">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight truncate">
                  #{order.id.slice(-6).toUpperCase()}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest pointer-events-none shadow-sm whitespace-nowrap",
                    cfg.color
                  )}
                >
                  <StatusIcon className="mr-1 h-2.5 w-2.5" />
                  {cfg.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[11px] text-muted-foreground font-medium">
                  {order.fechaPedido ? format(new Date(order.fechaPedido), "dd MMM yyyy, HH:mm", { locale: es }) : "-"}
                </p>
                <button
                  onClick={handleCopyId}
                  className="text-muted-foreground/40 hover:text-primary transition-colors flex items-center justify-center p-0.5"
                  title="Copiar ID"
                >
                  {copiedId === order.id ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("usuario", {
      header: "Cliente",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center gap-2 min-w-0 w-40">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
              {order.usuario?.name?.charAt(0)?.toUpperCase() || (
                <User className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {order.usuario?.name || "Usuario"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {order.usuario?.email || ""}
              </p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("tipoEntrega", {
      header: "Tienda / Entrega",
      cell: ({ row }) => {
        const order = row.original;
        const storeName = order.detalles.find((d) => d.store?.name)?.store?.name || "Tienda no disponible";
        return (
          <div className="min-w-0 w-44">
            <p className="text-sm font-semibold truncate">
              {storeName}
            </p>
            {order.tipoEntrega === "RECOJO_EN_BODEGA" && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-md mt-1 uppercase tracking-wider whitespace-nowrap">
                <Warehouse className="h-2.5 w-2.5" />
                Recojo en bodega
              </span>
            )}
            {order.tipoEntrega === "ENVIO" && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 px-1.5 py-0.5 rounded-md mt-1 uppercase tracking-wider whitespace-nowrap">
                <Truck className="h-2.5 w-2.5" />
                Envío a domicilio
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("detalles", {
      header: "Productos",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="min-w-0 max-w-[200px]">
            <p className="text-sm font-medium truncate" title={order.detalles.map(d => d.producto.name).join(", ")}>
              {order.detalles
                ?.slice(0, 2)
                .map((d) => d.producto.name)
                .join(", ")}
              {(order.detalles?.length || 0) > 2 &&
                ` +${order.detalles.length - 2} más`}
            </p>
          </div>
        );
      },
    }),
    columnHelper.accessor("total", {
      header: () => <div className="text-right w-full">Total</div>,
      cell: ({ row }) => {
        const order = row.original;
        const totalDiscount = order.detalles.reduce((acc, d) => {
          const diff = d.producto.price - d.precioUnitario;
          return acc + (diff > 0 ? diff * d.cantidad : 0);
        }, 0);
        const hasDiscount = totalDiscount > 0;

        return (
          <div className="w-full shrink-0 flex flex-col items-end justify-center pr-2">
            {hasDiscount ? (
              <>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] line-through text-muted-foreground/50">${(order.total + totalDiscount).toLocaleString("es-CO")}</span>
                  <Tag className="h-3 w-3 text-red-500" />
                </div>
                <span className="text-sm font-black text-red-600">${order.total.toLocaleString("es-CO")}</span>
              </>
            ) : (
              <p className="text-sm font-bold">
                ${order.total.toLocaleString("es-CO")}
              </p>
            )}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <OrderRowActions
          order={row.original}
          isUpdating={isUpdatingMap[row.original.id] || false}
          onUpdateStatus={onUpdateStatus}
          onOpenOrderChat={onOpenOrderChat}
          unreadChatCount={unreadChatCounts?.[row.original.id]}
          isOpeningChat={openingChatOrderId === row.original.id}
          onOpenOrderDetail={onOpenOrderDetail}
          onNavigateToEnvio={onNavigateToEnvio}
          navigatingEnvioOrderId={navigatingEnvioOrderId}
        />
      ),
    }),
  ];
};
