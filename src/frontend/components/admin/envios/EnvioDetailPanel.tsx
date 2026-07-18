"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Clock, MapPin as MapPinIcon, Package, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";
import { envioStatusConfig, nextValidStatuses, type EnvioEstadoKey } from "./envioUtils";

type Envio = any;
type EnvioEvento = any;

interface EnvioDetailPanelProps {
  envio: Envio;
  onClose: () => void;
  onUpdateStatus: (envioId: string, nuevoEstado: EnvioEstadoKey, extra?: { ubicacion?: string; descripcion?: string; transportadora?: string; bodegaId?: string }) => Promise<boolean>;
  bodegas?: any[];
  getEnvioDetail?: (envioId: string) => Promise<any>;
  onOpenOrderDetail?: (pedidoId: string) => void;
}

export function EnvioDetailPanel({ envio: initialEnvio, onClose, onUpdateStatus, bodegas = [], getEnvioDetail, onOpenOrderDetail }: EnvioDetailPanelProps) {
  const [fullEnvio, setFullEnvio] = useState<Envio | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<EnvioEstadoKey | "">("");
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [transportadora, setTransportadora] = useState(initialEnvio.transportadora || "");
  const [bodegaId, setBodegaId] = useState("");
  const [updating, setUpdating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const statusInputRef = useRef<HTMLInputElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [bodegaOpen, setBodegaOpen] = useState(false);
  const bodegaInputRef = useRef<HTMLInputElement>(null);
  const bodegaDropdownRef = useRef<HTMLDivElement>(null);

  const displayEnvio = fullEnvio || initialEnvio;

  const currentConfig = envioStatusConfig[displayEnvio.estado as EnvioEstadoKey];
  const StatusIcon = currentConfig?.icon || Package;
  const nextStatuses = nextValidStatuses[displayEnvio.estado as EnvioEstadoKey] || [];

  const loadDetail = async () => {
    if (getEnvioDetail && initialEnvio.id) {
      const detail = await getEnvioDetail(initialEnvio.id);
      if (detail) {
        setFullEnvio(detail);
      }
    }
  };

  useEffect(() => {
    loadDetail();
  }, [initialEnvio.id, getEnvioDetail]);

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;
    setUpdating(true);
    try {
      const success = await onUpdateStatus(displayEnvio.id, selectedStatus as EnvioEstadoKey, {
        ubicacion: ubicacion || undefined,
        descripcion: descripcion || undefined,
        transportadora: transportadora || undefined,
        bodegaId: bodegaId || undefined,
      });
      if (success) {
        await loadDetail();
      }
      setSelectedStatus("");
      setUbicacion("");
      setDescripcion("");
      setBodegaId("");
    } finally {
      setUpdating(false);
      setConfirming(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
      if (bodegaDropdownRef.current && !bodegaDropdownRef.current.contains(e.target as Node)) {
        setBodegaOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const eventos = displayEnvio.eventos || [];

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 backdrop-blur-[3px] z-40 cursor-pointer"
        />
        <motion.div
          key="panel"
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight truncate">
              Envío {displayEnvio.numeroGuia}
            </h2>
            <p className="text-xs text-muted-foreground">
              Pedido #{displayEnvio.pedidoId?.slice(-6).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border",
              currentConfig?.bgColor,
              currentConfig?.borderColor,
              currentConfig?.color
            )}>
              <StatusIcon className="w-4 h-4" />
              {currentConfig?.labelEs}
            </span>
            {displayEnvio.transportadora && (
              <span className="text-sm text-muted-foreground">
                {displayEnvio.transportadora}
              </span>
            )}
          </div>

          {/* Información del Destinatario */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Datos del Destinatario
            </h3>
            <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
              {displayEnvio.destinatarioNombre && (
                <p className="text-sm font-medium">{displayEnvio.destinatarioNombre}</p>
              )}
              {displayEnvio.destinatarioTelefono && (
                <p className="text-sm text-muted-foreground">{displayEnvio.destinatarioTelefono}</p>
              )}
              <p className="text-sm text-muted-foreground">{displayEnvio.direccionEntrega}</p>
              {displayEnvio.ciudad && (
                <p className="text-sm text-muted-foreground">
                  {displayEnvio.ciudad}{displayEnvio.departamento ? `, ${displayEnvio.departamento}` : ""}
                </p>
              )}
              {displayEnvio.instruccionesEntrega && (
                <div className="pt-2 border-t border-border/40 mt-2">
                  <p className="text-xs text-muted-foreground/70">Instrucciones:</p>
                  <p className="text-sm">{displayEnvio.instruccionesEntrega}</p>
                </div>
              )}
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Línea de Tiempo
            </h3>
            <div className="relative">
              {eventos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin eventos registrados</p>
              ) : (
                <div className="space-y-0">
                  {eventos.map((evento: EnvioEvento, idx: number) => {
                    const evConfig = envioStatusConfig[evento.estado as EnvioEstadoKey];
                    const EvIcon = evConfig?.icon || Clock;
                    const isLast = idx === eventos.length - 1;
                    return (
                      <div key={evento.id} className="relative flex gap-4 pb-6 last:pb-0">
                        {!isLast && (
                          <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                        )}
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2",
                          evConfig?.bgColor,
                          evConfig?.borderColor
                        )}>
                          <EvIcon className={cn("w-4 h-4", evConfig?.color)} />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-sm font-semibold">{evConfig?.labelEs}</p>
                          {evento.descripcion && (
                            <p className="text-xs text-muted-foreground mt-0.5">{evento.descripcion}</p>
                          )}
                          {evento.ubicacion && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3" />
                              {evento.ubicacion}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground/50 mt-1">
                            {new Date(evento.fecha).toLocaleString("es-CO", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Acciones */}
          {nextStatuses.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Actualizar Estado
              </h3>
              <div className="bg-secondary/20 rounded-xl p-4 space-y-3">
                <div className="relative" ref={statusDropdownRef}>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Nuevo Estado
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-muted-foreground/50 pointer-events-none z-10">
                      {selectedStatus ? (
                        (() => {
                          const cfg = envioStatusConfig[selectedStatus as EnvioEstadoKey];
                          const Icon = cfg?.icon || Package;
                          return <Icon className={cn("h-4 w-4", cfg?.color)} />;
                        })()
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                    </div>
                    <input
                      ref={statusInputRef}
                      readOnly
                      value={selectedStatus ? envioStatusConfig[selectedStatus as EnvioEstadoKey]?.labelEs || "" : ""}
                      onFocus={() => setStatusOpen(true)}
                      placeholder="Seleccionar estado..."
                      className={`w-full border border-border/50 bg-background pl-10 pr-10 py-2.5 text-sm font-medium focus:outline-none transition-all placeholder:text-muted-foreground/40 cursor-pointer ${
                        statusOpen
                          ? "rounded-t-xl border-b-transparent focus:ring-0 shadow-[0_4px_20px_-10px_rgba(var(--primary),0.3)]"
                          : "rounded-xl focus:ring-2 focus:ring-primary/30 shadow-sm"
                      }`}
                    />
                    <div className="absolute right-3 text-muted-foreground/40 pointer-events-none">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        className={`transition-transform ${statusOpen ? "rotate-180" : ""}`}
                      >
                        <path
                          d="M3 4.5L6 7.5L9 4.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  <AnimatePresence>
                    {statusOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-20 w-full top-full bg-card border border-border/50 border-t-0 rounded-b-xl shadow-[0_15px_30px_-15px_rgba(var(--primary),0.2)] p-1"
                      >
                        {nextStatuses.map((status) => {
                          const cfg = envioStatusConfig[status];
                          const Icon = cfg?.icon || Package;
                          const selected = selectedStatus === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                setSelectedStatus(status);
                                setStatusOpen(false);
                                statusInputRef.current?.blur();
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group text-left ${
                                selected
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-secondary/70 text-foreground/90"
                              }`}
                            >
                              <span className={cn("flex items-center gap-2", cfg?.color)}>
                                <Icon className="w-4 h-4" />
                                {cfg?.labelEs}
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {(selectedStatus === "FALLIDO" || selectedStatus === "DEVUELTO") && bodegas.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className={cn(bodegaOpen ? "overflow-visible" : "overflow-hidden")}
                  >
                    <div className="pt-2">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Bodega de Retorno
                      </label>
                      <div className="relative" ref={bodegaDropdownRef}>
                        <div className="relative flex items-center">
                          <div className="absolute left-3 text-muted-foreground/50 pointer-events-none z-10">
                            <Warehouse className={cn("h-4 w-4", bodegaId ? "text-primary" : "")} />
                          </div>
                          <input
                            ref={bodegaInputRef}
                            readOnly
                            value={bodegaId ? `${bodegas.find(b => b.id === bodegaId)?.name} (${bodegas.find(b => b.id === bodegaId)?.city})` : ""}
                            onFocus={() => setBodegaOpen(true)}
                            placeholder="Selecciona la bodega original..."
                            className={`w-full border border-border/50 bg-background pl-10 pr-10 py-2.5 text-sm font-medium focus:outline-none transition-all placeholder:text-muted-foreground/40 cursor-pointer ${
                              bodegaOpen
                                ? "rounded-t-xl border-b-transparent focus:ring-0 shadow-[0_4px_20px_-10px_rgba(var(--primary),0.3)]"
                                : "rounded-xl focus:ring-2 focus:ring-primary/30 shadow-sm"
                            }`}
                          />
                          <div className="absolute right-3 text-muted-foreground/40 pointer-events-none">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              className={`transition-transform ${bodegaOpen ? "rotate-180" : ""}`}
                            >
                              <path
                                d="M3 4.5L6 7.5L9 4.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>

                        <AnimatePresence>
                          {bodegaOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-20 w-full top-full bg-card border border-border/50 border-t-0 rounded-b-xl shadow-[0_15px_30px_-15px_rgba(var(--primary),0.2)] p-1 max-h-48 overflow-y-auto"
                            >
                              {bodegas.map((b) => {
                                const selected = bodegaId === b.id;
                                return (
                                  <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => {
                                      setBodegaId(b.id);
                                      setBodegaOpen(false);
                                      bodegaInputRef.current?.blur();
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group text-left ${
                                      selected
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-secondary/70 text-foreground/90"
                                    }`}
                                  >
                                    <span className={cn("flex items-center gap-2", selected ? "text-primary" : "")}>
                                      <Warehouse className="w-4 h-4" />
                                      {b.name} ({b.city})
                                    </span>
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Indica a qué bodega fue retornado el pedido para actualizar su estado.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Transportadora
                  </label>
                  <input
                    type="text"
                    value={transportadora}
                    onChange={(e) => setTransportadora(e.target.value)}
                    placeholder="Ej: Coordinadora, Servientrega..."
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    placeholder="Ciudad o ubicación actual"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Descripción / Nota
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Detalle adicional del evento..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                {confirming ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                      ¿Estás seguro de cambiar el estado a{" "}
                      <strong className="text-foreground">
                        {envioStatusConfig[selectedStatus as EnvioEstadoKey]?.labelEs}
                      </strong>
                      ?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setConfirming(false);
                          setSelectedStatus("");
                          setUbicacion("");
                          setDescripcion("");
                          setBodegaId("");
                        }}
                        disabled={updating}
                        className="flex-1 py-2.5 rounded-xl font-semibold text-sm border border-border hover:bg-secondary transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleUpdateStatus}
                        disabled={updating}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all",
                          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/15",
                          updating && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {updating ? "Actualizando..." : "Confirmar Cambio"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirming(true)}
                    disabled={!selectedStatus}
                    className={cn(
                      "w-full py-2.5 rounded-xl font-semibold text-sm transition-all",
                      selectedStatus
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/15"
                        : "bg-secondary text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    Continuar
                  </button>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Creado: {new Date(displayEnvio.createdAt).toLocaleDateString("es-CO")}</span>
            <button
              onClick={() => {
                if (onOpenOrderDetail && displayEnvio.pedidoId) {
                  onOpenOrderDetail(displayEnvio.pedidoId);
                } else if (displayEnvio.pedidoId) {
                  window.open(`/pedidos/${displayEnvio.pedidoId}`, '_blank');
                }
              }}
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              Ver Pedido <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
