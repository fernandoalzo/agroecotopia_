import { PaymentHandler, PaymentHandlerContext } from "../types";
import logger from "@/utils/logger";

const log = logger.child("src/utils/PaymentsMethods/advisor/handler.ts");

/**
 * Handler para procesar pedidos a través de un Asesor de Ventas.
 * Registra la orden y muestra un mensaje informando que un colaborador
 * se pondrá en contacto pronto, redirigiendo a la vista del pedido.
 */
export class AdvisorPaymentHandler implements PaymentHandler {
  async process({ pedidoId, pedidoIds, clearCart, router, cart, totalPrice, values }: PaymentHandlerContext): Promise<void> {
    try {
      log.info("Iniciando procesamiento de pago vía Asesor para el pedido:", { pedidoId, pedidoIds });

      const groupedByStore = new Map<string, typeof cart>();
      const storeMeta = new Map<string, { storeName: string; storeId: string }>();
      const storeOrder: string[] = [];

      cart.forEach((item) => {
        const storeId = item.product?.storeId || "sin-tienda";
        const storeName = item.product?.store?.name || "Tienda";
        if (!groupedByStore.has(storeId)) {
          groupedByStore.set(storeId, []);
          storeOrder.push(storeId);
          storeMeta.set(storeId, { storeId, storeName });
        }
        groupedByStore.get(storeId)!.push(item);
      });

      const buildSummary = (items: typeof cart, meta: { storeId: string; storeName: string }, pedidoRef: string) => {
        let content = `¡Hola! Estoy a la espera de un asesor para tomar mi pedido.\n\n`;
        content += `TIENDA: ${meta.storeName}\n`;
        content += `PEDIDO: ${pedidoRef}\n`;
        content += `===================\n\n`;
        content += `CANTIDAD\tPRODUCTO\t\tPRECIO UNIT.\tSUBTOTAL\n`;
        content += `--------\t--------\t\t------------\t--------\n`;
        let totalCalculado = 0;
        items.forEach((item: any) => {
          const itemName = item.product?.name || item.name || "Producto";
          const precioUnitario = item.product?.price || 0;
          const subtotal = item.quantity * precioUnitario;
          totalCalculado += subtotal;
          content += `${item.quantity}\t\t${itemName}\t\t$${precioUnitario.toLocaleString()}\t\t$${subtotal.toLocaleString()}\n`;
        });
        content += `\nTOTAL\t\t\t\t$${totalCalculado.toLocaleString()}\n`;
        if (values) {
          content += `\nINFORMACIÓN DE CONTACTO\n======================\n\n`;
          const name = values.fullName || "";
          const phone = values.phone || "";
          const email = values.email || "";
          const address = values.address || "";
          if (name) content += `Nombre: ${name}\n`;
          if (email) content += `Email: ${email}\n`;
          if (phone) content += `Teléfono: ${phone}\n`;
          if (address) content += `Dirección: ${address}\n`;
        }
        return content;
      };

      const advisorSummary = storeOrder.map((storeId, index) => {
        const meta = storeMeta.get(storeId) || { storeId, storeName: "Tienda" };
        const storeItems = groupedByStore.get(storeId) || [];
        return {
          pedidoId: pedidoIds?.[index] || pedidoId,
          storeId,
          storeName: meta.storeName,
          content: buildSummary(
            storeItems,
            meta,
            pedidoIds?.[index] || pedidoId
          ),
        };
      });
      
      // 1. Limpiar el carrito de compras del cliente
      clearCart();
      log.debug("Carrito de compras limpiado para el pedido:", { pedidoId });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "advisor-order-summary",
          JSON.stringify({
            orderId: pedidoId,
            summaries: advisorSummary,
          })
        );
      }
      // 2. Disparar evento para enviar mensaje automático por el chat
      if (typeof window !== "undefined") {
        const event = new CustomEvent("send_advisor_chat_message", {
          detail: { messages: advisorSummary }
        });
        window.dispatchEvent(event);
      }

      // 3. Redirigir al usuario a la página estilizada de éxito del asesor, pasando el ID del pedido
      log.info("Redirigiendo a la página de éxito del asesor para el pedido:", { pedidoId });
      const idsParam = pedidoIds && pedidoIds.length > 1 ? `&ids=${encodeURIComponent(pedidoIds.join(","))}` : "";
      router.push(`/checkout/advisor-success?id=${pedidoId}${idsParam}`);
    } catch (error) {
      log.error("Error inesperado en AdvisorPaymentHandler para el pedido:", { pedidoId, error });
    }
  }
}
