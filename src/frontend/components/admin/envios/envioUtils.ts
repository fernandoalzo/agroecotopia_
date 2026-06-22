import {
  Package,
  Truck,
  Plane,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

export type EnvioEstadoKey = "PREPARANDO" | "DESPACHADO" | "EN_TRANSITO" | "EN_REPARTO" | "ENTREGADO" | "FALLIDO" | "DEVUELTO";

export const envioStatusConfig: Record<EnvioEstadoKey, {
  labelEs: string;
  labelEn: string;
  color: string;
  bgColor: string;
  borderColor: string;
  barColor: string;
  glowColor: string;
  cardBorderClass: string;
  hoverClasses: string;
  icon: LucideIcon;
}> = {
  PREPARANDO: {
    labelEs: "Preparando",
    labelEn: "Preparing",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    barColor: "bg-gradient-to-b from-amber-400 to-amber-600",
    glowColor: "shadow-[2px_0_12px_rgba(245,158,11,0.3)] lg:shadow-[2px_0_15px_rgba(245,158,11,0.25)]",
    cardBorderClass: "border-amber-500/20 bg-amber-500/[0.01]",
    hoverClasses: "hover:border-amber-500/50 hover:shadow-[0_10px_35px_-5px_rgba(245,158,11,0.25)] hover:bg-amber-500/10 dark:hover:bg-amber-500/15",
    icon: Package,
  },
  DESPACHADO: {
    labelEs: "Despachado",
    labelEn: "Dispatched",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    barColor: "bg-gradient-to-b from-blue-400 to-blue-600",
    glowColor: "shadow-[2px_0_12px_rgba(59,130,246,0.3)] lg:shadow-[2px_0_15px_rgba(59,130,246,0.25)]",
    cardBorderClass: "border-blue-500/20 bg-blue-500/[0.01]",
    hoverClasses: "hover:border-blue-500/50 hover:shadow-[0_10px_35px_-5px_rgba(59,130,246,0.25)] hover:bg-blue-500/10 dark:hover:bg-blue-500/15",
    icon: Truck,
  },
  EN_TRANSITO: {
    labelEs: "En Tránsito",
    labelEn: "In Transit",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    barColor: "bg-gradient-to-b from-indigo-400 to-indigo-600",
    glowColor: "shadow-[2px_0_12px_rgba(99,102,241,0.3)] lg:shadow-[2px_0_15px_rgba(99,102,241,0.25)]",
    cardBorderClass: "border-indigo-500/20 bg-indigo-500/[0.01]",
    hoverClasses: "hover:border-indigo-500/50 hover:shadow-[0_10px_35px_-5px_rgba(99,102,241,0.25)] hover:bg-indigo-500/10 dark:hover:bg-indigo-500/15",
    icon: Plane,
  },
  EN_REPARTO: {
    labelEs: "En Reparto",
    labelEn: "Out for Delivery",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    barColor: "bg-gradient-to-b from-purple-400 to-purple-600",
    glowColor: "shadow-[2px_0_12px_rgba(168,85,247,0.3)] lg:shadow-[2px_0_15px_rgba(168,85,247,0.25)]",
    cardBorderClass: "border-purple-500/20 bg-purple-500/[0.01]",
    hoverClasses: "hover:border-purple-500/50 hover:shadow-[0_10px_35px_-5px_rgba(168,85,247,0.25)] hover:bg-purple-500/10 dark:hover:bg-purple-500/15",
    icon: MapPin,
  },
  ENTREGADO: {
    labelEs: "Entregado",
    labelEn: "Delivered",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    barColor: "bg-gradient-to-b from-emerald-400 to-emerald-600",
    glowColor: "shadow-[2px_0_12px_rgba(16,185,129,0.3)] lg:shadow-[2px_0_15px_rgba(16,185,129,0.25)]",
    cardBorderClass: "border-emerald-500/20 bg-emerald-500/[0.01]",
    hoverClasses: "hover:border-emerald-500/50 hover:shadow-[0_10px_35px_-5px_rgba(16,185,129,0.25)] hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15",
    icon: CheckCircle2,
  },
  FALLIDO: {
    labelEs: "Fallido",
    labelEn: "Failed",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    barColor: "bg-gradient-to-b from-red-400 to-red-600",
    glowColor: "shadow-[2px_0_12px_rgba(239,68,68,0.3)] lg:shadow-[2px_0_15px_rgba(239,68,68,0.25)]",
    cardBorderClass: "border-red-500/20 bg-red-500/[0.01]",
    hoverClasses: "hover:border-red-500/50 hover:shadow-[0_10px_35px_-5px_rgba(239,68,68,0.25)] hover:bg-red-500/10 dark:hover:bg-red-500/15",
    icon: AlertTriangle,
  },
  DEVUELTO: {
    labelEs: "Devuelto",
    labelEn: "Returned",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    borderColor: "border-slate-200 dark:border-slate-800",
    barColor: "bg-gradient-to-b from-slate-400 to-slate-600",
    glowColor: "shadow-[2px_0_12px_rgba(100,116,139,0.3)] lg:shadow-[2px_0_15px_rgba(100,116,139,0.25)]",
    cardBorderClass: "border-slate-500/20 bg-slate-500/[0.01]",
    hoverClasses: "hover:border-slate-500/50 hover:shadow-[0_10px_35px_-5px_rgba(100,116,139,0.25)] hover:bg-slate-500/10 dark:hover:bg-slate-500/15",
    icon: RotateCcw,
  },
};

export const nextValidStatuses: Record<EnvioEstadoKey, EnvioEstadoKey[]> = {
  PREPARANDO: ["DESPACHADO", "ENTREGADO", "FALLIDO"],
  DESPACHADO: ["EN_TRANSITO", "ENTREGADO", "FALLIDO", "DEVUELTO"],
  EN_TRANSITO: ["EN_REPARTO", "ENTREGADO", "FALLIDO", "DEVUELTO"],
  EN_REPARTO: ["ENTREGADO", "FALLIDO", "DEVUELTO"],
  ENTREGADO: [],
  FALLIDO: ["EN_REPARTO", "DEVUELTO"],
  DEVUELTO: [],
};

export const allEnvioStatuses: EnvioEstadoKey[] = [
  "PREPARANDO",
  "DESPACHADO",
  "EN_TRANSITO",
  "EN_REPARTO",
  "ENTREGADO",
  "FALLIDO",
  "DEVUELTO",
];
