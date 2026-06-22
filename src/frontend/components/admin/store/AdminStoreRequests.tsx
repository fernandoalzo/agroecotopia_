"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/Loading";
import { StoreRequest } from "@/types/store";
import { SearchInput } from "@/components/shared/SearchInput";
import { StoreRequestDetailPanel } from "./StoreRequestDetailPanel";
import { DataTable } from "@/components/ui/data-table";
import { getAdminStoreRequestsColumns } from "./AdminStoreRequestsTableColumns";

interface AdminStoreRequestsProps {
  onLoadRequests: (page: number, search?: string) => Promise<StoreRequestsResponse>;
  onLoadRequestDetail: (id: string) => Promise<StoreRequest>;
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

export const AdminStoreRequests = React.memo(function AdminStoreRequests({
  onLoadRequests,
  onLoadRequestDetail,
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
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

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
        setSelectedRequestId(null);
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
        setSelectedRequestId(null);
        loadRequests(page, debouncedSearch);
      }
    } catch {
      toast.error("Error al rechazar");
    } finally {
      setProcessingId(null);
    }
  };

  const columns = useMemo(() => getAdminStoreRequestsColumns((req) => setSelectedRequestId(req.id)), []);

  const searching = searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col space-y-4 flex-1 min-h-0 relative">
      {/* ── Header ── */}
      <div className="pb-4 border-b border-border/40 shrink-0">
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
      
      {/* ── Search ── */}
      <div className="shrink-0">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar por tienda, nombre o datos del propietario..."
          onClear={() => setSearchQuery("")}
          containerClassName="max-w-md w-full"
          inputClassName="h-10"
        />
      </div>

      {/* ── DataTable Implementation ── */}
      <DataTable
        columns={columns}
        data={visibleRequests}
        loading={loading}
        pageCount={totalPages}
        currentPage={page}
        pageSize={10}
        totalEntries={totalRequests}
        onPageChange={(p) => loadRequests(p, debouncedSearch)}
        onRowClick={(row) => setSelectedRequestId(row.id)}
        emptyTitle={searching ? "Sin resultados" : "Todo al día"}
        emptyDescription={searching ? "No encontramos coincidencias en la lista actual ni en la base de datos." : "No hay solicitudes de tienda registradas."}
        emptyIcon={CheckCircle}
        footerLeftContent={
          <>
            <p className="text-xs text-muted-foreground">
              Mostrando página <span className="font-bold text-foreground">{page}</span> de{" "}
              <span className="font-bold text-foreground">{totalPages}</span>
            </p>
            {searching && (
              <button
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setSearchQuery("")}
              >
                Limpiar filtros
              </button>
            )}
          </>
        }
      />



      <StoreRequestDetailPanel
        requestId={selectedRequestId}
        onLoadDetail={onLoadRequestDetail}
        onClose={() => setSelectedRequestId(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        processingId={processingId}
      />
    </div>
  );
});
