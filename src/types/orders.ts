export const PedidoEstado = {
  PENDIENTE: "PENDIENTE",
  CONFIRMADO: "CONFIRMADO",
  EN_PREPARACION: "EN_PREPARACION",
  EN_CAMINO: "EN_CAMINO",
  ENTREGADO: "ENTREGADO",
  CANCELADO: "CANCELADO",
} as const;

export type PedidoEstado = keyof typeof PedidoEstado;
