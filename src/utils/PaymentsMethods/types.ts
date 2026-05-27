import { LucideIcon } from "lucide-react";
import { Translations } from "@/architecture/languages/types";
import { CheckoutValues } from "@/lib/validations/checkout.schema";
import { CartItem } from "@/types";

export interface PaymentMethodConfig {
  id: "advisor" | "nequi" | "mercadopago" | "pse" | "wompi";
  icon: LucideIcon;
  color: string;
  bgColor: string;
  labelKey: keyof Translations["checkout"];
  isMute: boolean;
}

export interface PaymentHandlerContext {
  pedidoId: string;
  pedidoIds?: string[];
  values: CheckoutValues;
  cart: CartItem[];
  totalPrice: number;
  language: string;
  t: Translations;
  clearCart: () => void;
  router: { push: (url: string) => void };
}

export interface PaymentHandler {
  process(context: PaymentHandlerContext): Promise<void>;
}
