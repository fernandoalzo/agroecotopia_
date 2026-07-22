"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Eye, Loader2, MessageSquare, User, Tag, Warehouse, Truck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PedidoEstado } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminOrder, statusConfig, isEnvioEnProceso } from "../adminOrderUtils";

interface AdminOrderCardDesktopProps {
    order: AdminOrder;
    copiedId: string | null;
    confirmingStatus: PedidoEstado | null;
    isUpdating: boolean;
    nextStatuses: PedidoEstado[];
    onCopyId: () => void;
    onConfirm: () => void;
    onSetConfirmingStatus: (status: PedidoEstado | null) => void;
    onOpenOrderChat?: () => void;
    unreadChatCount?: number;
    isOpeningChat?: boolean;
    onOpenOrderDetail?: () => void;
    onNavigateToEnvio?: (pedidoId: string) => void;
    navigatingEnvioOrderId?: string | null;
}

export const AdminOrderCardDesktop = ({
    order,
    copiedId,
    confirmingStatus,
    isUpdating,
    nextStatuses,
    onCopyId,
    onConfirm,
    onSetConfirmingStatus,
    onOpenOrderChat,
    unreadChatCount = 0,
    isOpeningChat = false,
    onOpenOrderDetail,
    onNavigateToEnvio,
    navigatingEnvioOrderId,
}: AdminOrderCardDesktopProps) => {
    const cfg = statusConfig[order.estado];
    const StatusIcon = cfg.icon;
    const storeName = order.detalles.find((d) => d.store?.name)?.store?.name || "Tienda no disponible";
    const isNavigatingThisEnvio = navigatingEnvioOrderId === order.id;

    const totalDiscount = order.detalles.reduce((acc, d) => {
        const diff = d.producto.price - d.precioUnitario;
        return acc + (diff > 0 ? diff * d.cantidad : 0);
    }, 0);
    const hasDiscount = totalDiscount > 0;

    return (
        <div className="hidden lg:flex items-stretch">
            {/* Status color bar (Left side premium floating pill indicator) */}
            <div
                className={cn(
                    "w-[4px] h-auto my-4 shrink-0 rounded-full ml-3 transition-all duration-300",
                    cfg.barColor,
                    cfg.glowColor
                )}
            />

            <div className="flex-1 p-3 xl:p-5 flex items-center gap-2 xl:gap-4 min-w-0">
                {/* Order ID + Status */}
                <div className="min-w-0 w-44 xl:w-56 shrink">
                    <div className="flex items-center gap-2">
                        <span className="text-base font-black tracking-tight truncate">
                            #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <Badge
                            variant="outline"
                            className={cn(
                                "rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest pointer-events-none shadow-sm",
                                cfg.color
                            )}
                        >
                            <StatusIcon className="mr-1 h-2.5 w-2.5" />
                            {cfg.label}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground font-medium">
                            {order.fechaPedido ? format(new Date(order.fechaPedido), "dd MMM yyyy, HH:mm", { locale: es }) : "-"}
                        </p>
                        <button
                            onClick={onCopyId}
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

                {/* User info */}
                <div className="min-w-0 w-36 xl:w-48 shrink">
                    <div className="flex items-center gap-2">
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
                </div>

                {/* Store info + Delivery type */}
                <div className="min-w-0 w-40 xl:w-52 shrink">
                    <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-1">
                        Tienda
                    </p>
                    <p className="text-sm font-semibold truncate">
                        {storeName}
                    </p>
                    {order.tipoEntrega === "RECOJO_EN_BODEGA" && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-md mt-1 uppercase tracking-wider">
                            <Warehouse className="h-2.5 w-2.5" />
                            Recojo en bodega
                        </span>
                    )}
                    {order.tipoEntrega === "ENVIO" && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 px-1.5 py-0.5 rounded-md mt-1 uppercase tracking-wider">
                            <Truck className="h-2.5 w-2.5" />
                            Envío a domicilio
                        </span>
                    )}
                </div>

                {/* Products summary */}
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-1">
                        Productos
                    </p>
                    <p className="text-sm font-medium truncate">
                        {order.detalles
                            ?.slice(0, 2)
                            .map((d) => d.producto.name)
                            .join(", ")}
                        {(order.detalles?.length || 0) > 2 &&
                            ` +${order.detalles.length - 2} más`}
                    </p>
                </div>

                {/* Total */}
                <div className="w-24 xl:w-28 shrink-0 text-right">
                    <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5 flex items-center justify-end gap-1">
                        Total {hasDiscount && <Tag className="h-3 w-3 text-red-500" />}
                    </p>
                    {hasDiscount ? (
                        <div className="flex flex-col items-end leading-tight">
                            <span className="text-[10px] line-through text-muted-foreground/50">${(order.total + totalDiscount).toLocaleString("es-CO")}</span>
                            <span className="text-sm font-black text-red-600">${order.total.toLocaleString("es-CO")}</span>
                        </div>
                    ) : (
                        <p className="text-sm font-bold">
                            ${order.total.toLocaleString("es-CO")}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <AnimatePresence mode="wait">
                        {confirmingStatus ? (
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
                                    onClick={onConfirm}
                                >
                                    {isUpdating ? (
                                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        "Sí"
                                    )}
                                </Button>
                                <button
                                    className="rounded-lg text-xs font-bold h-7 px-3 hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isUpdating}
                                    onClick={() => onSetConfirmingStatus(null)}
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
                                {isEnvioEnProceso(order) && (
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
                                            "rounded-xl text-xs font-bold h-8 px-3 transition-all duration-200 cursor-pointer inline-flex items-center justify-center",
                                            statusConfig[ns].btnClass
                                        )}
                                        onClick={() => onSetConfirmingStatus(ns)}
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
                                            onClick={onOpenOrderChat}
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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-colors"
                                    onClick={onOpenOrderDetail}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
