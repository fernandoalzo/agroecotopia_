"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/Loading";
import { StoreRequest } from "@/types/store";
import { SearchInput } from "@/components/shared/SearchInput";
import { StoreRequestCard } from "./StoreRequestCard";
import { StoreRequestDetailModal } from "./StoreRequestDetailModal";

interface AdminStoreRequestsProps {
  onLoadRequests: (page: number, search?: string) => Promise<StoreRequestsResponse>;
  onApproveRequest: (id: string) => Promise<MutationResult>;
  onRejectRequest: (id: string, note: string) => Promise<MutationResult>;
}

type StoreRequestsResponse = {
  requests: StoreRequest[];
  totalPages: number;
  total: number;
  page: number;
};

type MutationResult =
  | { success: true; data: unknown }
  | { error: string };

export function AdminStoreRequests({
  onLoadRequests,
  onApproveRequest,
  onRejectRequest,
}: AdminStoreRequestsProps) {
  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<StoreRequest | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadRequests = useCallback(async (p: number, search?: string) => {
    setLoading(true);
    try {
      const res = await onLoadRequests(p, search);
      if (res && "requests" in res) {
        setRequests(res.requests);
        setTotalPages(res.totalPages || 1);
        setPage(res.page || 1);
        setTotalRequests(res.total || res.requests.length);
      }
    } catch {
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  }, [onLoadRequests]);

  useEffect(() => {
    setPage(1);
    loadRequests(1, debouncedSearch);
  }, [debouncedSearch, loadRequests]);

  const visibleRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return requests;

    return requests.filter((req) => {
      const values = [
        req.name,
        req.description,
        req.phone || "",
        req.email || "",
        req.address || "",
        req.city || "",
        req.user?.name || "",
        req.user?.email || "",
      ];
      return values.some((value) => value.toLowerCase().includes(q));
    });
  }, [requests, searchQuery]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await onApproveRequest(id);
      if (res && "error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Tienda aprobada y creada con éxito");
        setSelectedRequest(null);
        loadRequests(page, debouncedSearch);
      }
    } catch {
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
        loadRequests(page, debouncedSearch);
      }
    } catch {
      toast.error("Error al rechazar");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && requests.length === 0) return <Loading />;

  const searching = searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-border/40">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-display font-medium tracking-tight text-foreground">
              Solicitudes de Tienda
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Revisa el historial de solicitudes de nuevos vendedores y aprueba las pendientes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
              Total registradas:
            </span>
            <span className="text-xl font-black text-foreground">
              {searching ? visibleRequests.length : totalRequests}
            </span>
          </div>
        </div>
      </div>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar por tienda, nombre o datos del propietario..."
        onClear={() => setSearchQuery("")}
        containerClassName="max-w-2xl"
      />

      {loading && requests.length > 0 && (
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Buscando coincidencias...
        </div>
      )}

      {visibleRequests.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50">
            <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-bold">{searching ? "Sin resultados" : "Todo al día"}</h3>
          <p className="text-muted-foreground">
            {searching
              ? "No encontramos coincidencias en la lista actual ni en la base de datos."
              : "No hay solicitudes de tienda registradas."}
          </p>
        </div>
      ) : (
        <div className="relative space-y-3">
          <AnimatePresence mode="popLayout">
            {visibleRequests.map((req, index) => (
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
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => loadRequests(page - 1, debouncedSearch)}
            disabled={page === 1}
            className="rounded-xl border border-border/50 bg-card px-4 py-2 transition-colors disabled:opacity-50 hover:bg-secondary"
          >
            Anterior
          </button>
          <span className="rounded-xl bg-secondary/50 px-4 py-2 font-medium">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => loadRequests(page + 1, debouncedSearch)}
            disabled={page === totalPages}
            className="rounded-xl border border-border/50 bg-card px-4 py-2 transition-colors disabled:opacity-50 hover:bg-secondary"
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
