import { PaymentHandler, PaymentHandlerContext } from "../types";

/**
 * Handler para procesar pedidos a través de un Asesor de Ventas.
 * Registra la orden y muestra un mensaje informando que un colaborador
 * se pondrá en contacto pronto, redirigiendo a la vista del pedido.
 */
export class AdvisorPaymentHandler implements PaymentHandler {
  async process({ pedidoId, clearCart, router }: PaymentHandlerContext): Promise<void> {
    // 1. Limpiar el carrito de compras del cliente
    clearCart();

    // 2. Redirigir al usuario a la página estilizada de éxito del asesor, pasando el ID del pedido
    router.push(`/checkout/advisor-success?id=${pedidoId}`);
  }
}
