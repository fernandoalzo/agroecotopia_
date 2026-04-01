import { MessageSquare } from "lucide-react";
import { PaymentMethodConfig } from "./types";
import { CheckoutValues } from "@/lib/validations/checkout.schema";
import { CartItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import { Translations } from "@/architecture/languages/types";

export const WhatsAppConfig: PaymentMethodConfig = {
  id: "whatsapp",
  icon: MessageSquare,
  color: "#25D366",
  bgColor: "bg-[#25D366]/10",
  labelKey: "paymentOptionWhatsApp",
  isMute: false,
};

interface GenerateMessageParams {
  values: CheckoutValues;
  cart: CartItem[];
  totalPrice: number;
  language: string;
  t: Translations;
}

export const generateWhatsAppUrl = ({ values, cart, totalPrice, language, t }: GenerateMessageParams): string => {
  // 1. Format order items text
  const orderItemsText = cart.map((item) => {
    // Type casting to any here since the exact structure of t.products.items is dynamic based on slugs
    const productTranslation = (t.products.items as any)[item.product.slug] || {
      name: item.product.name,
      unit: item.product.unidad
    };
    return `• ${productTranslation.name} (x${item.quantity} ${productTranslation.unit}) - ${formatPrice(item.product.price)}`;
  }).join("\n");

  // 2. Calculate totals
  const formattedTotal = new Intl.NumberFormat(language === 'es' ? "es-CO" : "en-US", {
    style: "currency",
    currency: language === 'es' ? "COP" : "USD",
    maximumFractionDigits: 0,
  }).format(totalPrice);

  // 3. Construct WhatsApp Message
  const message = 
    `🛒 *NUEVO PEDIDO DE AGROECOTOPIA*\n` +
    `━━━━━━━━━━━━━━━━\n\n` +
    `👤 *DATOS DEL CLIENTE*\n` +
    `• Nombre: ${values.fullName}\n` +
    `• Email: ${values.email}\n` +
    `• Teléfono: ${values.phone}\n\n` +
    `📍 *DIRECCIÓN DE ENVÍO*\n` +
    `• Ciudad: ${values.city}\n` +
    `• Dirección: ${values.address}\n` +
    (values.notes ? `• Notas: ${values.notes}\n` : "") +
    `\n📦 *PRODUCTOS*\n` +
    orderItemsText +
    `\n\n━━━━━━━━━━━━━━━━\n` +
    `💰 *TOTAL DEL PEDIDO: ${formattedTotal}*\n` +
    `━━━━━━━━━━━━━━━━\n\n` +
    `✅ *El pedido ha sido confirmado. ¡Gracias por confiar en nosotros!*`;

  const encodedMessage = encodeURIComponent(message);
  
  // WhatsApp number for Agroecotopia
  return `https://wa.me/573126690108?text=${encodedMessage}`;
};
