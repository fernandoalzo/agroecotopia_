import { PaymentHandler, PaymentHandlerContext } from "../types";
import { createMercadoPagoPreferenceAction } from "@/backend/modules/payments/payments.actions";
import { toast } from "sonner";
import logger from "@/utils/logger";

const log = logger.child("src/utils/PaymentsMethods/mercadopago/handler.ts");

export class MercadoPagoPaymentHandler implements PaymentHandler {
  async process({ pedidoId, clearCart }: PaymentHandlerContext): Promise<void> {
    try {
      log.info("Iniciando procesamiento de pago con Mercado Pago para el pedido:", { pedidoId });
      const mpResult = await createMercadoPagoPreferenceAction(pedidoId);
      
      if ("error" in mpResult) {
        log.error("Error al crear la preferencia de Mercado Pago para el pedido:", { pedidoId, error: mpResult.error });
        toast.error("Error al iniciar el pago con Mercado Pago", {
          description: mpResult.error
        });
        return;
      }

      if (mpResult.initPoint) {
        log.info("Preferencia de Mercado Pago creada con éxito para el pedido. Redirigiendo...", { pedidoId, initPoint: mpResult.initPoint });
        clearCart();
        log.debug("Carrito de compras limpiado para el pedido:", { pedidoId });
        toast.success("Redirigiendo a Mercado Pago para completar tu pago...");
        window.location.href = mpResult.initPoint;
      } else {
        log.error("No se obtuvo la pasarela de pago (initPoint ausente) para el pedido:", { pedidoId, mpResult });
        toast.error("No se pudo obtener la pasarela de pago");
      }
    } catch (error) {
      log.error("Error inesperado en MercadoPagoPaymentHandler para el pedido:", { pedidoId, error });
      toast.error("Ocurrió un error inesperado al iniciar Mercado Pago");
    }
  }
}
