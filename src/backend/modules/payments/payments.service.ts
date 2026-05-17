import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { ordersService } from '@/backend/modules/orders';
import { PedidoEstado } from '@prisma/client';

// Initialize MercadoPago configuration
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: { timeout: 5000 }
});

export class PaymentsService {
  async createPreference(
    pedidoId: string,
    items: {
      id: string;
      title: string;
      quantity: number;
      unit_price: number;
      currency_id?: string;
    }[],
    payerInfo: {
      name: string;
      email: string;
    }
  ) {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    }

    try {
      const preference = new Preference(client);
      
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
      const isHttps = appUrl.startsWith("https");

      const body = {
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          currency_id: item.currency_id || "COP", // Adjust according to country
        })),
        payer: {
          name: payerInfo.name,
          email: payerInfo.email,
        },
        back_urls: {
          success: `${appUrl}/pedidos/${pedidoId}?status=success`,
          failure: `${appUrl}/checkout?status=failure`,
          pending: `${appUrl}/pedidos/${pedidoId}?status=pending`,
        },
        ...(isHttps ? { auto_return: "approved" } : {}),
        external_reference: pedidoId, // We link MP with our order ID
        ...(isHttps ? { notification_url: `${appUrl}/api/webhooks/mercadopago` } : {}),
      };

      const result = await preference.create({ body });
      return result;
    } catch (error) {
      console.error("MercadoPago Preference Error:", error);
      throw new Error("No se pudo crear la preferencia de pago en MercadoPago");
    }
  }

  async processNotification(paymentId: string) {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    }

    try {
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: paymentId });
      
      const pedidoId = paymentInfo.external_reference;
      const status = paymentInfo.status;

      if (!pedidoId) {
        throw new Error("external_reference not found in payment details");
      }

      console.log(`MercadoPago webhook payment status update: Order ${pedidoId} is ${status}`);

      if (status === "approved") {
        // Update order status to CONFIRMADO
        await ordersService.updateEstado(pedidoId, PedidoEstado.CONFIRMADO);
        // Save the payment ID
        await ordersService.updatePedido(pedidoId, {
          pagoId: paymentId
        } as any);
      } else if (status === "rejected" || status === "cancelled") {
        // Update order status to CANCELADO
        await ordersService.updateEstado(pedidoId, PedidoEstado.CANCELADO, `Pago rechazado o cancelado en MercadoPago. Status: ${status}`);
      }

      return { success: true, pedidoId, status };
    } catch (error) {
      console.error("Error processing MercadoPago webhook:", error);
      throw error;
    }
  }
}

export const paymentsService = new PaymentsService();

