import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import logger from "@/utils/logger";
import { config } from "@/config/config";
import { whatsappService } from "@/backend/modules/whatsapp";

const log = logger.child("src/app/api/webhooks/whatsapp/route.ts");

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Cloud API Webhook
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET — Webhook Verification Challenge
 *
 * Meta sends a GET request with `hub.mode`, `hub.verify_token`, and `hub.challenge`
 * when configuring the webhook. We must respond with the challenge value if the
 * verify token matches.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  log.info("[whatsapp] Recibida solicitud de verificación de webhook:", { mode, token });

  if (mode === "subscribe" && token === config.whatsapp.verifyToken) {
    log.info("[whatsapp] Webhook verificado exitosamente.");
    return new NextResponse(challenge, { status: 200 });
  }

  log.warn("[whatsapp] Falló la verificación del webhook: token inválido.");
  return new NextResponse("Verification failed", { status: 403 });
}

// ─────────────────────────────────────────────────────────────────────────────
// HMAC-SHA256 Signature Verification
// Meta sends X-Hub-Signature-256 header: sha256=<hex>
// We verify using the webhook secret configured in Meta dashboard.
// ─────────────────────────────────────────────────────────────────────────────

function verifySignature(payload: string, signatureHeader: string | null): boolean {
  const secret = config.whatsapp.webhookSecret;
  if (!secret) {
    log.warn("[whatsapp] WHATSAPP_WEBHOOK_SECRET no configurado. Omitiendo verificación HMAC.");
    return true;
  }

  if (!signatureHeader) {
    log.error("[whatsapp] Webhook sin header X-Hub-Signature-256.");
    return false;
  }

  const expectedPrefix = "sha256=";
  if (!signatureHeader.startsWith(expectedPrefix)) {
    log.error("[whatsapp] Formato inválido de X-Hub-Signature-256.");
    return false;
  }

  const receivedHash = signatureHeader.slice(expectedPrefix.length);
  const computedHash = createHmac("sha256", secret)
    .update(payload, "utf-8")
    .digest("hex");

  try {
    const receivedBuf = Buffer.from(receivedHash, "hex");
    const computedBuf = Buffer.from(computedHash, "hex");
    return receivedBuf.length === computedBuf.length
      && timingSafeEqual(receivedBuf, computedBuf);
  } catch {
    log.error("[whatsapp] Error en comparación timing-safe de firmas.");
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Incoming Messages
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // Verify HMAC signature
    if (!verifySignature(rawBody, signature)) {
      log.error("[whatsapp] Firma HMAC inválida. Rechazando webhook.");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody);

    // Meta sends a challenge test first; also handles entry looping
    if (body.entry?.[0]?.changes?.[0]?.field !== "messages") {
      // Not a message notification (could be status update, etc.)
      return NextResponse.json({ received: true });
    }

    const change = body.entry[0].changes[0].value;
    const messages = change.messages;

    if (!messages || messages.length === 0) {
      // No messages in this payload (e.g., status updates)
      return NextResponse.json({ received: true });
    }

    for (const msg of messages) {
      // Only handle text messages
      if (msg.type !== "text") {
        log.debug("[whatsapp] Ignorando mensaje no textual:", { type: msg.type, msgId: msg.id });
        continue;
      }

      const from = msg.from;             // sender phone number
      const text = msg.text.body;        // message text
      const msgId = msg.id;              // WhatsApp message ID
      const profileName = change.contacts?.[0]?.profile?.name;

      log.info("[whatsapp] Mensaje entrante procesado:", { from, msgId, textLength: text.length });

      // Process the message
      await whatsappService.processIncomingMessage({
        from,
        text,
        msgId,
        name: profileName,
      });
    }

    // Always return 200 to prevent Meta from retrying
    return NextResponse.json({ received: true });
  } catch (error: any) {
    log.error("[whatsapp] Error procesando webhook:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", processed: false },
      { status: 200 }
    );
  }
}
