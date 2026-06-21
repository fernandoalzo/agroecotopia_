"use client";

import React, { useState } from "react";
import {
  Activity,
  Globe,
  Clock,
  Link as LinkIcon,
  Monitor,
  Server as ServerIcon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";

import type { WafRequestEntry } from "@/lib/waf/request-buffer";
import { Badge } from "@/frontend/components/ui/badge";
import { SidePanel } from "@/frontend/components/ui/side-panel";
import { cn } from "@/lib/utils";

/* ─── Helpers (shared with WafMonitor table columns) ───── */

export function WafActionBadge({ action }: { action: WafRequestEntry["wafAction"] }) {
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

export function MethodBadge({ method }: { method: string }) {
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

export function CopyBtn({ value }: { value: string }) {
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
      onClick={(e) => {
        e.stopPropagation();
        handleCopy();
      }}
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

/* ─── WafRequestDetailPanel ────────────────────────────── */

interface WafRequestDetailPanelProps {
  entry: WafRequestEntry | null;
  onClose: () => void;
}

/**
 * Side panel that displays the full technical details of a WAF-captured request.
 * Extracted from WafMonitor for modularity and reusability.
 *
 * Renders inside the shared `SidePanel` primitive — same animation, backdrop, and layout
 * used across OrderDetailPanel, EnvioDetailPanel, etc.
 */
export function WafRequestDetailPanel({ entry, onClose }: WafRequestDetailPanelProps) {
  return (
    <SidePanel
      open={!!entry}
      onClose={onClose}
      title="Detalles de la Solicitud"
      subtitle="Información técnica completa sobre el request capturado por el WAF."
      icon={<Activity className="h-4 w-4 text-primary" />}
    >
      <div className="space-y-10 mt-4">
        {entry && (
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
                    {entry.ip}
                  </span>
                  {entry.country && (
                    <span className="text-xs font-medium text-muted-foreground/60 mb-1.5">
                      &middot; {entry.country}
                    </span>
                  )}
                  <div className="mb-1.5 ml-1"><CopyBtn value={entry.ip} /></div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Marca de Tiempo
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-medium text-foreground/80">
                    {new Date(entry.timestamp).toLocaleString("es-CO", {
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
                  <MethodBadge method={entry.method} />
                  <span className="text-[13px] font-mono tracking-tight text-foreground/80 break-all">
                    {entry.path}
                    {entry.query && (
                      <span className="text-muted-foreground/40">?{entry.query}</span>
                    )}
                  </span>
                  <CopyBtn value={entry.path + (entry.query ? `?${entry.query}` : "")} />
                </div>
              </div>

              {/* User Agent */}
              <div className="flex flex-col gap-2.5 md:col-span-2 group">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                  <Monitor className="h-3 w-3" /> User-Agent
                </span>
                <div className="flex items-start gap-2 border-l-2 border-primary/20 pl-4 py-1">
                  <p className="text-sm font-light text-muted-foreground/70 leading-relaxed italic">
                    {entry.userAgent || "No provisto por el cliente"}
                  </p>
                  {entry.userAgent && <div className="mt-0.5"><CopyBtn value={entry.userAgent} /></div>}
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
                    <WafActionBadge action={entry.wafAction} />
                  </div>
                  <div className="hidden sm:block h-10 w-px bg-border/40" />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Reglas Detonadas</span>
                    {entry.wafRules.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {entry.wafRules.map((r) => (
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
                  <span className="font-mono text-xs text-foreground/60">{entry.elapsedMs}ms</span>
                </div>
              </div>
            </div>

            {/* Headers Table */}
            {entry.headers && Object.keys(entry.headers).length > 0 && (
              <div className="flex flex-col gap-3 pb-8">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                  <ServerIcon className="h-3 w-3" /> Cabeceras (Headers)
                </span>
                <div className="rounded-xl border border-border/20 bg-muted/5 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <tbody>
                      {Object.entries(entry.headers).map(([key, val], idx) => (
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
  );
}
