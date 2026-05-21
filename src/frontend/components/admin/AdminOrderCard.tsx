"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, User, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PedidoEstado } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminOrder, statusConfig, getNextStatuses } from "./adminOrderUtils";

interface AdminOrderCardProps {
  order: AdminOrder;
  index: number;
  isUpdating: boolean;
  onUpdateStatus: (orderId: string, newStatus: PedidoEstado) => void;
}

export const AdminOrderCard = ({ order, index, isUpdating, onUpdateStatus }: AdminOrderCardProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmingStatus, setConfirmingStatus] = useState<PedidoEstado | null>(null);
  const [showAllItems, setShowAllItems] = useState(false);

  const cfg = statusConfig[order.estado];
  const StatusIcon = cfg.icon;
  const nextStatuses = getNextStatuses(order.estado);

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    setCopiedId(order.id);
    toast.success("ID copiado");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirm = () => {
    if (confirmingStatus) {
      onUpdateStatus(order.id, confirmingStatus);
      // We don't reset confirmingStatus here immediately to allow the button to show loading state
      // The parent will re-render this when status changes, but let's clear it just in case
      setTimeout(() => setConfirmingStatus(null), 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card className={cn(
        "group overflow-hidden rounded-2xl backdrop-blur-md transition-all duration-300 border",
        cfg.cardBorderClass,
        cfg.hoverClasses
      )}>
        <CardContent className="p-0">

          {/* ═══════════════════════════════════════════════ */}
          {/* ══  MOBILE PREMIUM LAYOUT (< lg)            ══ */}
          {/* ═══════════════════════════════════════════════ */}
          <div className="lg:hidden">
            {/* ── Thick gradient accent bar (Mobile premium floating pill) ── */}
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
                    onClick={handleCopyId}
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
                    onClick={() => setShowAllItems(true)}
                    className="text-[11px] text-muted-foreground/70 hover:text-primary font-medium italic mt-2 text-left w-full transition-colors flex items-center gap-1"
                  >
                    + {order.detalles.length - 3} artículo(s) más... <span className="underline decoration-dashed underline-offset-2">Ver todos</span>
                  </button>
                )}
                {showAllItems && (order.detalles?.length || 0) > 3 && (
                  <button
                    onClick={() => setShowAllItems(false)}
                    className="text-[11px] text-muted-foreground/70 hover:text-primary font-medium italic mt-2 text-left w-full transition-colors underline decoration-dashed underline-offset-2"
                  >
                    Ocultar artículos
                  </button>
                )}
              </div>
            </div>

            {/* ── Receipt Dashed Divider with Cutouts (cuts into main card) ── */}
            <div className="relative h-px w-full">
              <div className="absolute inset-0 border-t-2 border-dashed border-border/40" />
              <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-background border border-border/20 shadow-inner" />
              <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background border border-border/20 shadow-inner" />
            </div>

            {/* ── Total Row ── */}
            <div className="px-5 py-5 flex items-end justify-between bg-primary/[0.02]">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 mb-0.5">
                Total a Pagar
              </p>
              <p className="text-2xl font-black tracking-tight text-foreground">
                ${order.total.toLocaleString("es-CO")}
              </p>
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
                      onClick={handleConfirm}
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
                      onClick={() => setConfirmingStatus(null)}
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
                        onClick={() => setConfirmingStatus(ns)}
                      >
                        {statusConfig[ns].label}
                      </button>
                    ))}
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

          {/* ═══════════════════════════════════════════════ */}
          {/* ══  DESKTOP LAYOUT (>= lg)                  ══ */}
          {/* ═══════════════════════════════════════════════ */}
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
                    {format(new Date(order.fechaPedido), "dd MMM yyyy, HH:mm", {
                      locale: es,
                    })}
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
                        onClick={handleConfirm}
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
                      {nextStatuses.map((ns) => {
                        return (
                          <button
                            key={ns}
                            className={cn(
                              "rounded-xl text-xs font-bold h-8 px-3 transition-all duration-200 cursor-pointer inline-flex items-center justify-center",
                              statusConfig[ns].btnClass
                            )}
                            onClick={() => setConfirmingStatus(ns)}
                          >
                            {statusConfig[ns].label}
                          </button>
                        );
                      })}
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

        </CardContent>
      </Card>
    </motion.div>
  );
};
