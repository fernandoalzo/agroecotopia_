import { PaymentMethodConfig } from "./types";
import { AdvisorConfig } from "./advisor/config";
import { NequiConfig } from "./nequi/config";
import { MercadoPagoConfig } from "./mercadopago/config";
import { PSEConfig } from "./pse/config";
import { WompiConfig } from "./wompi/config";
import { CryptoConfig } from "./crypto/config";

export * from "./types";
export * from "./advisor/index";
export * from "./nequi/index";
export * from "./mercadopago/index";
export * from "./pse/index";
export * from "./wompi/index";
export * from "./factory";

export * from "./crypto/index";

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  AdvisorConfig,
  MercadoPagoConfig,
  CryptoConfig,
];
