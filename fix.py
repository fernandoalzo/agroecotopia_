with open('src/frontend/components/admin/AdminOrdersList.tsx', 'r') as f:
    content = f.read()

# Replace the duplicate block
import re

# Find the first const statusConfig = { ... } duplicate block
start_idx = content.find('const statusConfig = {')
end_idx = content.find('const getNextStatuses', start_idx)

replacement = """const statusConfig = {
  [PedidoEstado.PENDIENTE]: {
    label: "Pendiente",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    barColor: "bg-gradient-to-b from-amber-400 to-amber-600",
    glowColor: "shadow-[2px_0_12px_rgba(245,158,11,0.3)] lg:shadow-[2px_0_15px_rgba(245,158,11,0.25)]",
    cardBorderClass: "border-amber-500/20 bg-amber-500/[0.01]",
    hoverClasses: "hover:border-amber-500/40 hover:shadow-[0_10px_35px_-5px_rgba(245,158,11,0.15)] hover:bg-amber-500/[0.03]",
    btnBase: "bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400",
    btnHover: { background: "#f59e0b", color: "#fff", borderColor: "rgba(245,158,11,0.5)", boxShadow: "0 4px 12px rgba(245,158,11,0.25)" } as React.CSSProperties,
    icon: Clock,
  },
  [PedidoEstado.CONFIRMADO]: {
    label: "Confirmado",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    barColor: "bg-gradient-to-b from-blue-400 to-blue-600",
    glowColor: "shadow-[2px_0_12px_rgba(59,130,246,0.3)] lg:shadow-[2px_0_15px_rgba(59,130,246,0.25)]",
    cardBorderClass: "border-blue-500/20 bg-blue-500/[0.01]",
    hoverClasses: "hover:border-blue-500/40 hover:shadow-[0_10px_35px_-5px_rgba(59,130,246,0.15)] hover:bg-blue-500/[0.03]",
    btnBase: "bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400",
    btnHover: { background: "#3b82f6", color: "#fff", borderColor: "rgba(59,130,246,0.5)", boxShadow: "0 4px 12px rgba(59,130,246,0.25)" } as React.CSSProperties,
    icon: CheckCircle2,
  },
  [PedidoEstado.EN_PREPARACION]: {
    label: "En Preparación",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    barColor: "bg-gradient-to-b from-indigo-400 to-indigo-600",
    glowColor: "shadow-[2px_0_12px_rgba(99,102,241,0.3)] lg:shadow-[2px_0_15px_rgba(99,102,241,0.25)]",
    cardBorderClass: "border-indigo-500/20 bg-indigo-500/[0.01]",
    hoverClasses: "hover:border-indigo-500/40 hover:shadow-[0_10px_35px_-5px_rgba(99,102,241,0.15)] hover:bg-indigo-500/[0.03]",
    btnBase: "bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400",
    btnHover: { background: "#6366f1", color: "#fff", borderColor: "rgba(99,102,241,0.5)", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" } as React.CSSProperties,
    icon: Timer,
  },
  [PedidoEstado.EN_CAMINO]: {
    label: "En Camino",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    barColor: "bg-gradient-to-b from-purple-400 to-purple-600",
    glowColor: "shadow-[2px_0_12px_rgba(168,85,247,0.3)] lg:shadow-[2px_0_15px_rgba(168,85,247,0.25)]",
    cardBorderClass: "border-purple-500/20 bg-purple-500/[0.01]",
    hoverClasses: "hover:border-purple-500/40 hover:shadow-[0_10px_35px_-5px_rgba(168,85,247,0.15)] hover:bg-purple-500/[0.03]",
    btnBase: "bg-purple-500/10 border border-purple-500/25 text-purple-600 dark:text-purple-400",
    btnHover: { background: "#a855f7", color: "#fff", borderColor: "rgba(168,85,247,0.5)", boxShadow: "0 4px 12px rgba(168,85,247,0.25)" } as React.CSSProperties,
    icon: Truck,
  },
  [PedidoEstado.ENTREGADO]: {
    label: "Entregado",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    barColor: "bg-gradient-to-b from-emerald-400 to-emerald-600",
    glowColor: "shadow-[2px_0_12px_rgba(16,185,129,0.3)] lg:shadow-[2px_0_15px_rgba(16,185,129,0.25)]",
    cardBorderClass: "border-emerald-500/20 bg-emerald-500/[0.01]",
    hoverClasses: "hover:border-emerald-500/40 hover:shadow-[0_10px_35px_-5px_rgba(16,185,129,0.15)] hover:bg-emerald-500/[0.03]",
    btnBase: "bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400",
    btnHover: { background: "#10b981", color: "#fff", borderColor: "rgba(16,185,129,0.5)", boxShadow: "0 4px 12px rgba(16,185,129,0.25)" } as React.CSSProperties,
    icon: Package,
  },
  [PedidoEstado.CANCELADO]: {
    label: "Cancelado",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    barColor: "bg-gradient-to-b from-rose-400 to-rose-600",
    glowColor: "shadow-[2px_0_12px_rgba(244,63,94,0.3)] lg:shadow-[2px_0_15px_rgba(244,63,94,0.25)]",
    cardBorderClass: "border-rose-500/20 bg-rose-500/[0.01]",
    hoverClasses: "hover:border-rose-500/40 hover:shadow-[0_10px_35px_-5px_rgba(244,63,94,0.15)] hover:bg-rose-500/[0.03]",
    btnBase: "bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400",
    btnHover: { background: "#f43f5e", color: "#fff", borderColor: "rgba(244,63,94,0.5)", boxShadow: "0 4px 12px rgba(244,63,94,0.25)" } as React.CSSProperties,
    icon: XCircle,
  },
};

"""
new_content = content[:start_idx] + replacement + content[end_idx:]

with open('src/frontend/components/admin/AdminOrdersList.tsx', 'w') as f:
    f.write(new_content)
