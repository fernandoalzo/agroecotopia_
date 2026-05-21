"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Clock, CheckCircle2, Truck, Timer, XCircle,
  Copy, Check, User, Search, Filter, Eye, ChevronLeft, ChevronRight
} from "lucide-react";
import {
  getPaginatedOrdersAction,
  getOrderStatusCountsAction,
  updateOrderStatusAction,
} from "@/backend/modules/orders/orders.actions";
import { toast } from "sonner";
import { PedidoEstado } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/Loading";
import Link from "next/link";
import logger from "@/utils/logger";

const log = logger.child("src/frontend/components/admin/AdminOrdersList.tsx");

interface AdminOrder {
  id: string;
  estado: PedidoEstado;
  fechaPedido: Date;
  total: number;
  direccionEntrega: string;
  usuario?: {
    id: string;
    name: string | null;
    email: string | null;
  };
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
    barColor: "bg-gradient-to-b from-amber-400 to-amber-600",
    glowColor: "shadow-[2px_0_12px_rgba(245,158,11,0.3)] lg:shadow-[2px_0_15px_rgba(245,158,11,0.25)]",
    cardBorderClass: "border-amber-500/20 bg-amber-500/[0.01]",
    hoverClasses: "hover:border-amber-500/40 hover:shadow-[0_10px_35px_-5px_rgba(245,158,11,0.15)] hover:bg-amber-500/[0.03]",
    btnClass: "bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-black hover:border-amber-500/50 hover:shadow-[0_4px_12px_rgba(245,158,11,0.2)]",
    icon: Clock,
  },
  [PedidoEstado.CONFIRMADO]: {
    label: "Confirmado",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    barColor: "bg-gradient-to-b from-blue-400 to-blue-600",
    glowColor: "shadow-[2px_0_12px_rgba(59,130,246,0.3)] lg:shadow-[2px_0_15px_rgba(59,130,246,0.25)]",
    cardBorderClass: "border-blue-500/20 bg-blue-500/[0.01]",
    hoverClasses: "hover:border-blue-500/40 hover:shadow-[0_10px_35px_-5px_rgba(59,130,246,0.15)] hover:bg-blue-500/[0.03]",
    btnClass: "bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-black hover:border-blue-500/50 hover:shadow-[0_4px_12px_rgba(59,130,246,0.2)]",
    icon: CheckCircle2,
  },
  [PedidoEstado.EN_PREPARACION]: {
    label: "En Preparación",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    barColor: "bg-gradient-to-b from-indigo-400 to-indigo-600",
    glowColor: "shadow-[2px_0_12px_rgba(99,102,241,0.3)] lg:shadow-[2px_0_15px_rgba(99,102,241,0.25)]",
    cardBorderClass: "border-indigo-500/20 bg-indigo-500/[0.01]",
    hoverClasses: "hover:border-indigo-500/40 hover:shadow-[0_10px_35px_-5px_rgba(99,102,241,0.15)] hover:bg-indigo-500/[0.03]",
    btnClass: "bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-black hover:border-indigo-500/50 hover:shadow-[0_4px_12px_rgba(99,102,241,0.2)]",
    icon: Timer,
  },
  [PedidoEstado.EN_CAMINO]: {
    label: "En Camino",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    barColor: "bg-gradient-to-b from-purple-400 to-purple-600",
    glowColor: "shadow-[2px_0_12px_rgba(168,85,247,0.3)] lg:shadow-[2px_0_15px_rgba(168,85,247,0.25)]",
    cardBorderClass: "border-purple-500/20 bg-purple-500/[0.01]",
    hoverClasses: "hover:border-purple-500/40 hover:shadow-[0_10px_35px_-5px_rgba(168,85,247,0.15)] hover:bg-purple-500/[0.03]",
    btnClass: "bg-purple-500/10 dark:bg-purple-500/5 border border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white dark:hover:bg-purple-500 dark:hover:text-black hover:border-purple-500/50 hover:shadow-[0_4px_12px_rgba(168,85,247,0.2)]",
    icon: Truck,
  },
  [PedidoEstado.ENTREGADO]: {
    label: "Entregado",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    barColor: "bg-gradient-to-b from-emerald-400 to-emerald-600",
    glowColor: "shadow-[2px_0_12px_rgba(16,185,129,0.3)] lg:shadow-[2px_0_15px_rgba(16,185,129,0.25)]",
    cardBorderClass: "border-emerald-500/20 bg-emerald-500/[0.01]",
    hoverClasses: "hover:border-emerald-500/40 hover:shadow-[0_10px_35px_-5px_rgba(16,185,129,0.15)] hover:bg-emerald-500/[0.03]",
    btnClass: "bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-black hover:border-emerald-500/50 hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)]",
    icon: Package,
  },
  [PedidoEstado.CANCELADO]: {
    label: "Cancelado",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    barColor: "bg-gradient-to-b from-rose-400 to-rose-600",
    glowColor: "shadow-[2px_0_12px_rgba(244,63,94,0.3)] lg:shadow-[2px_0_15px_rgba(244,63,94,0.25)]",
    cardBorderClass: "border-rose-500/20 bg-rose-500/[0.01]",
    hoverClasses: "hover:border-rose-500/40 hover:shadow-[0_10px_35px_-5px_rgba(244,63,94,0.15)] hover:bg-rose-500/[0.03]",
    btnClass: "bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white hover:border-rose-500/50 hover:shadow-[0_4px_12px_rgba(244,63,94,0.2)]",
    icon: XCircle,
  },
};

