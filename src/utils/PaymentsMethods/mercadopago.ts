import { CreditCard } from "lucide-react";
import { PaymentMethodConfig } from "./types";

export const MercadoPagoConfig: PaymentMethodConfig = {
  id: "mercadopago",
  icon: CreditCard,
  color: "#009EE3",
  bgColor: "bg-[#009EE3]/10",
  labelKey: "paymentOptionMercadoPago",
  isMute: true,
};
