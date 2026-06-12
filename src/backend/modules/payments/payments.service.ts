import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { ordersService } from '@/backend/modules/orders';
import { PedidoEstado } from '@prisma/client';
import { config } from '@/config/config';
import logger from '@/utils/logger';
import { PaymentsRepository } from './payments.repository';

const log = logger.child("src/backend/modules/payments/payments.service.ts");

// Initialize MercadoPago configuration
const client = new MercadoPagoConfig({
  accessToken: config.mercadopago.accessToken,
  options: { timeout: 5000 }
});

export class PaymentsService {
  constructor(private paymentsRepository: PaymentsRepository) {}

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
    if (!config.mercadopago.accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    }

    try {
      const preference = new Preference(client);
      
      const appUrl = config.app.url;
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
      log.error("MercadoPago Preference Error:", error);
      throw new Error("No se pudo crear la preferencia de pago en MercadoPago");
    }
  }

  async processNotification(paymentId: string) {
    if (!config.mercadopago.accessToken) {
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

      log.info(`MercadoPago webhook payment status update: Order ${pedidoId} is ${status}`);

      if (status === "approved") {
        const admin = await this.paymentsRepository.findAdmin();
        const actorId = admin?.id as string;
        // Update order status to CONFIRMADO
        await ordersService.updateEstado(pedidoId, PedidoEstado.CONFIRMADO, actorId);
        // Save the payment ID
        await ordersService.updatePedido(pedidoId, {
          pagoId: paymentId
        } as any);
      } else if (status === "rejected" || status === "cancelled") {
        const admin = await this.paymentsRepository.findAdmin();
        const actorId = admin?.id as string;
        // Update order status to CANCELADO
        await ordersService.updateEstado(pedidoId, PedidoEstado.CANCELADO, actorId, `Pago rechazado o cancelado en MercadoPago. Status: ${status}`);
      }

      return { success: true, pedidoId, status };
    } catch (error) {
      log.error("Error processing MercadoPago webhook:", error);
      throw error;
    }
  }
}
