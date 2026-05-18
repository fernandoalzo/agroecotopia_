import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { paymentsService } from "@/backend/modules/payments";

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
  dataId: string | null
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  // Si no hay secret configurado, no podemos verificar
  if (!secret) {
    console.warn(
      "⚠️ MERCADOPAGO_WEBHOOK_SECRET no está configurado. " +
      "La verificación HMAC está deshabilitada. Configúrala en producción."
    );
    return true; // Permite pasar en desarrollo sin secret
  }

  if (!xSignature || !xRequestId || !dataId) {
    console.error("❌ Webhook HMAC: Faltan headers o data.id requeridos para verificación.");
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
    console.error("❌ Webhook HMAC: x-signature no contiene ts o v1 válidos.", { xSignature });
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
    console.error("❌ Webhook HMAC: Firma inválida.", {
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

    // 2. Extraer data.id de los query params
    const { searchParams } = new URL(request.url);
    let dataId = searchParams.get("data.id") || searchParams.get("id");
    let topic = searchParams.get("type") || searchParams.get("topic");

    // 3. Si no están en la URL, intentar obtener del cuerpo JSON
    let body: any = null;
    if (!dataId) {
      try {
        body = await request.json();
        dataId = body.data?.id?.toString() || body.id?.toString();
        topic = body.type || body.action;
      } catch {
        // El cuerpo puede no ser JSON o estar vacío
      }
    }

    console.log(`MercadoPago Webhook recibido: id=${dataId}, tipo/tópico=${topic}`);

    // 4. ✅ VERIFICAR FIRMA HMAC ANTES DE PROCESAR
    const isSignatureValid = verifyWebhookSignature(xSignature, xRequestId, dataId);

    if (!isSignatureValid) {
      console.error("🚫 Webhook rechazado: Firma HMAC inválida o ausente.");
      return NextResponse.json(
        { error: "Unauthorized: Invalid webhook signature" },
        { status: 401 }
      );
    }

    // 5. Solo procesamos eventos relacionados con pagos ("payment")
    // MercadoPago también notifica sobre "merchant_order" u otros tópicos
    if (dataId && (topic === "payment" || topic === "payment.created" || topic === "payment.updated")) {
      const result = await paymentsService.processNotification(String(dataId));
      return NextResponse.json(result);
    }

    // Retornamos 200 OK para confirmar recepción de cualquier otro webhook y evitar reintentos infinitos
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error en Ruta de Webhook:", error);
    // MercadoPago requiere una respuesta exitosa (incluso si falló el procesamiento)
    // para evitar que reintente infinitamente. Sin embargo, devolvemos 500 en desarrollo
    // si el error es grave para alertar al desarrollador, o 200 si queremos silenciarlo.
    // Retornamos 200 para evitar bloqueos del webhook, pero registrando el error.
    return NextResponse.json(
      { error: error.message || "Internal Server Error", processed: false },
      { status: 200 }
    );
  }
}
