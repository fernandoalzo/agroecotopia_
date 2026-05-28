"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Eye, MessageSquare, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PedidoEstado } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminOrder, statusConfig } from "../adminOrderUtils";

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
}: AdminOrderCardDesktopProps) => {
    const cfg = statusConfig[order.estado];
    const StatusIcon = cfg.icon;

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
                            {format(new Date(order.fechaPedido), "dd MMM yyyy, HH:mm", { locale: es })}
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
                    <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">
                        Total
                    </p>
                    <p className="text-sm font-bold">
                        ${order.total.toLocaleString("es-CO")}
                    </p>
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
                                            onClick={onOpenOrderChat}
                                        >
                                            <MessageSquare className="h-4 w-4" />
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
                                    asChild
                                >
                                    <Link href={`/pedidos/${order.id}`}>
                                        <Eye className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
