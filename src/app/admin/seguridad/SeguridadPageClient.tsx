"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, Trash2, Globe, Network, FileCode, Braces, Bot, Bug, CheckCircle, AlertTriangle, Radio, Activity, Check, X, Loader2 } from "lucide-react";
import type { WafRuleData, WafRuleRow, WafRuleType } from "@/types/waf";
import { WafMonitor } from "@/frontend/components/admin/seguridad/WafMonitor";
import type { WafRequestEntry } from "@/lib/waf/request-buffer";
import { Button } from "@/frontend/components/ui/button";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/frontend/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { Badge } from "@/frontend/components/ui/badge";
import { SidePanel } from "@/frontend/components/ui/side-panel";
import { Switch } from "@/frontend/components/ui/switch";
import { cn } from "@/lib/utils";

import { toast } from "sonner";

type ActionSet = {
  create: (data: WafRuleData) => Promise<{ success?: boolean; rule?: WafRuleRow; error?: string }>;
  delete: (id: string) => Promise<{ success?: boolean; error?: string }>;
  toggle: (id: string) => Promise<{ success?: boolean; rule?: WafRuleRow; error?: string }>;
  list?: () => Promise<{ success?: boolean; rules?: WafRuleRow[]; error?: string }>;
  getLog?: (page?: number, pageSize?: number) => Promise<{
    success: boolean;
    entries: WafRequestEntry[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>;
  clearLog?: () => Promise<{ success: boolean }>;
};

interface TypeConfigEntry {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  description: string;
  examples?: string[];
}

const TYPE_CONFIG: Record<string, TypeConfigEntry> = {
  IP_BLOCKLIST: {
    label: "IP Blocklist",
    icon: Network,
    placeholder: "1.2.3.4/32",
    description: "Bloquea direcciones IP individuales o rangos CIDR completos.",
    examples: ["192.168.1.100", "10.0.0.0/24", "172.16.0.0/16"],
  },
  GEO_BLOCK: {
    label: "Geoblock",
    icon: Globe,
    placeholder: "RU",
    description: "Bloquea tráfico proveniente de países usando códigos ISO 3166-1 alpha-2.",
    examples: ["RU", "CN", "KP"],
  },
  SENSITIVE_PATH: {
    label: "Ruta Sensible",
    icon: FileCode,
    placeholder: "/.env",
    description: "Bloquea el acceso a rutas específicas o archivos críticos.",
    examples: ["/.env", "/wp-admin", "/config.json", "/.git/config"],
  },
  METHOD_BLOCK: {
    label: "HTTP Method",
    icon: Braces,
    placeholder: "DELETE",
    description: "Bloquea métodos HTTP completos (ej. POST, DELETE, PUT, TRACE).",
    examples: ["DELETE", "TRACE", "OPTIONS"],
  },
  BOT_BLOCK: {
    label: "Bot Block",
    icon: Bot,
    placeholder: "nmap",
    description: "Bloquea User-Agents sospechosos, bots maliciosos o scanners.",
    examples: ["nmap", "sqlmap", "curl", "python-requests"],
  },
  BOT_KNOWN: {
    label: "Bot Conocido",
    icon: CheckCircle,
    placeholder: "googlebot",
    description: "Permite explícitamente bots conocidos ignorando otras reglas (Googlebot, Bingbot).",
    examples: ["googlebot", "bingbot", "yandexbot"],
  },
  BOT_EMPTY_UA: {
    label: "User-Agent Vacío",
    icon: AlertTriangle,
    placeholder: "true",
    description: "Bloquea peticiones que no tienen header User-Agent. Añade 'true' para activarlo.",
    examples: ["true"],
  },
  ATTACK_PATTERN: {
    label: "Patrón de Ataque",
    icon: Bug,
    placeholder: "(<script|onerror)",
    description: "Bloquea peticiones que contengan un patrón Regex malicioso (XSS, SQLi, etc).",
    examples: ["(<script|onerror)", "(union.*select|drop.*table)", "(\\/\\.\\.\\/|etc\\/passwd)"],
  },
  RATE_LIMIT: {
    label: "Rate Limit (Anti-DDoS L7)",
    icon: Activity,
    placeholder: '{"points": 100, "duration": 60, "blockDuration": 3600}',
    description: "Limita la cantidad de peticiones por IP en una ventana de tiempo. Se configura mediante una interfaz visual.",
  },
};

const TYPE_ORDER = ["IP_BLOCKLIST", "GEO_BLOCK", "SENSITIVE_PATH", "METHOD_BLOCK", "BOT_BLOCK", "BOT_KNOWN", "BOT_EMPTY_UA", "ATTACK_PATTERN", "RATE_LIMIT"];

function groupRulesByType(rules: WafRuleRow[]): Map<string, WafRuleRow[]> {
  const grouped = new Map<string, WafRuleRow[]>();
  for (const type of TYPE_ORDER) {
    grouped.set(type, []);
  }
  for (const rule of rules) {
    const existing = grouped.get(rule.type);
    if (existing) {
      existing.push(rule);
    } else {
      grouped.set(rule.type, [rule]);
    }
  }
  return grouped;
}

function RuleTypeIcon({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type];
  if (!cfg) return <Shield className="h-4 w-4" />;
  const Icon = cfg.icon;
  return <Icon className="h-4 w-4" />;
}

function AddRulePanel({ onCreate, type: defaultType, open, onClose }: { onCreate: (data: WafRuleData) => void; type?: WafRuleType; open: boolean; onClose: () => void }) {
  const [type, setType] = useState<string>(defaultType || "IP_BLOCKLIST");
  const [value, setValue] = useState("");
  const [rlPath, setRlPath] = useState("*");
  const [rlPoints, setRlPoints] = useState(100);
  const [rlDuration, setRlDuration] = useState(60);
  const [rlBlockDuration, setRlBlockDuration] = useState(3600);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const initialType = defaultType || "IP_BLOCKLIST";
      setType(initialType);
      setValue(initialType === "BOT_EMPTY_UA" ? "true" : "");
      setDescription("");
    }
  }, [open, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    let finalValue = value.trim();

    if (type === "RATE_LIMIT") {
      finalValue = JSON.stringify({
        path: rlPath.trim() || "*",
        points: Number(rlPoints),
        duration: Number(rlDuration),
        blockDuration: Number(rlBlockDuration)
      });
    }

    if (!finalValue) return;

    setSubmitting(true);
    try {
      await onCreate({ type: type as WafRuleType, value: finalValue, description: description.trim() || undefined });
      setValue("");
      setDescription("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const cfg = TYPE_CONFIG[type];

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Agregar Regla WAF"
      subtitle="Crea una nueva regla para el firewall de aplicación."
      icon={<Shield className="h-4 w-4 text-primary" />}
      footer={
        <div className="flex items-center gap-3 w-full">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="add-rule-form" className="flex-1" disabled={submitting || (type !== "RATE_LIMIT" && !value.trim())}>
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Guardando...
              </span>
            ) : (
              "Guardar Regla"
            )}
          </Button>
        </div>
      }
    >
      <form id="add-rule-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Regla */}
        <section>
          <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-3 flex items-center gap-2">
            <RuleTypeIcon type={type} />
            Tipo de Regla
          </h3>
          <Select
            value={type}
            onValueChange={(newType) => {
              setType(newType);
              setValue(newType === "BOT_EMPTY_UA" ? "true" : "");
            }}
          >
            <SelectTrigger id="type" className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_ORDER.map((t) => (
                <SelectItem key={t} value={t}>
                  <span className="flex items-center gap-2">
                    <RuleTypeIcon type={t} />
                    {TYPE_CONFIG[t]?.label || t}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cfg && (
            <div className="mt-3 rounded-xl bg-secondary/30 p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{cfg.description}</p>
            </div>
          )}
        </section>

        {/* Valor */}
        <section>
          <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-3">
            Valor
          </h3>
          <div className="space-y-3">
            {type === "BOT_EMPTY_UA" ? (
              <div className="flex items-center gap-3 bg-secondary/10 p-4 rounded-xl border border-border/50">
                <Switch
                  id="value"
                  checked={value === "true"}
                  onCheckedChange={(checked) => setValue(checked ? "true" : "false")}
                  className="data-[state=checked]:bg-emerald-500 data-[state=checked]:shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="value" className="text-sm font-semibold cursor-pointer">
                    {value === "true" ? "Regla Activada" : "Regla Desactivada"}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {value === "true" ? "Se bloquearán las peticiones sin User-Agent." : "Se permitirán las peticiones sin User-Agent."}
                  </p>
                </div>
              </div>
            ) : type === "RATE_LIMIT" ? (
              <div className="space-y-4 bg-secondary/10 p-4 rounded-xl border border-border/50">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Ruta / Path (Regex)</Label>
                  <Input
                    type="text"
                    placeholder="Ej: /api/auth/.* o *"
                    value={rlPath}
                    onChange={(e) => setRlPath(e.target.value)}
                    className="bg-background dark:bg-secondary/30 font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Usa <code className="bg-secondary/50 px-1 rounded">*</code> para aplicar a todo el tráfico, o usa regex para rutas específicas.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Peticiones Permitidas (Points)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={rlPoints}
                    onChange={(e) => setRlPoints(Number(e.target.value))}
                    className="bg-background dark:bg-secondary/30"
                  />
                  <p className="text-[10px] text-muted-foreground">Número de peticiones que una misma IP puede hacer a esta ruta.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Ventana de Tiempo (Segundos)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={rlDuration}
                    onChange={(e) => setRlDuration(Number(e.target.value))}
                    className="bg-background dark:bg-secondary/30"
                  />
                  <p className="text-[10px] text-muted-foreground">Tiempo en el cual se evalúan las peticiones (Ej: 60 = 1 minuto).</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Tiempo de Penalización (Segundos)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={rlBlockDuration}
                    onChange={(e) => setRlBlockDuration(Number(e.target.value))}
                    className="bg-background dark:bg-secondary/30"
                  />
                  <p className="text-[10px] text-muted-foreground">Tiempo que la IP estará bloqueada tras exceder el límite (Ej: 3600 = 1 hora).</p>
                </div>
              </div>
            ) : (
              <>
                <Input
                  id="value"
                  className="rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60"
                  placeholder={cfg?.placeholder || "Valor de la regla"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  autoFocus
                />
                {cfg?.examples && cfg.examples.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      Ejemplos válidos
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cfg.examples.map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          onClick={() => setValue(ex)}
                          className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs font-mono text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border/50"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Descripción */}
        <section>
          <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-3">
            Descripción (opcional)
          </h3>
          <Textarea
            id="desc"
            className="resize-none rounded-xl bg-background dark:bg-secondary/30 dark:border-border/60"
            placeholder="Motivo de la regla..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </section>
      </form>
    </SidePanel>
  );
}

const columnHelper = createColumnHelper<WafRuleRow>();

function RuleTypeSection({
  type,
  rules,
  onCreate,
  onToggle,
  onDelete,
}: {
  type: string;
  rules: WafRuleRow[];
  onCreate: (data: WafRuleData) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const cfg = TYPE_CONFIG[type];
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!cfg) return null;
  const Icon = cfg.icon;

  const columns = useMemo(() => [
    columnHelper.accessor("isEnabled", {
      header: "Estado",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full transition-all duration-300", 
            row.original.isEnabled 
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
              : "bg-muted-foreground/30"
          )} />
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors", 
            row.original.isEnabled ? "text-emerald-700 bg-emerald-500/10 dark:text-emerald-400" : "text-muted-foreground bg-secondary/60"
          )}>
            {row.original.isEnabled ? "Activa" : "Inactiva"}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("value", {
      header: "Regla",
      cell: ({ row }) => {
        const isRateLimit = row.original.type === "RATE_LIMIT";
        const val = isRateLimit ? (() => {
          try {
            const rl = JSON.parse(row.original.value);
            const p = rl.path || "*";
            return `[${p}] ${rl.points} req / ${rl.duration}s · ban ${rl.blockDuration}s`;
          } catch { return row.original.value; }
        })() : row.original.value;
        
        return (
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-mono text-[13px] font-medium text-foreground bg-secondary/30 px-2 py-0.5 rounded-md border border-border/30 w-fit max-w-[300px] sm:max-w-md xl:max-w-xl truncate">
              {val}
            </span>
            {row.original.description && (
              <p className="text-[12px] text-muted-foreground truncate max-w-[250px] sm:max-w-md">
                {row.original.description}
              </p>
            )}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const id = row.original.id;
        const isConfirming = confirmDeleteId === id;
        const isDeleting = deletingId === id;

        return (
          <div className="flex items-center justify-end opacity-100 sm:opacity-40 group-hover:opacity-100 focus-within:opacity-100 transition-opacity min-h-[32px] overflow-hidden">
            <AnimatePresence mode="wait">
              {isDeleting ? (
                <motion.div
                  key="deleting"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                  <span className="text-[11px] font-medium text-destructive">Eliminando…</span>
                </motion.div>
              ) : isConfirming ? (
                <motion.div 
                  key="confirm"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-secondary rounded-full"
                    onClick={() => setConfirmDeleteId(null)}
                    title="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-full"
                    onClick={async () => {
                      setConfirmDeleteId(null);
                      setDeletingId(id);
                      try {
                        await onDelete(id);
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    title="Confirmar eliminación"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  key="actions"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-3"
                >
                  <Switch 
                    checked={row.original.isEnabled} 
                    onCheckedChange={() => onToggle(row.original.id)} 
                    className="scale-90 data-[state=checked]:bg-emerald-500 data-[state=checked]:shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                    onClick={() => setConfirmDeleteId(id)}
                    title="Eliminar regla"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      },
    }),
  ], [onToggle, onDelete, confirmDeleteId, deletingId]);

  return (
    <div className="py-8 border-b border-border/40 last:border-0 first:pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/50 text-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground tracking-tight">{cfg.label}</h3>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <DataTable
          columns={columns}
          data={rules}
          emptyTitle="No hay reglas definidas"
          emptyDescription="Todas las peticiones relacionadas a esta categoría pasarán sin ser bloqueadas."
          emptyIcon={Shield}
          pageSize={Math.max(10, rules.length)}
          pageSizeOptions={[10, 25, 50, 100]}
          getRowClassName={() => "group"}
        />
      </div>
    </div>
  );
}

export function SeguridadPageClient({
  initialRules,
  actions,
}: {
  initialRules: WafRuleRow[];
  actions: ActionSet;
}) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [rules, setRules] = useState(initialRules);
  const [addPanelOpen, setAddPanelOpen] = useState(false);

  useEffect(() => {
    setRules(initialRules);
  }, [initialRules]);

  const refresh = useCallback(async () => {
    try {
      const res = await actions.list?.();
      if (res?.success && res.rules) setRules(res.rules);
    } catch { }
  }, [actions]);

  const createMutation = useMutation({
    mutationFn: actions.create,
    onSuccess: (res) => {
      if (res.success) {
        refresh();
        toast.success("Regla WAF creada");
      } else {
        toast.error(res.error || "Error al crear regla");
      }
    },
    onError: () => toast.error("Error al crear regla"),
  });

  const deleteMutation = useMutation({
    mutationFn: actions.delete,
    onSuccess: (res) => {
      if (res.success) {
        refresh();
        toast.success("Regla eliminada");
      } else {
        toast.error(res.error || "Error al eliminar regla");
      }
    },
    onError: () => toast.error("Error al eliminar regla"),
  });

  const toggleMutation = useMutation({
    mutationFn: actions.toggle,
    onSuccess: (res) => {
      if (res.success) {
        refresh();
        toast.success(res.rule?.isEnabled ? "Regla activada" : "Regla desactivada");
      }
    },
    onError: () => toast.error("Error al cambiar estado"),
  });

  const grouped = groupRulesByType(rules);
  const tabs = [
    { id: "all", label: "Todas", count: rules.length },
    ...TYPE_ORDER.map((type) => ({
      id: type,
      label: TYPE_CONFIG[type]?.label || type,
      count: grouped.get(type)?.length || 0,
    })),
    { id: "monitor", label: "Monitor", count: null as number | null },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 h-full max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Seguridad — WAF</h2>
            <p className="text-sm text-muted-foreground font-medium mt-1">Configuración y reglas del Web Application Firewall</p>
          </div>
        </div>
        <div className="flex items-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary/40 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            {rules.length} reglas
          </span>
        </div>
      </div>

      {/* Type tabs */}
      <div className="relative border-b border-border/40">
        <div className="flex gap-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 py-4 text-sm font-medium transition-colors whitespace-nowrap outline-none",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {tab.id === "monitor" && <Radio className={cn("h-4 w-4", isActive && "text-emerald-500 animate-pulse")} />}
                  {tab.label}
                  {tab.count !== null && (
                    <span className={cn(
                      "flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </span>
                
                {isActive && (
                  <motion.div
                    layoutId="active-tab-underline"
                    className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary rounded-t-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {activeTab === "monitor" ? (
          actions.getLog && actions.clearLog ? (
            <WafMonitor actions={{ getLog: actions.getLog, clearLog: actions.clearLog }} />
          ) : null
        ) : activeTab === "all" ? (
          TYPE_ORDER.map((type) => (
            <RuleTypeSection
              key={type}
              type={type}
              rules={grouped.get(type) || []}
              onCreate={(data) => createMutation.mutate(data)}
              onToggle={(id) => toggleMutation.mutate(id)}
              onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
            />
          ))
        ) : (
          <RuleTypeSection
            type={activeTab}
            rules={grouped.get(activeTab) || []}
            onCreate={(data) => createMutation.mutate(data)}
            onToggle={(id) => toggleMutation.mutate(id)}
            onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
          />
        )}
      </div>

      {/* FAB — hidden on monitor tab */}
      <AnimatePresence>
        {!addPanelOpen && activeTab !== "monitor" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              className="h-14 w-14 rounded-full shadow-2xl transition-transform hover:scale-105"
              size="icon"
              title="Agregar Regla"
              onClick={() => setAddPanelOpen(true)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Panel */}
      {activeTab !== "monitor" && (
        <AddRulePanel
          open={addPanelOpen}
          onClose={() => setAddPanelOpen(false)}
          onCreate={(data) => createMutation.mutate(data)}
          type={activeTab === "all" ? "IP_BLOCKLIST" : activeTab as WafRuleType}
        />
      )}
    </div>
  );
}
