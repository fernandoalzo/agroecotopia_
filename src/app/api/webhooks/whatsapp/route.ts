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

    if (!body.entry || !Array.isArray(body.entry)) {
      return NextResponse.json({ received: true });
    }

    for (const entry of body.entry) {
      const changes = entry?.changes;
      if (!changes || !Array.isArray(changes)) continue;

      for (const change of changes) {
        if (change.field !== "messages") continue;

        const value = change.value;
        const messages = value?.messages;
        if (!messages || !Array.isArray(messages)) continue;

        const profileName = value.contacts?.[0]?.profile?.name;

        for (const msg of messages) {
          const from = msg.from;             // sender phone number
          const msgId = msg.id;              // WhatsApp message ID

          let text = "";
          if (msg.type === "text" && msg.text?.body) {
            text = msg.text.body;
          } else if (msg.type === "interactive") {
            text = msg.interactive?.button_reply?.title
              || msg.interactive?.list_reply?.title
              || "[Respuesta interactiva]";
          } else if (msg.type === "button") {
            text = msg.button?.text || "[Botón]";
          } else if (msg.type === "image") {
            text = msg.image?.caption ? `[Imagen] ${msg.image.caption}` : "[Imagen]";
          } else if (msg.type === "audio") {
            text = "[Nota de voz/Audio]";
          } else if (msg.type === "video") {
            text = msg.video?.caption ? `[Video] ${msg.video.caption}` : "[Video]";
          } else if (msg.type === "document") {
            text = msg.document?.caption || msg.document?.filename || "[Documento]";
          } else if (msg.type === "location") {
            text = "[Ubicación compartida]";
          } else if (msg.type === "sticker") {
            text = "[Sticker]";
          } else {
            text = `[Mensaje ${msg.type || "desconocido"}]`;
          }

          log.info("[whatsapp] Mensaje entrante procesado:", { from, msgId, type: msg.type, textLength: text.length });

          // Process the message
          await whatsappService.processIncomingMessage({
            from,
            text,
            msgId,
            name: profileName,
          });
        }
      }
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
