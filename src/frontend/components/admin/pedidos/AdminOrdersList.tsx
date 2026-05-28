"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { PedidoEstado } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/Loading";
import { SearchInput } from "@/components/shared/SearchInput";
import logger from "@/utils/logger";

const log = logger.child("src/frontend/components/admin/AdminOrdersList.tsx");

import { AdminOrderCard } from "./AdminOrderCard";
import { AdminOrder, statusConfig } from "./adminOrderUtils";

interface AdminOrdersListProps {
  orders: AdminOrder[];
  loading: boolean;
  totalPages: number;
  totalCount: number;
  statusCounts: Record<string, number>;
  emptyMessage?: string;
  onOpenOrderChat?: (order: AdminOrder) => void;
  unreadChatCounts?: Record<string, number>;
  openingChatOrderId?: string | null;
  onUpdateStatus: (orderId: string, newStatus: PedidoEstado) => Promise<boolean>;
  onPageChange: (page: number) => void;
  currentPage: number;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  onStatusFilterChange: (status: PedidoEstado | "ALL") => void;
  statusFilter: PedidoEstado | "ALL";
}

export const AdminOrdersList = ({
  orders,
  loading,
  totalPages,
  totalCount,
  statusCounts,
  emptyMessage,
  onOpenOrderChat,
  unreadChatCounts,
  openingChatOrderId,
  onUpdateStatus,
  onPageChange,
  currentPage,
  onSearchChange,
  searchQuery,
  onStatusFilterChange,
  statusFilter,
}: AdminOrdersListProps) => {
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

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
            onClick={() => onStatusFilterChange("ALL")}
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
            onClick={() => onStatusFilterChange(s)}
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

        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Buscar por ID, nombre, email o dirección..."
          onClear={() => onSearchChange("")}
          containerClassName="max-w-md"
          inputClassName="pr-4"
        />
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
                onUpdateStatus={async (orderId, newStatus) => {
                  setUpdatingStatusId(orderId);
                  try {
                    return await onUpdateStatus(orderId, newStatus);
                  } finally {
                    setUpdatingStatusId(null);
                  }
                }}
                onOpenOrderChat={onOpenOrderChat}
                unreadChatCount={unreadChatCounts?.[order.id] || 0}
                isOpeningChat={openingChatOrderId === order.id}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Summary footer + Pagination controls ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-secondary/20 border border-border/30 px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Mostrando pedidos <span className="font-bold text-foreground">{orders.length > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> al{" "}
          <span className="font-bold text-foreground">{Math.min(currentPage * 10, totalCount)}</span> de{" "}
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
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
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
                    onClick={() => onPageChange(pageNum)}
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
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
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
                onStatusFilterChange("ALL");
                onSearchChange("");
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
