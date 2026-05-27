"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  MapPin,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  User,
  FileText,
  Clock,
  Hash,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { StoreRequest } from "@/types/store";

interface StoreRequestDetailModalProps {
  request: StoreRequest | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
  processingId: string | null;
}

export function StoreRequestDetailModal({
  request,
  onClose,
  onApprove,
  onReject,
  processingId,
}: StoreRequestDetailModalProps) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [localRequest, setLocalRequest] = React.useState<StoreRequest | null>(null);

  React.useEffect(() => {
    if (request) {
      setLocalRequest(request);
    }
  }, [request]);

  const activeRequest = request || localRequest;

  if (!activeRequest) return null;

  const isPending = activeRequest.status === "PENDING";
  const isProcessing = processingId === activeRequest.id;

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

  const status = statusConfig[activeRequest.status as keyof typeof statusConfig] || statusConfig.PENDING;

  const handleRejectSubmit = () => {
    if (!rejectNote.trim()) return;
    onReject(activeRequest.id, rejectNote);
    setIsRejecting(false);
    setRejectNote("");
  };

  const handleClose = () => {
    setIsRejecting(false);
    setRejectNote("");
    onClose();
  };

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
    <AnimatePresence>
      {request && (
        <motion.div
          key="store-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
          onClick={handleClose}
        />
      )}

      {request && (
        <motion.div
          key="store-modal-container"
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-xl translate-x-[-50%] translate-y-[-50%] p-4 md:p-0"
        >
          <div className="bg-card border border-border/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

          {/* ═══ HEADER (Minimalist & Elegant) ═══ */}
          <div className="relative px-8 pt-8 pb-4 bg-background">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-display font-medium leading-tight tracking-tight text-foreground/90">
                  {activeRequest.name}
                </h2>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs font-mono tracking-widest text-muted-foreground/60 uppercase">
                    ID: {activeRequest.id.slice(-8)}
                  </span>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest",
                    activeRequest.status === "PENDING" ? "text-amber-600" :
                    activeRequest.status === "APPROVED" ? "text-emerald-600" :
                    "text-red-600"
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
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <X className="w-6 h-6 stroke-[1.5]" />
              </button>
            </div>
          </div>

          {/* ═══ BODY (Elegant Letter Style) ═══ */}
          <div className="px-8 pb-8 overflow-y-auto flex-1 space-y-8 bg-background">

            <div className="h-px w-16 bg-border/40 my-2" />

            {/* Fecha */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">
                Fecha de Solicitud
              </p>
              <p className="text-sm font-serif text-foreground/80">
                {format(new Date(activeRequest.createdAt), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>

            {/* Descripción */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">
                Propósito Comercial
              </p>
              <p className="text-base font-serif leading-relaxed text-foreground/90 italic pl-4 border-l-2 border-primary/20">
                "{activeRequest.description}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* Información de Contacto */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                  Datos de Contacto
                </p>
                <div className="space-y-3">
                  {contactItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <item.icon className="w-4 h-4 text-muted-foreground/40 mt-0.5" strokeWidth={1.5} />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{item.label}</p>
                        <p className="font-medium text-foreground/80 mt-0.5">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usuario Solicitante */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                  Firma del Solicitante
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary/50 flex items-center justify-center">
                    {activeRequest.user?.image ? (
                      <img
                        src={activeRequest.user.image}
                        alt={activeRequest.user.name || ""}
                        className="w-full h-full object-cover grayscale opacity-80"
                      />
                    ) : (
                      <span className="font-serif text-xl text-muted-foreground/60">
                        {activeRequest.user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-serif text-lg font-medium text-foreground/90">
                      {activeRequest.user?.name || "Desconocido"}
                    </p>
                    <p className="text-xs text-muted-foreground/60 font-medium">
                      {activeRequest.user?.email || "Sin email"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Note */}
            {activeRequest.adminNote && activeRequest.status !== "PENDING" && (
              <div className="pt-6 mt-6 border-t border-border/20">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">
                  Resolución Administrativa
                </p>
                <p className="text-sm font-serif leading-relaxed text-foreground/80">
                  {activeRequest.adminNote}
                </p>
              </div>
            )}

            {/* Reject form (inline, animated) */}
            <AnimatePresence>
              {isRejecting && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-xl space-y-3">
                    <p className="text-sm font-bold text-red-600 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Motivo del rechazo
                    </p>
                    <textarea
                      className="w-full bg-white dark:bg-black/20 border border-red-500/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/40 transition-all resize-none"
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
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-secondary hover:bg-secondary/80 transition-colors"
                        disabled={isProcessing}
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
                        disabled={isProcessing || !rejectNote.trim()}
                      >
                        {isProcessing ? (
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
          </div>

          {/* ═══ FOOTER (Action buttons — only for PENDING) ═══ */}
          {isPending && !isRejecting && (
            <div className="p-4 border-t border-border/30 bg-gradient-to-r from-secondary/5 to-secondary/15 flex gap-3">
              <button
                onClick={() => setIsRejecting(true)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-red-600 bg-red-500/10 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/20 transition-all flex items-center justify-center gap-2"
                disabled={isProcessing}
              >
                <XCircle className="w-4 h-4" />
                Rechazar Solicitud
              </button>
              <button
                onClick={() => onApprove(activeRequest.id)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Aprobar Tienda
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
