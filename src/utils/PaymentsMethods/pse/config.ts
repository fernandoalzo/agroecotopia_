import { Landmark } from "lucide-react";
import { PaymentMethodConfig } from "../types";

export const PSEConfig: PaymentMethodConfig = {
  id: "pse",
  icon: Landmark,
  color: "#F47920",
  bgColor: "bg-[#F47920]/10",
  labelKey: "paymentOptionPSE",
  isMute: true,
};
