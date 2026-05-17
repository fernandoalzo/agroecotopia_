import { Wallet } from "lucide-react";
import { PaymentMethodConfig } from "../types";

export const NequiConfig: PaymentMethodConfig = {
  id: "nequi",
  icon: Wallet,
  color: "#7000FF",
  bgColor: "bg-[#643484]/10",
  labelKey: "paymentOptionNequi",
  isMute: true,
};
