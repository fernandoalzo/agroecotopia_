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
import { AdminEnvioCard } from "./AdminEnvioCard";
import { Loading } from "@/components/ui/Loading";
import { Fragment } from "react";
import { PedidoEstado } from "@/types";

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
  updateStoreOrderStatus?: (storeId: string, pedidoId: string, newStatus: PedidoEstado) => Promise<any>;
  getStoreBodegas?: (storeId: string) => Promise<any>;
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
  getStoreBodegas,
  autoOpenPedidoId,
  onAutoOpenConsumed,
}: EnviosListProps) {
  const [selectedEnvio, setSelectedEnvio] = useState<Envio | null>(null);
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);
  const [bodegasList, setBodegasList] = useState<any[]>([]);
  const totalEnvios = Object.values(stats).reduce((a, b) => a + (Number(b) || 0), 0);
  const allStats: Record<string, number> = { ALL: totalEnvios || totalCount, ...stats };

  React.useEffect(() => {
    if (getStoreBodegas && storeId) {
      getStoreBodegas(storeId).then((res) => {
        if (res && res.success) {
          setBodegasList(res.bodegas || []);
        }
      });
    }
  }, [getStoreBodegas, storeId]);

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

  return (
    <>
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4">
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
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por guía, pedido, cliente..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <motion.div
            key="loading-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 flex justify-center"
          >
            <Loading className="scale-75" text="" subtext="" />
          </motion.div>
        ) : envios.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <Filter className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">
              {statusFilter !== "ALL" || searchQuery
                ? "No se encontraron envíos con los filtros aplicados."
                : "No hay envíos registrados. Los envíos se crean automáticamente al confirmar un pedido con envío a domicilio."}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {envios.map((envio, index) => (
              <AdminEnvioCard
                key={envio.id}
                envio={envio}
                index={index}
                onOpenDetail={setSelectedEnvio}
                onOpenOrderDetail={setSelectedPedidoId}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} ({totalCount} envíos)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  currentPage > 1
                    ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, idx, arr) => (
                  <Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="text-muted-foreground">...</span>
                    )}
                    <button
                      onClick={() => onPageChange(p)}
                      className={cn(
                        "w-9 h-9 rounded-xl text-sm font-semibold transition-all",
                        currentPage === p
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                          : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      )}
                    >
                      {p}
                    </button>
                    </Fragment>
                ))}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  currentPage < totalPages
                    ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
          bodegas={bodegasList}
          getEnvioDetail={getEnvioDetail}
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
