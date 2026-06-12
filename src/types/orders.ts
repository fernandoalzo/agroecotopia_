export const PedidoEstado = {
  PENDIENTE: "PENDIENTE",
  CONFIRMADO: "CONFIRMADO",
  EN_PREPARACION: "EN_PREPARACION",
  EN_BODEGA: "EN_BODEGA",
  ENTREGADO: "ENTREGADO",
  CANCELADO: "CANCELADO",
} as const;

export type PedidoEstado = keyof typeof PedidoEstado;
