import { PaymentHandler, PaymentHandlerContext } from "../types";
import logger from "@/utils/logger";

const log = logger.child("src/utils/PaymentsMethods/crypto/handler.ts");

export class CryptoPaymentHandler implements PaymentHandler {
  async process({ pedidoId, pedidoIds, clearCart, router, cart, values, transactionId }: PaymentHandlerContext): Promise<void> {
    try {
      log.info("Iniciando procesamiento de pago vía Cripto para el pedido:", { pedidoId, pedidoIds, transactionId });

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
        let content = `🧾 Pago con criptomonedas confirmado.\n\n`;
        content += `¡Hola! He realizado un pago con criptomonedas para mi pedido.\n\n`;
        content += `TIENDA: ${meta.storeName}\n`;
        content += `PEDIDO: ${pedidoRef}\n`;
        content += `===================\n\n`;
        let totalCalculado = 0;
        items.forEach((item: any) => {
          const itemName = item.product?.name || item.name || "Producto";
          const precioUnitario = item.product?.price || 0;
          const subtotal = item.quantity * precioUnitario;
          totalCalculado += subtotal;
          content += `• ${item.quantity}x ${itemName} — $${precioUnitario.toLocaleString()} c/u = $${subtotal.toLocaleString()}\n`;
        });
        content += `\nTOTAL: $${totalCalculado.toLocaleString()}\n`;
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

      const cryptoSummary = storeOrder.map((storeId, index) => {
        const meta = storeMeta.get(storeId) || { storeId, storeName: "Tienda" };
        const storeItems = groupedByStore.get(storeId) || [];
        return {
          pedidoId: pedidoIds?.[index] || pedidoId,
          storeId,
          storeName: meta.storeName,
          content: buildSummary(storeItems, meta, pedidoIds?.[index] || pedidoId),
        };
      });

      // 1. Enviar dos mensajes al asesor vía chat del pedido:
      //    - Primero: el resumen del pedido
      //    - Segundo: solo el ID de transacción (mensaje exclusivo)
      try {
        const { sendCryptoTransactionMessageAction } = await import("@/backend/modules/chat/chat.actions");

        // Mensaje 1: resumen del pedido sin TXID
        await sendCryptoTransactionMessageAction({ messages: cryptoSummary });
        log.info("Resumen de pedido cripto enviado al asesor:", { pedidoId });

        // Mensaje 2: solo el TXID como mensaje exclusivo
        if (transactionId) {
          const txMessages = storeOrder.map((storeId, index) => ({
            pedidoId: pedidoIds?.[index] || pedidoId,
            storeId,
            content: `${transactionId}`,
          }));
          await sendCryptoTransactionMessageAction({ messages: txMessages });
          log.info("TXID exclusivo enviado al asesor:", { pedidoId, transactionId });
        }
      } catch (chatError) {
        log.error("Error al enviar mensajes de transacción cripto al chat del pedido:", chatError);
      }

      // 2. Limpiar carrito
      clearCart();
      log.debug("Carrito de compras limpiado para el pedido:", { pedidoId });

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "crypto-order-summary",
          JSON.stringify({
            orderId: pedidoId,
            summaries: cryptoSummary,
            transactionId,
          })
        );
      }

      // 3. Redirigir a página de éxito
      log.info("Redirigiendo a la página de éxito de cripto para el pedido:", { pedidoId });
      const idsParam = pedidoIds && pedidoIds.length > 1 ? `&ids=${encodeURIComponent(pedidoIds.join(","))}` : "";
      router.push(`/checkout/crypto-success?id=${pedidoId}${idsParam}`);
    } catch (error) {
      log.error("Error inesperado en CryptoPaymentHandler para el pedido:", { pedidoId, error });
    }
  }
}
