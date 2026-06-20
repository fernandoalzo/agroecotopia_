"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Copy,
  Check,
  Search,
  Clock,
  Link as LinkIcon,
  Monitor,
  Server,
} from "lucide-react";
import type { WafRequestEntry } from "@/lib/waf/request-buffer";
import { useSocket } from "@/frontend/context/SocketContext";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { cn } from "@/lib/utils";
import { SidePanel } from "@/frontend/components/ui/side-panel";

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

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* noop */ }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground text-muted-foreground/40 shrink-0"
      title={`Copiar: ${value}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
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

function ResizableHeader({
  title,
  width,
  onResizeStart,
}: {
  title: string;
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="relative flex items-center h-full">
      <span className="truncate">{title}</span>
      <div
        className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize hover:bg-primary/20 z-10 transition-colors"
        onMouseDown={onResizeStart}
      />
    </div>
  );
}

export function WafMonitor({ actions }: { actions: WafMonitorActions }) {
  const [entries, setEntries] = useState<WafRequestEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [maxVisible, setMaxVisible] = useState(200);
  const [searchQuery, setSearchQuery] = useState("");
  const { socket } = useSocket();
  const pauseBuffer = useRef<WafRequestEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedEntry, setSelectedEntry] = useState<WafRequestEntry | null>(null);

  const [colWidths, setColWidths] = useState([82, 58, 400, 150, 100, 72]);
  const resizingRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { index, startX, startWidth } = resizingRef.current;
    const diff = e.clientX - startX;
    setColWidths((prev) => {
      const next = [...prev];
      next[index] = Math.max(40, startWidth + diff);
      return next;
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    resizingRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
  }, [handleMouseMove]);

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = {
      index,
      startX: e.clientX,
      startWidth: colWidths[index] as number,
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
  };

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

  const getLogRef = useRef(actions.getLog);
  useEffect(() => { getLogRef.current = actions.getLog; });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getLogRef.current(100);
        if (res.success) {
          setEntries(res.entries);
          if (res.maxVisible) setMaxVisible(res.maxVisible);
        }
      } catch { /* noop */ } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleClear = async () => {
    try {
      await actions.clearLog();
      setEntries([]);
      pauseBuffer.current = [];
    } catch { /* noop */ }
  };

  const togglePause = () => setPaused((p) => !p);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const method = e.method.toLowerCase();
      const path = (e.path + (e.query ? `?${e.query}` : "")).toLowerCase();
      const ip = e.ip.toLowerCase();
      const status = e.wafAction.toLowerCase();
      return method.includes(q) || path.includes(q) || ip.includes(q) || status.includes(q);
    });
  }, [entries, searchQuery]);

  const blockedCount = entries.filter((e) => e.wafAction === "BLOCK").length;
  const monitorCount = entries.filter((e) => e.wafAction === "MONITOR").length;
  const allowCount = entries.filter((e) => e.wafAction === "ALLOW").length;
  const avgElapsed = entries.length > 0
    ? Math.round(entries.reduce((sum, e) => sum + e.elapsedMs, 0) / entries.length)
    : 0;

  const gridStyle = { gridTemplateColumns: colWidths.map(w => `${w}px`).join(" ") };

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

        <div className="relative flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por IP, ruta, método o estado…"
            className="w-full h-8 pl-8 pr-3 rounded-xl border border-border/50 bg-background/50 text-xs font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
          />
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
        <div className="max-h-[65vh] overflow-x-auto overflow-y-auto overscroll-contain">
          <div className="min-w-max">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground w-full">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-3" />
                Cargando registro de solicitudes...
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center w-full">
                <Radio className="h-10 w-10 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-semibold text-muted-foreground">No hay solicitudes registradas</p>
                <p className="text-xs text-muted-foreground/60 mt-1 max-w-md">
                  Las solicitudes aparecerán aquí en tiempo real cuando el WAF esté activo.
                </p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center w-full">
                <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">Sin resultados</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  No hay solicitudes que coincidan con <span className="font-mono text-foreground/70">&quot;{searchQuery}&quot;</span>
                </p>
              </div>
            ) : (
              <>
                <div 
                  className="grid gap-2 px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 border-b border-border/20 bg-muted/10 sticky top-0 z-20"
                  style={gridStyle}
                >
                  <ResizableHeader title="Estado" width={colWidths[0]} onResizeStart={(e) => handleMouseDown(0, e)} />
                  <ResizableHeader title="Método" width={colWidths[1]} onResizeStart={(e) => handleMouseDown(1, e)} />
                  <ResizableHeader title="Ruta" width={colWidths[2]} onResizeStart={(e) => handleMouseDown(2, e)} />
                  <ResizableHeader title="IP" width={colWidths[3]} onResizeStart={(e) => handleMouseDown(3, e)} />
                  <ResizableHeader title="Reglas" width={colWidths[4]} onResizeStart={(e) => handleMouseDown(4, e)} />
                  <ResizableHeader title="Hora" width={colWidths[5]} onResizeStart={(e) => handleMouseDown(5, e)} />
                </div>
                <AnimatePresence initial={false}>
                  {filteredEntries.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={i === 0 ? { opacity: 0, y: -12, scale: 0.98 } : undefined}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      onClick={() => setSelectedEntry(entry)}
                      className={cn(
                        "group grid gap-2 px-4 py-2.5 border-b border-border/20 text-xs items-center transition-colors cursor-pointer hover:bg-muted/50",
                        entry.wafAction === "BLOCK" && "bg-red-500/[0.04]",
                        entry.wafAction === "MONITOR" && "bg-amber-500/[0.04]",
                        i === 0 && "bg-primary/[0.03]",
                      )}
                      style={gridStyle}
                    >
                      <WafActionBadge action={entry.wafAction} />

                      <MethodBadge method={entry.method} />

                      <div className="flex items-center gap-1 min-w-0 font-mono text-[12px]" title={entry.path + (entry.query ? `?${entry.query}` : "")}>
                        <span className="truncate text-foreground/90">{entry.path}</span>
                        {entry.query && (
                          <span className="text-muted-foreground/50 truncate">?{entry.query}</span>
                        )}
                        <CopyBtn value={entry.path} />
                      </div>

                      <div className="flex items-center gap-1 text-muted-foreground truncate" title={entry.ip}>
                        <Globe className="h-3 w-3 inline mr-1 align-middle shrink-0" />
                        <span className="font-mono text-[11px] truncate">{entry.ip}</span>
                        <CopyBtn value={entry.ip} />
                      </div>

                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
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

                      <div className="text-muted-foreground/60 font-mono text-[10px] text-right truncate">
                        {formatTime(entry.timestamp)}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-border/30 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground bg-card/50">
          <span>
            {searchQuery ? (
              <>{filteredEntries.length} / {entries.length} solicitudes &middot;</>
            ) : (
              <>Mostrando {entries.length} solicitudes &middot;</>
            )}{" "}
            WAF:{" "}
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

      <SidePanel 
        open={!!selectedEntry} 
        onClose={() => setSelectedEntry(null)}
        title="Detalles de la Solicitud"
        subtitle="Información técnica completa sobre el request capturado por el WAF."
        icon={<Activity className="h-4 w-4 text-primary" />}
      >
        <div className="space-y-10 mt-4">
          {selectedEntry && (
            <>
              {/* Bloque superior con información primaria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                
                {/* IP */}
                <div className="flex flex-col gap-1.5 group">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> Origen (IP)
                  </span>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-light tracking-tight text-foreground/90">
                      {selectedEntry.ip}
                    </span>
                    {selectedEntry.country && (
                      <span className="text-xs font-medium text-muted-foreground/60 mb-1.5">
                        &middot; {selectedEntry.country}
                      </span>
                    )}
                    <div className="mb-1.5 ml-1"><CopyBtn value={selectedEntry.ip} /></div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Marca de Tiempo
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-medium text-foreground/80">
                      {new Date(selectedEntry.timestamp).toLocaleString("es-CO", { 
                        dateStyle: "medium", 
                        timeStyle: "medium" 
                      })}
                    </span>
                  </div>
                </div>

                {/* URL */}
                <div className="flex flex-col gap-2.5 md:col-span-2 group">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                    <LinkIcon className="h-3 w-3" /> Petición HTTP
                  </span>
                  <div className="flex items-center gap-3">
                    <MethodBadge method={selectedEntry.method} />
                    <span className="text-[13px] font-mono tracking-tight text-foreground/80 break-all">
                      {selectedEntry.path}
                      {selectedEntry.query && (
                        <span className="text-muted-foreground/40">?{selectedEntry.query}</span>
                      )}
                    </span>
                    <CopyBtn value={selectedEntry.path + (selectedEntry.query ? `?${selectedEntry.query}` : "")} />
                  </div>
                </div>

                {/* User Agent */}
                <div className="flex flex-col gap-2.5 md:col-span-2 group">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                    <Monitor className="h-3 w-3" /> User-Agent
                  </span>
                  <div className="flex items-start gap-2 border-l-2 border-primary/20 pl-4 py-1">
                    <p className="text-sm font-light text-muted-foreground/70 leading-relaxed italic">
                      {selectedEntry.userAgent || "No provisto por el cliente"}
                    </p>
                    {selectedEntry.userAgent && <div className="mt-0.5"><CopyBtn value={selectedEntry.userAgent} /></div>}
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-border/0 via-border/50 to-border/0" />

              {/* Bloque WAF */}
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                  <Shield className="h-3 w-3" /> Resolución del WAF
                </span>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/5 rounded-2xl p-4 sm:p-5 border border-border/20 shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="scale-110">
                      <WafActionBadge action={selectedEntry.wafAction} />
                    </div>
                    <div className="hidden sm:block h-10 w-px bg-border/40" />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Reglas Detonadas</span>
                      {selectedEntry.wafRules.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedEntry.wafRules.map((r) => (
                            <span key={r} className="text-[11px] font-mono font-medium text-destructive/90 bg-destructive/5 px-2.5 py-0.5 rounded-full border border-destructive/20">{r}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600/70 font-medium tracking-tight">Tráfico limpio, sin detecciones.</span>
                      )}
                    </div>
                  </div>
                  <div className="sm:text-right border-t border-border/10 sm:border-t-0 pt-3 sm:pt-0">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest block mb-1">Latencia</span>
                    <span className="font-mono text-xs text-foreground/60">{selectedEntry.elapsedMs}ms</span>
                  </div>
                </div>
              </div>

              {/* Headers Table */}
              {selectedEntry.headers && Object.keys(selectedEntry.headers).length > 0 && (
                <div className="flex flex-col gap-3 pb-8">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                    <Server className="h-3 w-3" /> Cabeceras (Headers)
                  </span>
                  <div className="rounded-xl border border-border/20 bg-muted/5 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <tbody>
                        {Object.entries(selectedEntry.headers).map(([key, val], idx) => (
                          <tr key={key} className={cn("border-b border-border/10 last:border-0", idx % 2 === 0 ? "bg-transparent" : "bg-muted/30")}>
                            <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground/80 w-1/3 break-all font-medium">
                              {key}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-foreground/80 break-all">
                              {String(val)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SidePanel>
    </div>
  );
}
