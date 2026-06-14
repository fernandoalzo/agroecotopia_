import { PaymentHandler } from "./types";
import { AdvisorPaymentHandler } from "./advisor/handler";
import { MercadoPagoPaymentHandler } from "./mercadopago/handler";
import { NequiPaymentHandler } from "./nequi/handler";
import { PSEPaymentHandler } from "./pse/handler";
import { WompiPaymentHandler } from "./wompi/handler";
import { CryptoPaymentHandler } from "./crypto/handler";
import logger from "@/utils/logger";

const log = logger.child("src/utils/PaymentsMethods/factory.ts");

/**
 * Fábrica Centralizada de Procesadores de Pago (Payment Handlers).
 * Permite registrar y obtener el procesador adecuado de manera desacoplada.
 */
export class PaymentHandlerFactory {
  private static handlers: Record<string, PaymentHandler> = {
    advisor: new AdvisorPaymentHandler(),
    mercadopago: new MercadoPagoPaymentHandler(),
    nequi: new NequiPaymentHandler(),
    pse: new PSEPaymentHandler(),
    wompi: new WompiPaymentHandler(),
    crypto: new CryptoPaymentHandler(),
  };

  /**
   * Obtiene la instancia del procesador de pago correspondiente al identificador.
   * @param methodId Identificador del método de pago
   */
  static getHandler(methodId: string): PaymentHandler {
    log.debug(`Obteniendo procesador de pago para el método: ${methodId}`);
    const handler = this.handlers[methodId];
    if (!handler) {
      log.error(`Fallo al obtener el procesador. No se encontró un procesador registrado para el método: ${methodId}`);
      throw new Error(`No se encontró un procesador registrado para el método de pago: ${methodId}`);
    }
    return handler;
  }

  /**
   * Permite registrar dinámicamente nuevos métodos de pago en caliente.
   * @param methodId Identificador del método de pago
   * @param handler Instancia del procesador de pago
   */
  static registerHandler(methodId: string, handler: PaymentHandler): void {
    log.info(`Registrando dinámicamente procesador de pago para el método: ${methodId}`);
    this.handlers[methodId] = handler;
  }
}
