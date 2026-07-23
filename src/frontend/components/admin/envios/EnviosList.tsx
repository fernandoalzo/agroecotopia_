"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { envioStatusConfig, type EnvioEstadoKey } from "./envioUtils";
import { EnvioDetailPanel } from "./EnvioDetailPanel";
import { OrderDetailPanel } from "@/components/admin/pedidos/OrderDetailPanel";

import { Loading } from "@/components/ui/Loading";
import { Fragment, useMemo } from "react";
import { PedidoEstado } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { getAdminEnvioColumns } from "./AdminEnviosTableColumns";
import { SearchInput } from "@/components/shared/SearchInput";

type Envio = any;

interface EnviosListProps {
  storeId: string;
  envios: Envio[];
  loading: boolean;
  totalPages: number;
  totalCount: number;
  stats: Record<string, number>;
  currentPage: number;
  statusFilter: string;
  searchQuery: string;
  onPageChange: (page: number) => void;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onUpdateStatus: (envioId: string, nuevoEstado: EnvioEstadoKey, extra?: any) => Promise<boolean>;
  onRefresh: () => void;
  getOrderDetail?: (pedidoId: string) => Promise<any>;
  getEnvioDetail?: (envioId: string) => Promise<any>;
  updateStoreOrderStatus?: (storeId: string, pedidoId: string, newStatus: PedidoEstado, motivoCancelacion?: string) => Promise<any>;
  bodegas?: any[];
  autoOpenPedidoId?: string | null;
  onAutoOpenConsumed?: () => void;
}

export function EnviosList({
  storeId,
  envios,
  loading,
  totalPages,
  totalCount,
  stats,
  currentPage,
  statusFilter,
  searchQuery,
  onPageChange,
  onSearchChange,
  onStatusFilterChange,
  onUpdateStatus,
  onRefresh,
  getOrderDetail,
  getEnvioDetail,
  updateStoreOrderStatus,
  bodegas = [],
  autoOpenPedidoId,
  onAutoOpenConsumed,
}: EnviosListProps) {
  const [selectedEnvio, setSelectedEnvio] = useState<Envio | null>(null);
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);
  const totalEnvios = Object.values(stats).reduce((a, b) => a + (Number(b) || 0), 0);
  const allStats: Record<string, number> = { ALL: totalEnvios || totalCount, ...stats };

  React.useEffect(() => {
    if (autoOpenPedidoId && envios.length > 0) {
      const targetEnvio = envios.find((e: any) => e.pedidoId === autoOpenPedidoId);
      if (targetEnvio) {
        setSelectedEnvio(targetEnvio);
        onAutoOpenConsumed?.();
      }
    }
  }, [autoOpenPedidoId, envios, onAutoOpenConsumed]);

  React.useEffect(() => {
    if (selectedEnvio && envios.length > 0) {
      const updatedEnvio = envios.find((e: any) => e.id === selectedEnvio.id);
      if (updatedEnvio && JSON.stringify(updatedEnvio) !== JSON.stringify(selectedEnvio)) {
        setSelectedEnvio(updatedEnvio);
      }
    }
  }, [envios]);

  const handleStatusUpdate = async (envioId: string, nuevoEstado: EnvioEstadoKey, extra?: any) => {
    const result = await onUpdateStatus(envioId, nuevoEstado, extra);
    if (result) {
      onRefresh();
    }
    return result;
  };

  const columns = useMemo(
    () => getAdminEnvioColumns(setSelectedEnvio, setSelectedPedidoId),
    []
  );

  return (
    <>
      <div className="flex flex-col space-y-4 flex-1 min-h-0">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 shrink-0"
        >
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(allStats).map(([status, count]) => {
              const isActive = statusFilter === status;
              const isAll = status === "ALL";
              const cfg = !isAll ? envioStatusConfig[status as EnvioEstadoKey] : null;
              const Icon = cfg?.icon || Clock;
              return (
                <button
                  key={status}
                  onClick={() => onStatusFilterChange(status)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border",
                    isActive
                      ? cfg
                        ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor} shadow-sm`
                        : "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-muted-foreground border-border/50 hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {!isAll && <Icon className="w-3.5 h-3.5" />}
                  <span>{isAll ? "Todos" : (cfg?.labelEs || status)}</span>
                  <span className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold",
                    isActive
                      ? isAll ? "bg-primary-foreground/15 text-primary-foreground" : "bg-black/10 dark:bg-white/10"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {Number(count) || 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Buscar por guía, pedido, cliente..."
            onClear={() => onSearchChange("")}
            containerClassName="max-w-md"
            inputClassName="pr-4"
          />
        </motion.div>

        <DataTable
          columns={columns}
          data={envios}
          loading={loading}
          pageCount={totalPages}
          currentPage={currentPage}
          pageSize={10}
          totalEntries={totalCount}
          onPageChange={onPageChange}
          emptyTitle={
            statusFilter !== "ALL" || searchQuery
              ? "No se encontraron envíos con los filtros aplicados."
              : "No hay envíos registrados."
          }
          emptyDescription="Los envíos se crean automáticamente al confirmar un pedido con envío a domicilio."
          getRowClassName={(row) => {
            const cfg = envioStatusConfig[row.estado as EnvioEstadoKey];
            return cn(
              "bg-card/40 backdrop-blur-sm",
              cfg?.hoverClasses,
              cfg?.cardBorderClass
            );
          }}
          footerLeftContent={
            <>
              <p className="text-xs text-muted-foreground">
                Mostrando envíos <span className="font-bold text-foreground">{envios.length > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> al{" "}
                <span className="font-bold text-foreground">{Math.min(currentPage * 10, totalCount)}</span> de{" "}
                <span className="font-bold text-foreground">{totalCount}</span> totales
              </p>
              {(statusFilter !== "ALL" || searchQuery.trim() !== "") && (
                <button
                  className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
                    onStatusFilterChange("ALL");
                    onSearchChange("");
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </>
          }
        />
      </div>

      {/* Detail Panels */}
      {selectedEnvio && (
        <EnvioDetailPanel
          envio={selectedEnvio}
          onClose={() => {
            setSelectedEnvio(null);
            setSelectedPedidoId(null);
          }}
          onUpdateStatus={handleStatusUpdate}
          bodegas={bodegas}
          getEnvioDetail={getEnvioDetail}
          onOpenOrderDetail={(id) => setSelectedPedidoId(id)}
        />
      )}
      {selectedPedidoId && getOrderDetail && updateStoreOrderStatus && (
        <OrderDetailPanel
          pedidoId={selectedPedidoId}
          storeId={storeId}
          onClose={() => setSelectedPedidoId(null)}
          getOrderDetail={getOrderDetail}
          updateStoreOrderStatus={updateStoreOrderStatus}
        />
      )}
    </>
  );
}
