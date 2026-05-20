import { PaymentHandler, PaymentHandlerContext } from "../types";
import logger from "@/utils/logger";

const log = logger.child("src/utils/PaymentsMethods/advisor/handler.ts");

/**
 * Handler para procesar pedidos a través de un Asesor de Ventas.
 * Registra la orden y muestra un mensaje informando que un colaborador
 * se pondrá en contacto pronto, redirigiendo a la vista del pedido.
 */
export class AdvisorPaymentHandler implements PaymentHandler {
  async process({ pedidoId, clearCart, router }: PaymentHandlerContext): Promise<void> {
    try {
      log.info("Iniciando procesamiento de pago vía Asesor para el pedido:", { pedidoId });
      
      // 1. Limpiar el carrito de compras del cliente
      clearCart();
      log.debug("Carrito de compras limpiado para el pedido:", { pedidoId });

      // 2. Redirigir al usuario a la página estilizada de éxito del asesor, pasando el ID del pedido
      log.info("Redirigiendo a la página de éxito del asesor para el pedido:", { pedidoId });
      router.push(`/checkout/advisor-success?id=${pedidoId}`);
    } catch (error) {
      log.error("Error inesperado en AdvisorPaymentHandler para el pedido:", { pedidoId, error });
    }
  }
}
