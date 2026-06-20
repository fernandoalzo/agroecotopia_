"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Pause,
  Play,
  Trash2,
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Globe,
} from "lucide-react";
import type { WafRequestEntry } from "@/lib/waf/request-buffer";
import { useSocket } from "@/frontend/context/SocketContext";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { cn } from "@/lib/utils";

interface WafMonitorActions {
  getLog: (count?: number) => Promise<{ success: boolean; entries: WafRequestEntry[]; maxVisible?: number }>;
  clearLog: () => Promise<{ success: boolean }>;
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return ts;
  }
}

function WafActionBadge({ action }: { action: WafRequestEntry["wafAction"] }) {
  const config = {
    ALLOW: { icon: ShieldCheck, bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", label: "Permitida" },
    MONITOR: { icon: ShieldAlert, bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", label: "Monitoreo" },
    BLOCK: { icon: Shield, bg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", label: "Bloqueada" },
  }[action];

  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 font-mono text-[10px] font-bold border w-[82px] justify-center", config.bg)}>
      <Icon className="h-3 w-3 shrink-0" />
      {config.label}
    </Badge>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    POST: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    PUT: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    PATCH: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    DELETE: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
    OPTIONS: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
    HEAD: "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20",
  };

  return (
    <span className={cn("font-mono text-[11px] font-bold px-2 py-0.5 rounded border w-[58px] text-center inline-block", colors[method] || colors.GET)}>
      {method}
    </span>
  );
}

export function WafMonitor({ actions }: { actions: WafMonitorActions }) {
  const [entries, setEntries] = useState<WafRequestEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [maxVisible, setMaxVisible] = useState(200);
  const { socket } = useSocket();
  const pauseBuffer = useRef<WafRequestEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNewEntry = useCallback(
    (entry: WafRequestEntry) => {
      if (paused) {
        pauseBuffer.current.push(entry);
        return;
      }
      setEntries((prev) => [entry, ...prev].slice(0, maxVisible));
    },
    [paused, maxVisible],
  );

  useEffect(() => {
    if (!socket) return;
    setConnected(true);
    socket.emit("join_waf_monitor");
    socket.on("waf:request_live", handleNewEntry);

    return () => {
      socket.emit("leave_waf_monitor");
      socket.off("waf:request_live", handleNewEntry);
    };
  }, [socket, handleNewEntry]);

  useEffect(() => {
    if (!paused && pauseBuffer.current.length > 0) {
      const batched = pauseBuffer.current;
      pauseBuffer.current = [];
      setEntries((prev) => [...batched.reverse(), ...prev].slice(0, maxVisible));
    }
  }, [paused, maxVisible]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await actions.getLog(100);
        if (res.success) {
          setEntries(res.entries);
          if (res.maxVisible) setMaxVisible(res.maxVisible);
        }
      } catch { /* noop */ } finally {
        setLoading(false);
      }
    };
    load();
  }, [actions]);

  const handleClear = async () => {
    try {
      await actions.clearLog();
      setEntries([]);
      pauseBuffer.current = [];
    } catch { /* noop */ }
  };

  const togglePause = () => setPaused((p) => !p);

  const blockedCount = entries.filter((e) => e.wafAction === "BLOCK").length;
  const monitorCount = entries.filter((e) => e.wafAction === "MONITOR").length;
  const allowCount = entries.filter((e) => e.wafAction === "ALLOW").length;
  const avgElapsed = entries.length > 0
    ? Math.round(entries.reduce((sum, e) => sum + e.elapsedMs, 0) / entries.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Radio className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Monitor de Solicitudes</h2>
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", connected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40")} />
            <span className="text-[11px] text-muted-foreground font-mono">{entries.length} requests</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2 text-[11px] font-medium">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> {allowCount}
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> {monitorCount}
            </span>
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500" /> {blockedCount}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={togglePause}
            className={cn("gap-1.5 text-xs", paused && "border-amber-400 text-amber-600 dark:text-amber-400")}
          >
            {paused ? (
              <>
                <Play className="h-3.5 w-3.5" /> Reanudar
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" /> Pausar
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={handleClear} className="gap-1.5 text-xs">
            <Trash2 className="h-3.5 w-3.5" /> Limpiar
          </Button>
        </div>
      </div>

      {paused && pauseBuffer.current.length > 0 && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" />
          {pauseBuffer.current.length} solicitudes en pausa. Reanudá para verlas.
        </div>
      )}

      <div
        ref={containerRef}
        className="rounded-xl border border-border/50 bg-card/30 overflow-hidden"
      >
        <div className="max-h-[65vh] overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-3" />
              Cargando registro de solicitudes...
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Radio className="h-10 w-10 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-semibold text-muted-foreground">No hay solicitudes registradas</p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-md">
                Las solicitudes aparecerán aquí en tiempo real cuando el WAF esté activo.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[82px_58px_1fr_130px_auto_72px] gap-2 px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 border-b border-border/20 bg-muted/10">
                <span>Estado</span>
                <span>Método</span>
                <span>Ruta</span>
                <span className="hidden md:block">IP</span>
                <span className="hidden lg:block">Reglas</span>
                <span className="text-right">Hora</span>
              </div>
              <AnimatePresence initial={false}>
                {entries.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={i === 0 ? { opacity: 0, y: -12, scale: 0.98 } : undefined}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className={cn(
                      "grid grid-cols-[82px_58px_1fr_130px_auto_72px] gap-2 px-4 py-2.5 border-b border-border/20 text-xs items-center transition-colors",
                      entry.wafAction === "BLOCK" && "bg-red-500/[0.04]",
                      entry.wafAction === "MONITOR" && "bg-amber-500/[0.04]",
                      i === 0 && "bg-primary/[0.03]",
                    )}
                  >
                    <WafActionBadge action={entry.wafAction} />

                    <MethodBadge method={entry.method} />

                    <div className="min-w-0 font-mono text-[12px] truncate" title={entry.path + (entry.query ? `?${entry.query}` : "")}>
                      <span className="text-foreground/90">{entry.path}</span>
                      {entry.query && (
                        <span className="text-muted-foreground/50">?{entry.query.slice(0, 40)}{entry.query.length > 40 ? "…" : ""}</span>
                      )}
                    </div>

                    <div className="text-muted-foreground hidden md:block truncate" title={entry.ip}>
                      <Globe className="h-3 w-3 inline mr-1 align-middle shrink-0" />
                      <span className="font-mono text-[11px]">{entry.ip}</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-1 min-w-0">
                      {entry.wafRules.length > 0 ? (
                        <>
                          {entry.wafRules.slice(0, 2).map((ruleId) => (
                            <span
                              key={ruleId}
                              className="text-[9px] font-mono bg-destructive/10 text-destructive px-1.5 py-0.5 rounded border border-destructive/20 truncate max-w-[80px]"
                              title={ruleId}
                            >
                              {ruleId.replace("waf:", "")}
                            </span>
                          ))}
                          {entry.wafRules.length > 2 && (
                            <span className="text-[9px] text-muted-foreground shrink-0">+{entry.wafRules.length - 2}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-[9px] text-muted-foreground/40">—</span>
                      )}
                    </div>

                    <div className="text-muted-foreground/60 font-mono text-[10px] text-right">
                      {formatTime(entry.timestamp)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}
        </div>

        <div className="border-t border-border/30 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground bg-card/50">
          <span>
            Mostrando {entries.length} solicitudes &middot; WAF:{" "}
            {blockedCount > 0 ? (
              <span className="text-red-500 font-semibold">{blockedCount} bloqueadas</span>
            ) : (
              <span className="text-emerald-500 font-semibold">0 bloqueadas</span>
            )}
          </span>
          <span>
            {avgElapsed}ms promedio
          </span>
        </div>
      </div>
    </div>
  );
}