const getNextStatuses = (current: PedidoEstado): PedidoEstado[] => {
  switch (current) {
    case PedidoEstado.PENDIENTE:
      return [PedidoEstado.CONFIRMADO, PedidoEstado.CANCELADO];
    case PedidoEstado.CONFIRMADO:
      return [PedidoEstado.EN_PREPARACION, PedidoEstado.CANCELADO];
    case PedidoEstado.EN_PREPARACION:
      return [PedidoEstado.EN_CAMINO, PedidoEstado.CANCELADO];
    case PedidoEstado.EN_CAMINO:
      return [PedidoEstado.ENTREGADO, PedidoEstado.CANCELADO];
    default:
      return [];
  }
};

export const AdminOrdersList = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PedidoEstado | "ALL">("ALL");
  
  // Search state and debounce
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 10;

  // Status counts from DB
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({ ALL: 0 });
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [confirmingStatus, setConfirmingStatus] = useState<Record<string, PedidoEstado | null>>({});

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedSearch]);

  // Fetch status counts from database
  const fetchCounts = async () => {
    try {
      const counts = await getOrderStatusCountsAction();
      if (counts && typeof counts === "object") {
        const total = Object.values(counts).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
        setStatusCounts({
          ALL: total,
          ...counts
        } as any);
      }
    } catch (error) {
      log.error("Error fetching status counts:", error);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  // Fetch paginated & filtered orders from database
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const result = await getPaginatedOrdersAction({
          page: currentPage,
          limit: LIMIT,
          estado: statusFilter === "ALL" ? undefined : statusFilter,
          search: debouncedSearch ? debouncedSearch : undefined,
        });

        if (result && "orders" in result) {
          setOrders(result.orders as any);
          setTotalPages(result.totalPages);
          setTotalCount(result.totalCount);
        }
      } catch (error) {
        log.error("Error fetching paginated orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage, statusFilter, debouncedSearch]);

  const handleUpdateStatus = async (orderId: string, newStatus: PedidoEstado) => {
    setUpdatingStatusId(orderId);
    try {
      const result = await updateOrderStatusAction(orderId, newStatus);
      if (result && "error" in result) {
        toast.error("Error", { description: result.error });
      } else {
        toast.success("Estado actualizado", {
          description: `Pedido actualizado a ${statusConfig[newStatus].label}`,
        });
        
        // Update local order status
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, estado: newStatus } : o))
        );
        // Clear confirming status
        setConfirmingStatus((prev) => ({ ...prev, [orderId]: null }));
        // Refresh counts from DB
        fetchCounts();
      }
    } catch (error) {
      toast.error("Error", { description: "Hubo un problema al actualizar el estado." });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ── Admin view ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Status filter pills + search ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all",
              statusFilter === "ALL"
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-secondary/30 text-muted-foreground border-border/50 hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            Todos ({statusCounts.ALL || 0})
          </button>
          {Object.values(PedidoEstado).map((s) => {
            const cfg = statusConfig[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold border transition-all flex items-center gap-1.5",
                  statusFilter === s
                    ? cn(cfg.color, "shadow-md")
                    : "bg-secondary/30 text-muted-foreground border-border/50 hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {cfg.label} ({statusCounts[s] || 0})
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Buscar por ID, nombre, email o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm pl-11 pr-4 py-3 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>
      </motion.div>

      {/* ── Compact order rows ── */}
      <div className="space-y-3 relative">
        {loading && orders.length > 0 && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
            <Loading text="" subtext="" className="py-0 scale-75" />
          </div>
        )}
        
        <AnimatePresence mode="popLayout">
          {loading && orders.length === 0 ? (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex justify-center"
            >
              <Loading className="scale-75" text="" subtext="" />
            </motion.div>
          ) : orders.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <Filter className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">
                No se encontraron pedidos en la base de datos con los filtros aplicados.
              </p>
            </motion.div>
          ) : (
            orders.map((order, index) => {
              const cfg = statusConfig[order.estado];
              const StatusIcon = cfg.icon;
              const nextStatuses = getNextStatuses(order.estado);

              return (
                <motion.div
                  key={order.id}
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
                        {/* ── Thick gradient accent bar ── */}
                        <div className={cn("h-1.5 w-full", cfg.barColor)} />

                        {/* ── Header: Order ID + Status Badge ── */}
                        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black tracking-tight">
                                #{order.id.slice(-6).toUpperCase()}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(order.id);
                                  setCopiedId(order.id);
                                  toast.success("ID copiado");
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
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

                        {/* ── User section ── */}
                        <div className="mx-5 flex items-center gap-3 rounded-xl bg-secondary/30 border border-border/20 p-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0 ring-2 ring-primary/10">
                            {order.usuario?.name?.charAt(0)?.toUpperCase() || (
                              <User className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate leading-tight">
                              {order.usuario?.name || "Usuario"}
                            </p>
                            <p className="text-xs text-muted-foreground/60 truncate">
                              {order.usuario?.email || ""}
                            </p>
                          </div>
                        </div>

                        {/* ── Products + Total nested glass card ── */}
                        <div className="mx-5 mt-3 rounded-xl bg-gradient-to-br from-secondary/40 to-secondary/15 border border-border/20 overflow-hidden">
                          <div className="px-4 py-3">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
                              Productos
                            </p>
                            <p className="text-sm font-semibold leading-snug">
                              {order.detalles
                                ?.slice(0, 2)
                                .map((d) => d.producto.name)
                                .join(", ")}
                              {(order.detalles?.length || 0) > 2 &&
                                ` +${order.detalles.length - 2} más`}
                            </p>
                          </div>
                          <div className="h-px bg-border/30 mx-4" />
                          <div className="px-4 py-3 flex items-center justify-between">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground/50">
                              Total
                            </p>
                            <p className="text-lg font-black tracking-tight">
                              ${order.total.toLocaleString("es-CO")}
                            </p>
                          </div>
                        </div>

                        {/* ── Mobile action buttons ── */}
                        <div className="px-5 pt-3 pb-4 flex items-center gap-2 flex-wrap">
                          <AnimatePresence mode="wait">
                            {confirmingStatus[order.id] ? (
                              <motion.div
                                key="confirm-m"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-2 bg-secondary/60 border border-border/80 rounded-xl px-3 py-2 shadow-sm w-full justify-center"
                              >
                                <span className="text-xs font-bold text-muted-foreground">
                                  ¿Confirmar {statusConfig[confirmingStatus[order.id]!].label}?
                                </span>
                                <Button
                                  size="sm"
                                  className="rounded-lg text-xs font-extrabold h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                                  disabled={updatingStatusId === order.id}
                                  onClick={() => handleUpdateStatus(order.id, confirmingStatus[order.id]!)}
                                >
                                  {updatingStatusId === order.id ? (
                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  ) : (
                                    "Sí"
                                  )}
                                </Button>
                                <button
                                  className="rounded-lg text-xs font-bold h-8 px-4 hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer inline-flex items-center justify-center"
                                  disabled={updatingStatusId === order.id}
                                  onClick={() => setConfirmingStatus((prev) => ({ ...prev, [order.id]: null }))}
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
                                    onClick={() =>
                                      setConfirmingStatus((prev) => ({ ...prev, [order.id]: ns }))
                                    }
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

                        <div className="flex-1 p-5 flex items-center gap-4">
                          {/* Order ID + date */}
                          <div className="min-w-0 w-44 shrink-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold tracking-tight truncate">
                                #{order.id.slice(-6).toUpperCase()}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(order.id);
                                  setCopiedId(order.id);
                                  toast.success("ID copiado");
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="text-muted-foreground/40 hover:text-primary transition-colors"
                              >
                                {copiedId === order.id ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(order.fechaPedido), "dd MMM yyyy, HH:mm", {
                                locale: es,
                              })}
                            </p>
                          </div>

                          {/* User info */}
                          <div className="min-w-0 w-48 shrink-0">
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
                          <div className="w-28 shrink-0 text-right">
                            <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">
                              Total
                            </p>
                            <p className="text-sm font-bold">
                              ${order.total.toLocaleString("es-CO")}
                            </p>
                          </div>

                          {/* Status badge */}
                          <div className="w-36 shrink-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs font-bold pointer-events-none",
                                cfg.color
                              )}
                            >
                              <StatusIcon className="mr-1.5 h-3 w-3" />
                              {cfg.label}
                            </Badge>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <AnimatePresence mode="wait">
                              {confirmingStatus[order.id] ? (
                                <motion.div
                                  key="confirm"
                                  initial={{ opacity: 0, scale: 0.95, x: 10 }}
                                  animate={{ opacity: 1, scale: 1, x: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, x: 10 }}
                                  className="flex items-center gap-2 bg-secondary/60 border border-border/80 rounded-xl px-3 py-1 shadow-sm"
                                >
                                  <span className="text-xs font-bold text-muted-foreground">
                                    ¿Confirmar {statusConfig[confirmingStatus[order.id]!].label}?
                                  </span>
                                  <Button
                                    size="sm"
                                    className="rounded-lg text-xs font-extrabold h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                                    disabled={updatingStatusId === order.id}
                                    onClick={() => handleUpdateStatus(order.id, confirmingStatus[order.id]!)}
                                  >
                                    {updatingStatusId === order.id ? (
                                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                      "Sí"
                                    )}
                                  </Button>
                                  <button
                                    className="rounded-lg text-xs font-bold h-7 px-3 hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={updatingStatusId === order.id}
                                    onClick={() => setConfirmingStatus((prev) => ({ ...prev, [order.id]: null }))}
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
                                        onClick={() =>
                                          setConfirmingStatus((prev) => ({ ...prev, [order.id]: ns }))
                                        }
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
            })
          )}
        </AnimatePresence>
      </div>

      {/* ── Summary footer + Pagination controls ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-secondary/20 border border-border/30 px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Mostrando pedidos <span className="font-bold text-foreground">{orders.length > 0 ? (currentPage - 1) * LIMIT + 1 : 0}</span> al{" "}
          <span className="font-bold text-foreground">{Math.min(currentPage * LIMIT, totalCount)}</span> de{" "}
          <span className="font-bold text-foreground">{totalCount}</span> totales
        </p>

        {/* Pagination buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-border/50 hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-50"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 px-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Render a smart window of page numbers if there are too many (simple slice here since totalPages is usually small)
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-9 w-9 rounded-xl font-bold transition-all",
                      currentPage === pageNum
                        ? "shadow-md shadow-primary/20"
                        : "border-border/50 hover:bg-primary/5 hover:text-primary"
                    )}
                    disabled={loading}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-border/50 hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-50"
              disabled={currentPage === totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {statusFilter !== "ALL" || searchQuery.trim() !== "" ? (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-xs font-bold text-muted-foreground hover:text-primary"
            onClick={() => {
              setStatusFilter("ALL");
              setSearchQuery("");
            }}
          >
            Limpiar filtros
          </Button>
        ) : (
          <div className="w-20 hidden sm:block" />
        )}
      </div>
    </div>
  );
};
