import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { paymentsService } from "@/backend/modules/payments";
import logger from "@/utils/logger";
import { config } from "@/config/config";

const log = logger.child("src/app/api/webhooks/mercadopago/route.ts");

// ─────────────────────────────────────────────────────────────────────────────
// HMAC-SHA256 Signature Verification for MercadoPago Webhooks
// Docs: https://www.mercadopago.com.co/developers/es/docs/your-integrations/notifications/webhooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica la firma HMAC-SHA256 del webhook de MercadoPago.
 *
 * MercadoPago envía:
 *  - Header `x-signature`: "ts=1700000000,v1=abc123hexhash..."
 *  - Header `x-request-id`: "unique-request-uuid"
 *  - Query param `data.id`: ID del recurso notificado
 *
 * El manifest a firmar es: `id:{dataId};request-id:{xRequestId};ts:{ts};`
 * Se firma con HMAC-SHA256 usando el Webhook Secret del panel de integraciones.
 */
function verifyWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null,
  secret: string | null | undefined
): boolean {
  // Si no hay secret configurado, no podemos verificar
  if (!secret) {
    log.warn(
      "El store no tiene configurado un secret de MercadoPago. " +
      "La verificación HMAC está deshabilitada."
    );
    return true; // Permite pasar sin secret
  }

  if (!xSignature || !xRequestId || !dataId) {
    log.error("Webhook HMAC: Faltan headers o data.id requeridos para verificación.");
    return false;
  }

  // 1. Parsear x-signature → extraer ts y v1
  //    Formato: "ts=1700000000,v1=abc123hexhash..."
  const parts = xSignature.split(",");
  const signatureParts: Record<string, string> = {};

  for (const part of parts) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key && valueParts.length > 0) {
      signatureParts[key.trim()] = valueParts.join("=").trim();
    }
  }

  const ts = signatureParts["ts"];
  const receivedHash = signatureParts["v1"];

  if (!ts || !receivedHash) {
    log.error("Webhook HMAC: x-signature no contiene ts o v1 válidos.", { xSignature });
    return false;
  }

  // 2. Construir el manifest string (spec de MP)
  //    Formato exacto: "id:{dataId};request-id:{xRequestId};ts:{ts};"
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // 3. Generar HMAC-SHA256 con el secret
  const generatedHash = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  // 4. Comparación segura (timing-safe cuando ambos tienen mismo length)
  const isValid = generatedHash === receivedHash;

  if (!isValid) {
    log.error("Webhook HMAC: Firma inválida.", {
      expected: generatedHash,
      received: receivedHash,
      manifest,
    });
  }

  return isValid;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // 1. Extraer headers de seguridad
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    // 2. Extraer data.id y storeId de los query params
    const { searchParams } = new URL(request.url);
    let dataId = searchParams.get("data.id") || searchParams.get("id");
    let topic = searchParams.get("type") || searchParams.get("topic");
    const storeId = searchParams.get("storeId");

    // 3. Si no están en la URL, intentar obtener del cuerpo JSON
    if (!dataId) {
      try {
        const body = await request.json();
        dataId = body.data?.id?.toString() || body.id?.toString();
        topic = body.type || body.action;
      } catch {
        // El cuerpo puede no ser JSON o estar vacío
      }
    }

    if (!storeId) {
      log.error("Webhook de pago rechazado: Falta el storeId.");
      return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
    }

    // MP docs: si data.id contiene letras, convertir a lowercase para HMAC
    if (dataId) dataId = dataId.toLowerCase();

    log.info(`MercadoPago Webhook recibido: id=${dataId}, tipo/tópico=${topic}, storeId=${storeId}`);

    // 4. Filtrar por tipo de evento PRIMERO
    const isPaymentEvent = topic === "payment" || topic === "payment.created" || topic === "payment.updated";

    if (!dataId || !isPaymentEvent) {
      return NextResponse.json({ received: true });
    }

    // Fetch store secret dynamically
    const { storeService } = await import("@/backend/modules/store");
    const store = await storeService.getStoreById(storeId);
    const storeSecret = (store as any)?.config?.paymentMethods?.mercadopago?.secret;

    // 5. ✅ VERIFICAR FIRMA HMAC
    const isSignatureValid = verifyWebhookSignature(xSignature, xRequestId, dataId, storeSecret);

    if (!isSignatureValid) {
      log.error("Webhook de pago rechazado: Firma HMAC inválida o ausente.");
      return NextResponse.json(
        { error: "Unauthorized: Invalid webhook signature" },
        { status: 401 }
      );
    }

    // 6. Procesar la notificación de pago
    const result = await paymentsService.processNotification(storeId, String(dataId));
    return NextResponse.json(result);
  } catch (error: any) {
    log.error("Error en Ruta de Webhook:", error);
    // Retornamos 200 para evitar bloqueos del webhook, pero registrando el error.
    return NextResponse.json(
      { error: error.message || "Internal Server Error", processed: false },
      { status: 200 }
    );
  }
}
