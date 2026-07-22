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
  log.info("[whatsapp] ========== WEBHOOK POST RECIBIDO ==========");

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    log.info("[whatsapp] Payload recibido:", {
      bodyLength: rawBody.length,
      hasSignature: !!signature,
      signaturePrefix: signature ? signature.substring(0, 20) + "..." : "NONE",
      contentType: request.headers.get("content-type"),
    });

    // Verify HMAC signature — LOG but DON'T BLOCK while debugging
    const signatureValid = verifySignature(rawBody, signature);
    if (!signatureValid) {
      log.warn("[whatsapp] ⚠️ Firma HMAC inválida — PERMITIENDO temporalmente para diagnóstico.", {
        configuredSecret: config.whatsapp.webhookSecret ? `${config.whatsapp.webhookSecret.substring(0, 6)}...` : "NO CONFIGURADO",
        receivedSignature: signature || "NO ENVIADA",
      });
      // TODO: Restaurar bloqueo después del diagnóstico
      // return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    } else {
      log.info("[whatsapp] ✅ Firma HMAC válida.");
    }

    const body = JSON.parse(rawBody);
    log.info("[whatsapp] Body parseado:", {
      hasEntry: !!body.entry,
      entryCount: body.entry?.length || 0,
      object: body.object,
    });

    if (!body.entry || !Array.isArray(body.entry)) {
      log.info("[whatsapp] No hay entries en el body. Respondiendo 200.");
      return NextResponse.json({ received: true });
    }

    let messagesProcessed = 0;

    for (const entry of body.entry) {
      const changes = entry?.changes;
      log.info("[whatsapp] Entry:", {
        entryId: entry?.id,
        changesCount: changes?.length || 0,
      });

      if (!changes || !Array.isArray(changes)) continue;

      for (const change of changes) {
        log.info("[whatsapp] Change:", {
          field: change.field,
          hasValue: !!change.value,
          hasMessages: !!change.value?.messages,
          messagesCount: change.value?.messages?.length || 0,
          hasStatuses: !!change.value?.statuses,
        });

        if (change.field !== "messages") {
          log.info("[whatsapp] Campo ignorado (no es 'messages'):", { field: change.field });
          continue;
        }

        const value = change.value;
        const messages = value?.messages;
        if (!messages || !Array.isArray(messages)) {
          log.info("[whatsapp] No hay mensajes en este change (posible status update).");
          continue;
        }

        const profileName = value.contacts?.[0]?.profile?.name;

        for (const msg of messages) {
          const from = msg.from;
          const msgId = msg.id;

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

          log.info("[whatsapp] 📩 Procesando mensaje:", {
            from,
            msgId,
            type: msg.type,
            textLength: text.length,
            profileName,
          });

          try {
            const result = await whatsappService.processIncomingMessage({
              from,
              text,
              msgId,
              name: profileName,
            });
            messagesProcessed++;
            log.info("[whatsapp] ✅ Mensaje procesado exitosamente:", {
              conversationId: result.conversation.id,
              messageId: result.message.id,
            });
          } catch (processError: any) {
            log.error("[whatsapp] ❌ Error al procesar mensaje individual:", {
              from,
              msgId,
              error: processError.message,
              stack: processError.stack?.substring(0, 300),
            });
          }
        }
      }
    }

    log.info("[whatsapp] ========== WEBHOOK COMPLETADO ==========", {
      messagesProcessed,
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    log.error("[whatsapp] ❌ Error fatal procesando webhook:", {
      message: error.message,
      stack: error.stack?.substring(0, 500),
    });
    return NextResponse.json(
      { error: error.message || "Internal Server Error", processed: false },
      { status: 200 }
    );
  }
}
