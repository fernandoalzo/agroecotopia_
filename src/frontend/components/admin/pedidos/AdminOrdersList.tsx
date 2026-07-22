"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { PedidoEstado } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/Loading";
import { SearchInput } from "@/components/shared/SearchInput";
import { OrderDetailPanel } from "./OrderDetailPanel";
import logger from "@/utils/logger";

const log = logger.child("src/frontend/components/admin/AdminOrdersList.tsx");

import { DataTable } from "@/components/ui/data-table";
import { getAdminOrderColumns } from "./AdminOrdersTableColumns";

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
  storeId?: string;
  getOrderDetail?: (pedidoId: string) => Promise<any>;
  updateStoreOrderStatus?: (storeId: string, pedidoId: string, newStatus: PedidoEstado) => Promise<any>;
  onDeleteOrder?: (pedidoId: string) => Promise<any>;
  onNavigateToEnvio?: (pedidoId: string) => void;
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
  storeId = "",
  getOrderDetail,
  updateStoreOrderStatus,
  onDeleteOrder,
  onNavigateToEnvio,
}: AdminOrdersListProps) => {
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [pendingTargetStatus, setPendingTargetStatus] = useState<PedidoEstado | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const isUpdatingMap = updatingStatusId ? { [updatingStatusId]: true } : {};

  // Clear spinner only when the orders data actually reflects the new status
  useEffect(() => {
    if (!updatingStatusId || !pendingTargetStatus) return;
    const order = orders.find((o) => o.id === updatingStatusId);
    if (order && order.estado === pendingTargetStatus) {
      setUpdatingStatusId(null);
      setPendingTargetStatus(null);
    }
  }, [orders, updatingStatusId, pendingTargetStatus]);

  const handleUpdateStatus = useCallback(async (orderId: string, newStatus: PedidoEstado) => {
    setUpdatingStatusId(orderId);
    setPendingTargetStatus(newStatus);
    try {
      const success = await onUpdateStatus(orderId, newStatus);
      if (success && newStatus === PedidoEstado.EN_PREPARACION && onNavigateToEnvio) {
        const order = orders.find((o) => o.id === orderId);
        if (order?.tipoEntrega === "ENVIO") {
          onNavigateToEnvio(orderId);
        }
      }
      if (!success) {
        setUpdatingStatusId(null);
        setPendingTargetStatus(null);
      }
      return success;
    } catch {
      setUpdatingStatusId(null);
      setPendingTargetStatus(null);
      return false;
    }
  }, [onUpdateStatus, onNavigateToEnvio, orders]);

  // Keep a ref so the memoized columns always call the latest handler
  const handleUpdateStatusRef = useRef(handleUpdateStatus);
  handleUpdateStatusRef.current = handleUpdateStatus;

  const columns = useMemo(
    () =>
      getAdminOrderColumns(
        isUpdatingMap,
        (...args: Parameters<typeof handleUpdateStatus>) => handleUpdateStatusRef.current(...args),
        onOpenOrderChat,
        unreadChatCounts,
        openingChatOrderId,
        setSelectedOrderId,
        onNavigateToEnvio
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isUpdatingMap, onOpenOrderChat, unreadChatCounts, openingChatOrderId, onNavigateToEnvio]
  );

  // ── Admin view ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col space-y-4 h-[calc(100vh-180px)]">
      {/* ── Status filter pills + search ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 shrink-0"
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

      {/* ── DataTable Implementation ── */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        pageCount={totalPages}
        currentPage={currentPage}
        pageSize={10}
        onPageChange={onPageChange}
        emptyTitle={emptyMessage || "No se encontraron pedidos en la base de datos"}
        emptyIcon={Filter}
        getRowClassName={(row) => cn(
          "group overflow-hidden backdrop-blur-md transition-all duration-300",
          statusConfig[row.estado].cardBorderClass,
          statusConfig[row.estado].hoverClasses
        )}
        footerLeftContent={
          <>
            <p className="text-xs text-muted-foreground">
              Mostrando pedidos <span className="font-bold text-foreground">{orders.length > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> al{" "}
              <span className="font-bold text-foreground">{Math.min(currentPage * 10, totalCount)}</span> de{" "}
              <span className="font-bold text-foreground">{totalCount}</span> totales
            </p>
            {(statusFilter !== "ALL" || searchQuery.trim() !== "") && (
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
            )}
          </>
        }
      />
      {/* Side Panel */}
      <AnimatePresence>
        {selectedOrderId && getOrderDetail && updateStoreOrderStatus && (
          <OrderDetailPanel
            pedidoId={selectedOrderId}
            storeId={storeId}
            onClose={() => setSelectedOrderId(null)}
            getOrderDetail={getOrderDetail}
            updateStoreOrderStatus={updateStoreOrderStatus}
            onDeleteOrder={onDeleteOrder}
            onNavigateToEnvio={onNavigateToEnvio}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
