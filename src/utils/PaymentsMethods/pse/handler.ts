import { PaymentHandler, PaymentHandlerContext } from "../types";
import { toast } from "sonner";
import logger from "@/utils/logger";

const log = logger.child("src/utils/PaymentsMethods/pse/handler.ts");

export class PSEPaymentHandler implements PaymentHandler {
  async process({ pedidoId, clearCart, router, t }: PaymentHandlerContext): Promise<void> {
    try {
      log.info("Iniciando procesamiento de pago simulado con PSE para el pedido:", { pedidoId });
      
      clearCart();
      log.debug("Carrito de compras limpiado para el pedido:", { pedidoId });
      
      toast.success(t.checkout.processing, {
        description: t.checkout.paymentMuteNote,
      });
      
      log.info("Simulación de pago con PSE iniciada. Redirigiendo a inicio en 3 segundos...", { pedidoId });
      setTimeout(() => {
        log.info("Redirigiendo a la página de inicio tras pago exitoso con PSE para el pedido:", { pedidoId });
        router.push("/");
      }, 3000);
    } catch (error) {
      log.error("Error inesperado en PSEPaymentHandler para el pedido:", { pedidoId, error });
      toast.error("Ocurrió un error inesperado al procesar el pago con PSE");
    }
  }
}
