// Source: src/backend/prisma/schema/shipping.model.prisma
export const TipoTarifaEnvio = {
  TARIFA_FIJA: "TARIFA_FIJA",
  POR_PESO: "POR_PESO",
} as const;

export type TipoTarifaEnvio = keyof typeof TipoTarifaEnvio;
