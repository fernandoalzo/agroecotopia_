"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Eye, Loader2, MessageSquare, User, Tag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PedidoEstado } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminOrder, statusConfig } from "../adminOrderUtils";

interface AdminOrderCardMobileProps {
    order: AdminOrder;
    copiedId: string | null;
    confirmingStatus: PedidoEstado | null;
    showAllItems: boolean;
    isUpdating: boolean;
    nextStatuses: PedidoEstado[];
    onCopyId: () => void;
    onConfirm: () => void;
    onSetConfirmingStatus: (status: PedidoEstado | null) => void;
    onSetShowAllItems: (show: boolean) => void;
    onOpenOrderChat?: () => void;
    unreadChatCount?: number;
    isOpeningChat?: boolean;
}

export const AdminOrderCardMobile = ({
    order,
    copiedId,
    confirmingStatus,
    showAllItems,
    isUpdating,
    nextStatuses,
    onCopyId,
    onConfirm,
    onSetConfirmingStatus,
    onSetShowAllItems,
    onOpenOrderChat,
    unreadChatCount = 0,
    isOpeningChat = false,
}: AdminOrderCardMobileProps) => {
    const cfg = statusConfig[order.estado];
    const StatusIcon = cfg.icon;
    const storeName = order.detalles.find((d) => d.store?.name)?.store?.name || "Tienda no disponible";

    const totalDiscount = order.detalles.reduce((acc, d) => {
        const diff = d.producto.price - d.precioUnitario;
        return acc + (diff > 0 ? diff * d.cantidad : 0);
    }, 0);
    const hasDiscount = totalDiscount > 0;

    return (
        <div className="lg:hidden">
            {/* ── Thick gradient accent bar ── */}
            <div className="px-5 pt-4">
                <div
                    className={cn(
                        "h-1.5 w-full rounded-full transition-all duration-300",
                        cfg.barColor,
                        cfg.glowColor
                    )}
                />
            </div>

            {/* ── Header: Order ID + Status Badge ── */}
            <div className="px-5 pt-3 pb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black tracking-tight">
                            #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <button
                            onClick={onCopyId}
                            className="text-muted-foreground/40 hover:text-primary transition-colors p-1"
                        >
                            {copiedId === order.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" />
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-0.5 font-medium">
                        {format(new Date(order.fechaPedido), "dd MMM yyyy, HH:mm", { locale: es })}
                    </p>
                </div>
                <Badge
                    variant="outline"
                    className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-bold shrink-0 pointer-events-none shadow-sm",
                        cfg.color
                    )}
                >
                    <StatusIcon className="mr-1.5 h-3 w-3" />
                    {cfg.label}
                </Badge>
            </div>

            {/* ── Billed To ── */}
            <div className="px-5 pb-4 pt-1 flex items-center gap-3 border-b border-dashed border-border/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                    {order.usuario?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/50 mb-0.5">
                        Cliente
                    </p>
                    <p className="text-sm font-bold truncate leading-tight text-foreground/90">
                        {order.usuario?.name || "Usuario"}
                    </p>
                    <p className="text-xs text-muted-foreground/80 truncate">
                        {order.usuario?.email || ""}
                    </p>
                </div>
            </div>

            {/* ── Store ── */}
            <div className="px-5 py-3 border-b border-dashed border-border/50">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/50 mb-0.5">
                    Tienda
                </p>
                <p className="text-sm font-semibold text-foreground/85 truncate">
                    {storeName}
                </p>
            </div>

            {/* ── Line Items ── */}
            <div className="px-5 py-4">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/50 mb-3">
                    Concepto
                </p>
                <div className="space-y-3">
                    <AnimatePresence initial={false}>
                        {order.detalles?.slice(0, showAllItems ? undefined : 3).map((d) => (
                            <motion.div
                                key={d.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex justify-between items-start text-sm overflow-hidden"
                            >
                                <div className="flex gap-3 flex-1 min-w-0">
                                    <span className="text-muted-foreground font-bold text-xs mt-0.5">{d.cantidad}x</span>
                                    <span className="font-semibold text-foreground/80 leading-snug">
                                        {d.producto.name}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {!showAllItems && (order.detalles?.length || 0) > 3 && (
                        <button
                            onClick={() => onSetShowAllItems(true)}
                            className="text-[11px] text-muted-foreground/70 hover:text-primary font-medium italic mt-2 text-left w-full transition-colors flex items-center gap-1"
                        >
                            + {order.detalles.length - 3} artículo(s) más...{" "}
                            <span className="underline decoration-dashed underline-offset-2">Ver todos</span>
                        </button>
                    )}
                    {showAllItems && (order.detalles?.length || 0) > 3 && (
                        <button
                            onClick={() => onSetShowAllItems(false)}
                            className="text-[11px] text-muted-foreground/70 hover:text-primary font-medium italic mt-2 text-left w-full transition-colors underline decoration-dashed underline-offset-2"
                        >
                            Ocultar artículos
                        </button>
                    )}
                </div>
            </div>

            {/* ── Receipt Dashed Divider with Cutouts ── */}
            <div className="relative h-px w-full">
                <div className="absolute inset-0 border-t-2 border-dashed border-border/40" />
                <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-background border border-border/20 shadow-inner" />
                <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background border border-border/20 shadow-inner" />
            </div>

            {/* ── Total Row ── */}
            <div className="px-5 py-5 flex items-end justify-between bg-primary/[0.02]">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 mb-0.5 flex items-center gap-1">
                    Total a Pagar {hasDiscount && <Tag className="h-3.5 w-3.5 text-red-500" />}
                </p>
                {hasDiscount ? (
                    <div className="flex flex-col items-end leading-tight">
                        <span className="text-sm line-through text-muted-foreground/50">${(order.total + totalDiscount).toLocaleString("es-CO")}</span>
                        <span className="text-2xl font-black tracking-tight text-red-600">${order.total.toLocaleString("es-CO")}</span>
                    </div>
                ) : (
                    <p className="text-2xl font-black tracking-tight text-foreground">
                        ${order.total.toLocaleString("es-CO")}
                    </p>
                )}
            </div>

            {/* ── Mobile action buttons ── */}
            <div className="px-5 pt-3 pb-4 flex items-center gap-2 flex-wrap">
                <AnimatePresence mode="wait">
                    {confirmingStatus ? (
                        <motion.div
                            key="confirm-m"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-2 bg-secondary/60 border border-border/80 rounded-xl px-3 py-2 shadow-sm w-full justify-center"
                        >
                            <span className="text-xs font-bold text-muted-foreground">
                                ¿Confirmar {statusConfig[confirmingStatus].label}?
                            </span>
                            <Button
                                size="sm"
                                className="rounded-lg text-xs font-extrabold h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
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
                                className="rounded-lg text-xs font-bold h-8 px-4 hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer inline-flex items-center justify-center"
                                disabled={isUpdating}
                                onClick={() => onSetConfirmingStatus(null)}
                            >
                                No
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="actions-m"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex items-center gap-2 w-full"
                        >
                            {nextStatuses.map((ns) => (
                                <button
                                    key={ns}
                                    className={cn(
                                        "rounded-xl text-xs font-bold h-9 px-4 transition-all duration-200 cursor-pointer inline-flex items-center justify-center flex-1",
                                        statusConfig[ns].btnClass
                                    )}
                                    onClick={() => onSetConfirmingStatus(ns)}
                                >
                                    {statusConfig[ns].label}
                                </button>
                            ))}
                            {onOpenOrderChat && (
                                <div className="relative shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary transition-colors border border-border/30"
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
                                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary transition-colors shrink-0 border border-border/30"
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
    );
};
