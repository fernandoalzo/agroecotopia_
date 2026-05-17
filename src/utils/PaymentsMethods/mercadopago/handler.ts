import { PaymentHandler, PaymentHandlerContext } from "../types";
import { createMercadoPagoPreferenceAction } from "@/backend/modules/payments/payments.actions";
import { toast } from "sonner";

export class MercadoPagoPaymentHandler implements PaymentHandler {
  async process({ pedidoId, clearCart }: PaymentHandlerContext): Promise<void> {
    try {
      const mpResult = await createMercadoPagoPreferenceAction(pedidoId);
      
      if ("error" in mpResult) {
        toast.error("Error al iniciar el pago con Mercado Pago", {
          description: mpResult.error
        });
        return;
      }

      if (mpResult.initPoint) {
        clearCart();
        toast.success("Redirigiendo a Mercado Pago para completar tu pago...");
        window.location.href = mpResult.initPoint;
      } else {
        toast.error("No se pudo obtener la pasarela de pago");
      }
    } catch (error) {
      console.error("MercadoPago Handler Error:", error);
      toast.error("Ocurrió un error inesperado al iniciar Mercado Pago");
    }
  }
}
