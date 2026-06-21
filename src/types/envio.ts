// Source: src/backend/prisma/schema/envio.model.prisma
export const EnvioEstado = {
  PREPARANDO: "PREPARANDO",
  DESPACHADO: "DESPACHADO",
  EN_TRANSITO: "EN_TRANSITO",
  EN_REPARTO: "EN_REPARTO",
  ENTREGADO: "ENTREGADO",
  FALLIDO: "FALLIDO",
  DEVUELTO: "DEVUELTO",
} as const;

export type EnvioEstado = keyof typeof EnvioEstado;
