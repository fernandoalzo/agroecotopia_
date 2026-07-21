"use server";

import { withAdmin } from "@/lib/auth-guards";
import { whatsappService } from "./index";
import logger from "@/utils/logger";
import { Role } from "@/types";

const log = logger.child("src/backend/modules/whatsapp/whatsapp.actions.ts");

function getWhatsAppActionErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Ocurrió un error inesperado en WhatsApp.";

  const messages: Record<string, string> = {
    CONVERSATION_NOT_FOUND: "No se encontró la conversación.",
    NOT_WHATSAPP_CONVERSATION: "Esta conversación no es de WhatsApp.",
    WHATSAPP_PHONE_NOT_FOUND: "No se encontró el número de teléfono asociado.",
    WHATSAPP_SEND_FAILED: "No se pudo enviar el mensaje por WhatsApp.",
  };

  return messages[error.message] || "Ocurrió un error inesperado en WhatsApp.";
}

export async function getWhatsAppConversationsAction() {
  return withAdmin(async () => {
    log.debug("Admin obteniendo conversaciones WhatsApp.");
    return whatsappService.getWhatsAppConversations();
  });
}

export async function sendWhatsAppMessageAction(conversationId: string, content: string) {
  return withAdmin(async (session) => {
    const userId = session.user.id;
    const userRole = session.user.role as Role;

    try {
      log.info("Admin enviando mensaje WhatsApp:", { conversationId, userId });
      return await whatsappService.sendMessageFromAdmin({
        conversationId,
        content,
        senderId: userId,
        senderRole: userRole,
      });
    } catch (error) {
      log.warn("No se pudo enviar mensaje WhatsApp:", { conversationId, userId, error });
      return { error: getWhatsAppActionErrorMessage(error) };
    }
  });
}

export async function markWhatsAppAsReadAction(conversationId: string) {
  return withAdmin(async () => {
    log.debug("Marcando mensajes WhatsApp como leídos:", { conversationId });
    return whatsappService.markAsRead(conversationId);
  });
}

export async function sendNewWhatsAppMessageAction(phone: string, content: string) {
  return withAdmin(async (session) => {
    const userId = session.user.id;
    const userRole = session.user.role as Role;

    try {
      log.info("Admin iniciando nueva conversación WhatsApp:", { phone, userId });
      return await whatsappService.sendMessageToNewNumber({
        phone,
        content,
        senderId: userId,
        senderRole: userRole,
      });
    } catch (error) {
      log.warn("No se pudo iniciar conversación WhatsApp:", { phone, userId, error });
      return { error: getWhatsAppActionErrorMessage(error) };
    }
  });
}
