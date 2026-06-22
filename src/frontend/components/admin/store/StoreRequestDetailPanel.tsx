"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  MapPin,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { StoreRequest } from "@/types/store";
import { Loading } from "@/components/ui/Loading";
import { toast } from "sonner";
import { SidePanel } from "@/frontend/components/ui/side-panel";

interface StoreRequestDetailPanelProps {
  requestId: string | null;
  onLoadDetail: (id: string) => Promise<StoreRequest>;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
  processingId: string | null;
}

export function StoreRequestDetailPanel({
  requestId,
  onLoadDetail,
  onClose,
  onApprove,
  onReject,
  processingId,
}: StoreRequestDetailPanelProps) {
  const [request, setRequest] = useState<StoreRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);

  // Fetch details from DB when requestId changes
  useEffect(() => {
    if (!requestId) {
      // Small delay to allow exit animation before clearing data
      const timer = setTimeout(() => setRequest(null), 300);
      return () => clearTimeout(timer);
    }

    let cancelled = false;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await onLoadDetail(requestId);
        if (!cancelled) {
          setRequest(data);
        }
      } catch {
        if (!cancelled) {
          toast.error("Error al cargar los detalles de la solicitud");
          onClose();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetail();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const isOpen = requestId !== null;
  const activeRequest = request;

  const isPending = activeRequest?.status === "PENDING";
  const isProcessing = processingId === activeRequest?.id;

  const statusConfig = {
    PENDING: {
      label: "Pendiente",
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      dot: "bg-amber-500",
      glow: "shadow-[0_0_12px_rgba(245,158,11,0.3)]",
    },
    APPROVED: {
      label: "Aprobada",
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      dot: "bg-emerald-500",
      glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]",
    },
    REJECTED: {
      label: "Rechazada",
      color: "bg-red-500/10 text-red-600 border-red-500/20",
      dot: "bg-red-500",
      glow: "shadow-[0_0_12px_rgba(239,68,68,0.3)]",
    },
  };

  useEffect(() => {
    if (!isProcessing) {
      setIsLocalSubmitting(false);
    }
  }, [isProcessing]);

  const handleRejectSubmit = () => {
    if (isProcessing || isLocalSubmitting) return;
    if (!rejectNote.trim() || !activeRequest) return;
    setIsLocalSubmitting(true);
    onReject(activeRequest.id, rejectNote);
  };

  const handleClose = () => {
    setIsRejecting(false);
    setRejectNote("");
    setConfirmAction(null);
    setIsLocalSubmitting(false);
    onClose();
  };

  return (
    <SidePanel
      open={isOpen}
      onClose={handleClose}
      title={activeRequest ? activeRequest.name : "Detalles de Solicitud"}
      subtitle={activeRequest ? `ID: ${activeRequest.id.slice(-8)}` : ""}
      icon={<Store className="w-5 h-5 text-primary" />}
      maxWidth="max-w-xl"
      footer={
        isPending && !isRejecting && (
          <div className="w-full">
            <AnimatePresence mode="wait">
              {!confirmAction ? (
                <motion.div
                  key="action-buttons"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-3 w-full"
                >
                  <button
                    onClick={() => setConfirmAction("reject")}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-red-600 bg-red-500/10 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/20 transition-all flex items-center justify-center gap-2"
                    disabled={isProcessing || isLocalSubmitting}
                  >
                    <XCircle className="w-4 h-4" />
                    Rechazar Solicitud
                  </button>
                  <button
                    onClick={() => setConfirmAction("approve")}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                    disabled={isProcessing || isLocalSubmitting}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprobar Tienda
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="confirm-block"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "rounded-2xl p-5 space-y-4 text-center border w-full",
                    confirmAction === "approve"
                      ? "bg-primary/5 border-primary/15"
                      : "bg-red-500/5 border-red-500/15"
                  )}
                >
                  <p className={cn(
                    "text-sm font-semibold",
                    confirmAction === "approve" ? "text-primary" : "text-red-600"
                  )}>
                    {confirmAction === "approve"
                      ? "¿Estás seguro de que deseas aprobar esta tienda?"
                      : "¿Estás seguro de que deseas rechazar esta solicitud?"}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      disabled={isProcessing || isLocalSubmitting}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-border/50 bg-card text-foreground/70 hover:bg-secondary transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isProcessing || isLocalSubmitting) return;
                        if (confirmAction === "approve") {
                          setIsLocalSubmitting(true);
                          onApprove(activeRequest!.id);
                        } else {
                          setIsRejecting(true);
                          setConfirmAction(null);
                        }
                      }}
                      disabled={isProcessing || isLocalSubmitting}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-70 active:scale-[0.98] flex items-center justify-center gap-2",
                        confirmAction === "approve"
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                          : "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                      )}
                    >
                      {isProcessing || isLocalSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : confirmAction === "approve" ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Sí, aprobar
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Sí, rechazar
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      }
    >
      <div className="space-y-6">
        {loading && (
          <Loading
            text="Cargando solicitud..."
            subtext="Obteniendo detalles desde la base de datos"
          />
        )}

        {!loading && activeRequest && (() => {
          const status = statusConfig[activeRequest.status as keyof typeof statusConfig] || statusConfig.PENDING;

          const contactItems = [
            {
              icon: Mail,
              label: "Email",
              value: activeRequest.email || activeRequest.user?.email || "No especificado",
            },
            {
              icon: Phone,
              label: "Teléfono",
              value: activeRequest.phone || "No especificado",
            },
            {
              icon: MapPin,
              label: "Ubicación",
              value: activeRequest.address
                ? `${activeRequest.address}${activeRequest.city ? `, ${activeRequest.city}` : ""}`
                : "Sin ubicación",
            },
          ];

          return (
            <>
              <div className="flex items-center justify-between bg-secondary/20 p-4 rounded-xl border border-border/50">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado Actual</span>
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border",
                  activeRequest.status === "PENDING" ? "text-amber-600 bg-amber-500/10 border-amber-500/20" :
                  activeRequest.status === "APPROVED" ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" :
                  "text-red-600 bg-red-500/10 border-red-500/20"
                )}>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    activeRequest.status === "PENDING" ? "bg-amber-500 animate-pulse" :
                    activeRequest.status === "APPROVED" ? "bg-emerald-500" :
                    "bg-red-500"
                  )} />
                  {status.label}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Fecha de Solicitud
                </p>
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(activeRequest.createdAt), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Propósito Comercial
                </p>
                <div className="bg-secondary/10 p-4 rounded-xl border border-border/50">
                  <p className="text-sm leading-relaxed text-foreground italic">
                    "{activeRequest.description}"
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Datos de Contacto
                </p>
                <div className="space-y-3">
                  {contactItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="p-2 bg-secondary/30 rounded-lg shrink-0">
                        <item.icon className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-medium text-foreground mt-0.5">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Solicitante
                </p>
                <div className="flex items-center gap-4 bg-secondary/10 p-4 rounded-xl border border-border/50">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex items-center justify-center shrink-0 border border-border">
                    {activeRequest.user?.image ? (
                      <img
                        src={activeRequest.user.image}
                        alt={activeRequest.user.name || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-muted-foreground">
                        {activeRequest.user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">
                      {activeRequest.user?.name || "Desconocido"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeRequest.user?.email || "Sin email"}
                    </p>
                  </div>
                </div>
              </div>

              {activeRequest.adminNote && activeRequest.status !== "PENDING" && (
                <div className="space-y-1.5 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Resolución Administrativa
                  </p>
                  <div className="bg-secondary/20 p-4 rounded-xl border border-border/50">
                    <p className="text-sm font-medium text-foreground">
                      {activeRequest.adminNote}
                    </p>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {isRejecting && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-xl space-y-3 mt-4">
                      <p className="text-sm font-bold text-red-600 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Motivo del rechazo
                      </p>
                      <textarea
                        className="w-full bg-background border border-red-500/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/40 transition-all resize-none"
                        placeholder="Ej. No cumple con las políticas de productos agroecológicos."
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsRejecting(false);
                            setRejectNote("");
                          }}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isProcessing || isLocalSubmitting}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleRejectSubmit}
                          className={cn(
                            "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2",
                            rejectNote.trim()
                              ? "bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20"
                              : "bg-red-500/50 cursor-not-allowed"
                          )}
                          disabled={isProcessing || isLocalSubmitting || !rejectNote.trim()}
                        >
                          {isProcessing || isLocalSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            "Confirmar Rechazo"
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          );
        })()}
      </div>
    </SidePanel>
  );
}
