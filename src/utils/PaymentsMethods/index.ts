import { PaymentMethodConfig } from "./types";
import { WhatsAppConfig } from "./whatsapp";
import { NequiConfig } from "./nequi";
import { MercadoPagoConfig } from "./mercadopago";
import { PSEConfig } from "./pse";
import { WompiConfig } from "./wompi";

export * from "./types";
export * from "./whatsapp";
export * from "./nequi";
export * from "./mercadopago";
export * from "./pse";
export * from "./wompi";

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  WhatsAppConfig,
  NequiConfig,
  MercadoPagoConfig,
  PSEConfig,
  WompiConfig,
];
