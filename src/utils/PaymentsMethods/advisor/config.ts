import { UserCheck } from "lucide-react";
import { PaymentMethodConfig } from "../types";

export const AdvisorConfig: PaymentMethodConfig = {
  id: "advisor",
  icon: UserCheck,
  color: "#10B981", // Emerald green represents trust, sustainability and validation
  bgColor: "bg-[#10B981]/10",
  labelKey: "paymentOptionAdvisor",
  isMute: false,
};
