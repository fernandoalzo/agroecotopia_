"use client";

import React, { useEffect, useState, useCallback } from "react";
import { StoreRequest } from "@/types/store";
import { Loading } from "@/components/ui/Loading";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { StoreRequestDetailModal } from "./StoreRequestDetailModal";
import { StoreRequestCard } from "./StoreRequestCard";

interface AdminStoreRequestsProps {
  onLoadRequests: (page: number) => Promise<any>;
  onApproveRequest: (id: string) => Promise<any>;
  onRejectRequest: (id: string, note: string) => Promise<any>;
}

export function AdminStoreRequests({
  onLoadRequests,
  onApproveRequest,
  onRejectRequest,
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
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
              Total registradas:
            </span>
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
            {requests.map((req, index) => (
              <StoreRequestCard
                key={req.id}
                req={req}
                index={index}
                onSelect={setSelectedRequest}
              />
            ))}
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