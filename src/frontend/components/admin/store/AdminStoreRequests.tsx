"use client";

import React, { useEffect, useState, useCallback } from "react";
import { StoreRequest } from "@/types/store";
import { Loading } from "@/components/ui/Loading";
import { Store, Eye, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StoreRequestDetailModal } from "./StoreRequestDetailModal";

interface AdminStoreRequestsProps {
  onLoadRequests: (page: number) => Promise<any>;
  onApproveRequest: (id: string) => Promise<any>;
  onRejectRequest: (id: string, note: string) => Promise<any>;
}

export function AdminStoreRequests({
  onLoadRequests,
  onApproveRequest,
  onRejectRequest
}: AdminStoreRequestsProps) {
  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedRequest, setSelectedRequest] = useState<StoreRequest | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await onLoadRequests(p);
      if (res && "requests" in res) {
        setRequests(res.requests as unknown as StoreRequest[]);
        setTotalPages((res as any).totalPages || 1);
        setPage((res as any).page || 1);
      }
    } catch (err) {
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests(1);
  }, [loadRequests]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await onApproveRequest(id);
      if (res && "error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Tienda aprobada y creada con éxito");
        setSelectedRequest(null);
        loadRequests(page);
      }
    } catch (err) {
      toast.error("Error al aprobar");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, note: string) => {
    if (!note) {
      toast.error("Debes incluir un motivo para el rechazo");
      return;
    }
    setProcessingId(id);
    try {
      const res = await onRejectRequest(id, note);
      if (res && "error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Solicitud rechazada");
        setSelectedRequest(null);
        loadRequests(page);
      }
    } catch (err) {
      toast.error("Error al rechazar");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && requests.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-border/40">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-display font-medium text-foreground tracking-tight">
              Solicitudes de Tienda
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Revisa el historial de solicitudes de nuevos vendedores y aprueba las pendientes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Total registradas:</span>
            <span className="text-xl font-black text-foreground">{requests.length}</span>
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-card border border-border/40 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-bold">Todo al día</h3>
          <p className="text-muted-foreground">No hay solicitudes de tienda registradas.</p>
        </div>
      ) : (
        <div className="space-y-3 relative">
          <AnimatePresence mode="popLayout">
            {requests.map((req, index) => {
              const isPending = req.status === 'PENDING';
              const statusColors = 
                req.status === 'PENDING' ? "text-yellow-600 bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_8px_rgba(234,179,8,0.5)] bg-yellow-500" :
                req.status === 'APPROVED' ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.5)] bg-emerald-500" :
                "text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.5)] bg-red-500";
              
              const statusLabel = req.status === 'PENDING' ? 'Pendiente' : req.status === 'APPROVED' ? 'Aprobada' : 'Rechazada';
              
              return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <div 
                  className="group overflow-hidden rounded-2xl backdrop-blur-md transition-all duration-300 border bg-card/60 hover:bg-card hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 cursor-pointer"
                  onClick={() => setSelectedRequest(req as any)}
                >
                  <div className="flex flex-col p-0 pointer-events-none">
                    <div className="flex flex-col lg:flex-row lg:items-stretch">
                      
                      {/* --- MOBILE VIEW --- */}
                      <div className="flex-1 p-4 lg:hidden">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black tracking-tight">#{req.id.slice(-6).toUpperCase()}</span>
                            <span className={cn("rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-sm", statusColors.split(' shadow')[0])}>
                              {statusLabel}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 border border-border/50 overflow-hidden text-primary">
                            <Store className="w-6 h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-base truncate">{req.name}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="truncate">{req.user?.name || "Desconocido"}</span> • <span>{format(new Date(req.createdAt), "dd MMM, yy", { locale: es })}</span>
                            </p>
                          </div>
                        </div>

                      </div>

                      {/* --- DESKTOP VIEW --- */}
                      <div className="hidden lg:flex flex-1 items-stretch">
                        <div className={cn("w-[4px] h-auto my-4 shrink-0 rounded-full ml-3 transition-all duration-300", statusColors.split(' border')[1])} />
                        
                        <div className="flex-1 p-3 xl:p-5 flex items-center gap-4 xl:gap-6 min-w-0">
                          
                          <div className="flex items-center gap-3 w-40 xl:w-48 shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 border border-border/50 overflow-hidden text-primary">
                              <Store className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-sm font-black tracking-tight truncate">#{req.id.slice(-6).toUpperCase()}</span>
                              </div>
                              <span className={cn("rounded-md border px-1.5 py-0 text-[9px] font-black uppercase tracking-widest shadow-sm inline-block truncate max-w-full", statusColors.split(' shadow')[0])}>
                                {statusLabel}
                              </span>
                            </div>
                          </div>

                          <div className="min-w-0 flex-[2]">
                            <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">Tienda</p>
                            <div className="text-sm font-bold truncate flex items-center gap-2">
                              <span className="truncate">{req.name}</span>
                              <div className="flex gap-1 shrink-0">
                                <span className="text-xs font-normal text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md border border-border/50 truncate max-w-[100px] xl:max-w-[150px]">{req.description}</span>
                              </div>
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 shrink-0">
                            <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">Usuario</p>
                            <p className="text-sm font-bold truncate">{req.user?.name || "Desconocido"}</p>
                          </div>

                          <div className="w-24 shrink-0 text-right hidden xl:block">
                            <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-0.5">Fecha</p>
                            <p className="text-sm font-bold">{format(new Date(req.createdAt), "dd MMM, yy", { locale: es })}</p>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => loadRequests(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-border/50 bg-card hover:bg-secondary transition-colors disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2 rounded-xl bg-secondary/50 font-medium">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => loadRequests(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-border/50 bg-card hover:bg-secondary transition-colors disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
      <StoreRequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        processingId={processingId}
      />
    </div>
  );
}
