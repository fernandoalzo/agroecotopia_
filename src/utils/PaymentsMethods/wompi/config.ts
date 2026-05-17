import { Layers } from "lucide-react";
import { PaymentMethodConfig } from "../types";

export const WompiConfig: PaymentMethodConfig = {
  id: "wompi",
  icon: Layers,
  color: "#97BF0F",
  bgColor: "bg-[#97BF0F]/10",
  labelKey: "paymentOptionWompi",
  isMute: true,
};
