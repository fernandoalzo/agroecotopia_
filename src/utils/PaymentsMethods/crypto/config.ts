import { Bitcoin } from "lucide-react";
import { PaymentMethodConfig } from "../types";

export const CryptoConfig: PaymentMethodConfig = {
  id: "crypto",
  icon: Bitcoin,
  color: "#f97316", // Orange 500
  bgColor: "bg-orange-500/10",
  labelKey: "paymentOptionCrypto",
  isMute: false,
};
