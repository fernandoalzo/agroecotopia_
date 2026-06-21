// Source: src/backend/prisma/schema/order.model.prisma
export const PedidoEstado = {
  PENDIENTE: "PENDIENTE",
  CONFIRMADO: "CONFIRMADO",
  EN_PREPARACION: "EN_PREPARACION",
  EN_CAMINO: "EN_CAMINO",
  EN_BODEGA: "EN_BODEGA",
  ENTREGADO: "ENTREGADO",
  CANCELADO: "CANCELADO",
} as const;

export type PedidoEstado = keyof typeof PedidoEstado;

// Source: src/backend/prisma/schema/order.model.prisma
export const TipoEntrega = {
  ENVIO: "ENVIO",
  RECOJO_EN_BODEGA: "RECOJO_EN_BODEGA",
} as const;

export type TipoEntrega = keyof typeof TipoEntrega;
