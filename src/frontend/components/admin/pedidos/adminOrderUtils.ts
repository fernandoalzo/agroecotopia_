import { Package, Clock, CheckCircle2, Truck, Timer, XCircle } from "lucide-react";
import { PedidoEstado } from "@/types";

export interface AdminOrder {
  id: string;
  estado: PedidoEstado;
  fechaPedido: Date;
  total: number;
  direccionEntrega: string;
  usuario?: {
    id: string;
    name: string | null;
    email: string | null;
  };
  detalles: {
    id: string;
    storeId?: string | null;
    cantidad: number;
    precioUnitario: number;
    producto: {
      name: string;
      images: string[];
    };
  }[];
}

export const statusConfig = {
  [PedidoEstado.PENDIENTE]: {
    label: "Pendiente",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    barColor: "bg-gradient-to-b from-amber-400 to-amber-600",
    glowColor: "shadow-[2px_0_12px_rgba(245,158,11,0.3)] lg:shadow-[2px_0_15px_rgba(245,158,11,0.25)]",
    cardBorderClass: "border-amber-500/20 bg-amber-500/[0.01]",
    hoverClasses: "hover:border-amber-500/40 hover:shadow-[0_10px_35px_-5px_rgba(245,158,11,0.15)] hover:bg-amber-500/[0.03]",
    btnClass: "bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-black hover:border-amber-500/50 hover:shadow-[0_4px_12px_rgba(245,158,11,0.2)]",
    icon: Clock,
  },
  [PedidoEstado.CONFIRMADO]: {
    label: "Confirmado",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    barColor: "bg-gradient-to-b from-blue-400 to-blue-600",
    glowColor: "shadow-[2px_0_12px_rgba(59,130,246,0.3)] lg:shadow-[2px_0_15px_rgba(59,130,246,0.25)]",
    cardBorderClass: "border-blue-500/20 bg-blue-500/[0.01]",
    hoverClasses: "hover:border-blue-500/40 hover:shadow-[0_10px_35px_-5px_rgba(59,130,246,0.15)] hover:bg-blue-500/[0.03]",
    btnClass: "bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-black hover:border-blue-500/50 hover:shadow-[0_4px_12px_rgba(59,130,246,0.2)]",
    icon: CheckCircle2,
  },
  [PedidoEstado.EN_PREPARACION]: {
    label: "En Preparación",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    barColor: "bg-gradient-to-b from-indigo-400 to-indigo-600",
    glowColor: "shadow-[2px_0_12px_rgba(99,102,241,0.3)] lg:shadow-[2px_0_15px_rgba(99,102,241,0.25)]",
    cardBorderClass: "border-indigo-500/20 bg-indigo-500/[0.01]",
    hoverClasses: "hover:border-indigo-500/40 hover:shadow-[0_10px_35px_-5px_rgba(99,102,241,0.15)] hover:bg-indigo-500/[0.03]",
    btnClass: "bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-black hover:border-indigo-500/50 hover:shadow-[0_4px_12px_rgba(99,102,241,0.2)]",
    icon: Timer,
  },
  [PedidoEstado.EN_CAMINO]: {
    label: "En Camino",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    barColor: "bg-gradient-to-b from-purple-400 to-purple-600",
    glowColor: "shadow-[2px_0_12px_rgba(168,85,247,0.3)] lg:shadow-[2px_0_15px_rgba(168,85,247,0.25)]",
    cardBorderClass: "border-purple-500/20 bg-purple-500/[0.01]",
    hoverClasses: "hover:border-purple-500/40 hover:shadow-[0_10px_35px_-5px_rgba(168,85,247,0.15)] hover:bg-purple-500/[0.03]",
    btnClass: "bg-purple-500/10 dark:bg-purple-500/5 border border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white dark:hover:bg-purple-500 dark:hover:text-black hover:border-purple-500/50 hover:shadow-[0_4px_12px_rgba(168,85,247,0.2)]",
    icon: Truck,
  },
  [PedidoEstado.ENTREGADO]: {
    label: "Entregado",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    barColor: "bg-gradient-to-b from-emerald-400 to-emerald-600",
    glowColor: "shadow-[2px_0_12px_rgba(16,185,129,0.3)] lg:shadow-[2px_0_15px_rgba(16,185,129,0.25)]",
    cardBorderClass: "border-emerald-500/20 bg-emerald-500/[0.01]",
    hoverClasses: "hover:border-emerald-500/40 hover:shadow-[0_10px_35px_-5px_rgba(16,185,129,0.15)] hover:bg-emerald-500/[0.03]",
    btnClass: "bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-black hover:border-emerald-500/50 hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)]",
    icon: Package,
  },
  [PedidoEstado.CANCELADO]: {
    label: "Cancelado",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    barColor: "bg-gradient-to-b from-rose-400 to-rose-600",
    glowColor: "shadow-[2px_0_12px_rgba(244,63,94,0.3)] lg:shadow-[2px_0_15px_rgba(244,63,94,0.25)]",
    cardBorderClass: "border-rose-500/20 bg-rose-500/[0.01]",
    hoverClasses: "hover:border-rose-500/40 hover:shadow-[0_10px_35px_-5px_rgba(244,63,94,0.15)] hover:bg-rose-500/[0.03]",
    btnClass: "bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white hover:border-rose-500/50 hover:shadow-[0_4px_12px_rgba(244,63,94,0.2)]",
    icon: XCircle,
  },
};

export const getNextStatuses = (current: PedidoEstado): PedidoEstado[] => {
  switch (current) {
    case PedidoEstado.PENDIENTE:
      return [PedidoEstado.CONFIRMADO, PedidoEstado.CANCELADO];
    case PedidoEstado.CONFIRMADO:
      return [PedidoEstado.EN_PREPARACION, PedidoEstado.CANCELADO];
    case PedidoEstado.EN_PREPARACION:
      return [PedidoEstado.EN_CAMINO, PedidoEstado.CANCELADO];
    case PedidoEstado.EN_CAMINO:
      return [PedidoEstado.ENTREGADO, PedidoEstado.CANCELADO];
    default:
      return [];
  }
};
