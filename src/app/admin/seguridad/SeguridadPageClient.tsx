"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Shield, Plus, Trash2, ToggleLeft, ToggleRight, Globe, Network, FileCode, Braces, Bot, Bug, CheckCircle, AlertTriangle } from "lucide-react";
import type { WafRuleData, WafRuleRow, WafRuleType } from "@/backend/modules/waf";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/frontend/components/ui/dialog";
import { Badge } from "@/frontend/components/ui/badge";

import { toast } from "sonner";

type ActionSet = {
  create: (data: WafRuleData) => Promise<{ success?: boolean; rule?: WafRuleRow; error?: string }>;
  delete: (id: string) => Promise<{ success?: boolean; error?: string }>;
  toggle: (id: string) => Promise<{ success?: boolean; rule?: WafRuleRow; error?: string }>;
  list?: () => Promise<{ success?: boolean; rules?: WafRuleRow[]; error?: string }>;
};

interface TypeConfigEntry {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  description: string;
}

const TYPE_CONFIG: Record<string, TypeConfigEntry> = {
  IP_BLOCKLIST: {
    label: "IP Blocklist",
    icon: Network,
    placeholder: "1.2.3.4/32",
    description: "Bloquea direcciones IP o rangos CIDR",
  },
  GEO_BLOCK: {
    label: "Geoblock",
    icon: Globe,
    placeholder: "RU",
    description: "Bloquea países por código ISO 3166-1 alpha-2",
  },
  GEO_ALLOWLIST: {
    label: "Geo Allowlist",
    icon: Globe,
    placeholder: "CO",
    description: "Solo permite estos países (sobrescribe bloqueo)",
  },
  SENSITIVE_PATH: {
    label: "Ruta Sensible",
    icon: FileCode,
    placeholder: "/.env",
    description: "Bloquea acceso a rutas específicas",
  },
  METHOD_BLOCK: {
    label: "HTTP Method",
    icon: Braces,
    placeholder: "DELETE",
    description: "Bloquea métodos HTTP (POST, DELETE, PUT, PATCH)",
  },
  BOT_BLOCK: {
    label: "Bot Block",
    icon: Bot,
    placeholder: "nmap",
    description: "Bloquea User-Agent de scanners/bots específicos",
  },
  BOT_KNOWN: {
    label: "Bot Conocido",
    icon: CheckCircle,
    placeholder: "googlebot",
    description: "Permite bots conocidos (bypass para Googlebot, Bingbot, etc.)",
  },
  BOT_EMPTY_UA: {
    label: "User-Agent Vacío",
    icon: AlertTriangle,
    placeholder: "true",
    description: "Bloquea solicitudes sin User-Agent (actívalo agregando una regla con valor 'true')",
  },
  ATTACK_PATTERN: {
    label: "Patrón de Ataque",
    icon: Bug,
    placeholder: "(<script|onerror)",
    description: "Bloquea por patrón regex (SQLi, XSS, path traversal, etc.)",
  },
};

const TYPE_ORDER = ["IP_BLOCKLIST", "GEO_BLOCK", "GEO_ALLOWLIST", "SENSITIVE_PATH", "METHOD_BLOCK", "BOT_BLOCK", "BOT_KNOWN", "BOT_EMPTY_UA", "ATTACK_PATTERN"];

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

function AddRuleDialog({ onCreate, type: defaultType }: { onCreate: (data: WafRuleData) => void; type?: WafRuleType }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>(defaultType || "IP_BLOCKLIST");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!value.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({ type: type as WafRuleType, value: value.trim(), description: description.trim() || undefined });
      setValue("");
      setDescription("");
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const cfg = TYPE_CONFIG[type];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar Regla WAF</DialogTitle>
            <DialogDescription>
              Crea una nueva regla para el firewall de aplicación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Regla</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
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
            </div>
            {cfg && (
              <p className="text-sm text-muted-foreground">{cfg.description}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="value">Valor</Label>
              <Input
                id="value"
                placeholder={cfg?.placeholder || "Valor de la regla"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descripción (opcional)</Label>
              <Textarea
                id="desc"
                placeholder="Motivo de la regla..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !value.trim()}>
              {submitting ? "Guardando..." : "Guardar Regla"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RuleRow({ rule, onToggle, onDelete }: { rule: WafRuleRow; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{rule.value}</TableCell>
      <TableCell>
        <Badge variant={rule.isEnabled ? "default" : "secondary"} className="text-xs">
          {rule.isEnabled ? "Activa" : "Inactiva"}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
        {rule.description || "—"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggle(rule.id)}
            title={rule.isEnabled ? "Desactivar" : "Activar"}
          >
            {rule.isEnabled ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(rule.id)}
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {cfg.label}
          <Badge variant="outline" className="ml-2 text-xs">
            {rules.length}
          </Badge>
        </CardTitle>
        <AddRuleDialog onCreate={onCreate} type={type as WafRuleType} />
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No hay reglas de {cfg.label.toLowerCase()}. Agrega la primera.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Valor</TableHead>
                <TableHead className="w-[80px]">Estado</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <RuleRow key={rule.id} rule={rule} onToggle={onToggle} onDelete={onDelete} />
              ))}
            </TableBody>
          </Table>
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
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Seguridad — WAF</h2>
          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{rules.length} reglas</span>
        </div>
        <AddRuleDialog onCreate={(data) => createMutation.mutate(data)} />
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 overflow-x-auto border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {activeTab === "all" ? (
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
    </div>
  );
}
