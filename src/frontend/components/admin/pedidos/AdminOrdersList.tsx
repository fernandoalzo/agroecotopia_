"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, ChevronLeft, ChevronRight
} from "lucide-react";
import {
  getPaginatedOrdersAction,
  getOrderStatusCountsAction,
  updateOrderStatusAction,
  getStoreOrdersAction,
  getStoreOrderStatusCountsAction,
  updateStoreOrderStatusAction,
} from "@/backend/modules/orders/orders.actions";
import { toast } from "sonner";
import { PedidoEstado } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/Loading";
import logger from "@/utils/logger";

const log = logger.child("src/frontend/components/admin/AdminOrdersList.tsx");

import { AdminOrderCard } from "./AdminOrderCard";
import { AdminOrder, statusConfig } from "./adminOrderUtils";

interface AdminOrdersListProps {
  storeId?: string;
  emptyMessage?: string;
  onOpenOrderChat?: (order: AdminOrder) => void;
}

export const AdminOrdersList = ({ storeId, emptyMessage, onOpenOrderChat }: AdminOrdersListProps) => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
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
      const counts = storeId
        ? await getStoreOrderStatusCountsAction(storeId)
        : await getOrderStatusCountsAction();
      if (counts && typeof counts === "object") {
        const typedCounts = counts as Record<string, number>;
        const total = Object.values(typedCounts).reduce((acc, val) => acc + (Number(val) || 0), 0);
        setStatusCounts({
          ALL: total,
          ...typedCounts
        });
      }
    } catch (error) {
      log.error("Error fetching status counts:", error);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [storeId]);

  // Fetch paginated & filtered orders from database
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: LIMIT,
          estado: statusFilter === "ALL" ? undefined : statusFilter,
          search: debouncedSearch ? debouncedSearch : undefined,
        };
        const result = storeId
          ? await getStoreOrdersAction(storeId, params)
          : await getPaginatedOrdersAction(params);

        if (result && "orders" in result) {
          setOrders(result.orders as AdminOrder[]);
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
  }, [currentPage, statusFilter, debouncedSearch, storeId]);

  const handleUpdateStatus = async (orderId: string, newStatus: PedidoEstado) => {
    setUpdatingStatusId(orderId);
    try {
      const result = storeId
        ? await updateStoreOrderStatusAction(storeId, orderId, newStatus)
        : await updateOrderStatusAction(orderId, newStatus);
      if (result && "error" in result) {
        toast.error("Error", { description: result.error });
        return false;
      } else {
        toast.success("Estado actualizado", {
          description: `Pedido actualizado a ${statusConfig[newStatus].label}`,
        });

        // Update local order status
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, estado: newStatus } : o))
        );
        // Refresh counts from DB
        await fetchCounts();
        return true;
      }
    } catch {
      toast.error("Error", { description: "Hubo un problema al actualizar el estado." });
      return false;
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
                {emptyMessage || "No se encontraron pedidos en la base de datos con los filtros aplicados."}
              </p>
            </motion.div>
          ) : (
            orders.map((order, index) => (
              <AdminOrderCard
                key={order.id}
                order={order}
                index={index}
                isUpdating={updatingStatusId === order.id}
                onUpdateStatus={handleUpdateStatus}
                onOpenOrderChat={onOpenOrderChat}
              />
            ))
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
              {(() => {
                const getVisiblePages = () => {
                  if (totalPages <= 7) {
                    return Array.from({ length: totalPages }, (_, i) => i + 1);
                  }
                  if (currentPage <= 4) {
                    return [1, 2, 3, 4, 5, "...", totalPages];
                  }
                  if (currentPage >= totalPages - 3) {
                    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                  }
                  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
                };

                return getVisiblePages().map((page, index) => {
                  if (page === "...") {
                    return (
                      <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground font-bold">
                        ...
                      </span>
                    );
                  }
                  
                  const pageNum = page as number;
                  return (
                    <Button
                      key={`page-${pageNum}`}
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
                });
              })()}
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
