import { LucideIcon } from "lucide-react";
import { Translations } from "@/architecture/languages/types";

export interface PaymentMethodConfig {
  id: "whatsapp" | "nequi" | "mercadopago" | "pse" | "wompi";
  icon: LucideIcon;
  color: string;
  bgColor: string;
  labelKey: keyof Translations["checkout"];
  isMute: boolean;
}
