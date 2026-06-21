"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, Trash2, ToggleLeft, ToggleRight, Globe, Network, FileCode, Braces, Bot, Bug, CheckCircle, AlertTriangle, X, Radio } from "lucide-react";
import type { WafRuleData, WafRuleRow, WafRuleType } from "@/types/waf";
import { WafMonitor } from "@/frontend/components/admin/seguridad/WafMonitor";
import type { WafRequestEntry } from "@/lib/waf/request-buffer";
import { Button } from "@/frontend/components/ui/button";
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
  getLog?: (count?: number) => Promise<{ success: boolean; entries: WafRequestEntry[] }>;
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
};

const TYPE_ORDER = ["IP_BLOCKLIST", "GEO_BLOCK", "SENSITIVE_PATH", "METHOD_BLOCK", "BOT_BLOCK", "BOT_KNOWN", "BOT_EMPTY_UA", "ATTACK_PATTERN"];

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
    if (!value.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({ type: type as WafRuleType, value: value.trim(), description: description.trim() || undefined });
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
          <Button type="submit" form="add-rule-form" className="flex-1" disabled={submitting || !value.trim()}>
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

function RuleRow({ rule, onToggle, onDelete }: { rule: WafRuleRow; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl border border-border/40 bg-background hover:bg-secondary/20 hover:border-border/60 transition-all group">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div className="flex flex-col items-center justify-center pt-1.5 sm:pt-0 shrink-0">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full transition-all duration-300", 
            rule.isEnabled 
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] ring-2 ring-emerald-500/20" 
              : "bg-muted-foreground/30 ring-2 ring-transparent"
          )} />
        </div>
        
        <div className="flex flex-col min-w-0 gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-foreground bg-secondary/40 px-2.5 py-0.5 rounded-md border border-border/50 truncate max-w-[200px] sm:max-w-xs">
              {rule.value}
            </span>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm", 
              rule.isEnabled ? "text-emerald-700 bg-emerald-500/10 dark:text-emerald-400" : "text-muted-foreground bg-secondary"
            )}>
              {rule.isEnabled ? "Activa (Bloqueando)" : "Inactiva"}
            </span>
          </div>
          {rule.description && (
            <p className="text-xs text-muted-foreground truncate max-w-[250px] sm:max-w-md">
              {rule.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto opacity-90 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border/50 bg-secondary/10">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {rule.isEnabled ? "ON" : "OFF"}
          </span>
          <Switch 
            checked={rule.isEnabled} 
            onCheckedChange={() => onToggle(rule.id)} 
            className="scale-90"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
          onClick={() => onDelete(rule.id)}
          title="Eliminar regla"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

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
  onDelete: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[type];
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm transition-all hover:shadow-md bg-card/50">
      <div className="bg-secondary/30 border-b border-border/50 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-background rounded-lg border border-border/50 shadow-sm text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">{cfg.label}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">
              {rules.length} {rules.length === 1 ? "Regla configurada" : "Reglas configuradas"}
            </p>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-secondary/10 rounded-xl border border-dashed border-border/50">
            <Shield className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No hay reglas definidas</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-sm">
              Todas las peticiones relacionadas a esta categoría pasarán sin ser bloqueadas.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <RuleRow key={rule.id} rule={rule} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
    } catch {}
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
    <div className="p-4 md:p-6 space-y-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Seguridad — WAF</h2>
          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{rules.length} reglas</span>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 overflow-x-auto border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.id === "monitor" && <Radio className="h-3 w-3" />}
            {tab.label}
            {tab.count !== null && <span>({tab.count})</span>}
          </button>
        ))}
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
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        ) : (
          <RuleTypeSection
            type={activeTab}
            rules={grouped.get(activeTab) || []}
            onCreate={(data) => createMutation.mutate(data)}
            onToggle={(id) => toggleMutation.mutate(id)}
            onDelete={(id) => deleteMutation.mutate(id)}
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
