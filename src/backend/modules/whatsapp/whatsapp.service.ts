import { WhatsAppRepository } from "./whatsapp.repository";
import logger from "@/utils/logger";
import eventBus from "@/utils/eventBus";
import { notificationsService } from "@/backend/modules/notifications";

const log = logger.child("src/backend/modules/whatsapp/whatsapp.service.ts");

/** Normalize phone to E.164 without +: strip non-digits, prepend 57 (Colombia) if missing */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("57")) return digits;
  return `57${digits}`;
}

export class WhatsAppService {
  constructor(private whatsappRepository: WhatsAppRepository) {}

  /**
   * Process an incoming WhatsApp message from the webhook.
   * Finds or creates a WHATSAPP conversation and persists the message,
   * then bridges it to the in-app chat via eventBus.
   */
  async processIncomingMessage(payload: {
    from: string;
    text: string;
    msgId: string;
    name?: string;
  }) {
    const rawFrom = payload.from;
    const from = normalizePhone(rawFrom);
    const { text, msgId, name } = payload;

    log.info("[whatsapp] Procesando mensaje entrante de WhatsApp:", { from, rawFrom, msgId });

    // 1. Try to find user by phone
    const user = await this.whatsappRepository.findUserByPhone(from);

    if (!user) {
      log.warn("[whatsapp] No se encontró usuario registrado con teléfono:", { from });
    }

    // 2. Find or create WhatsApp conversation with normalized phone number
    const conversation = await this.whatsappRepository.findOrCreateWhatsAppConversation(
      from,
      user?.id
    );

    // 3. Persist the message
    const message = await this.whatsappRepository.createWhatsAppMessage({
      conversationId: conversation.id,
      content: text,
      senderId: user?.id || "whatsapp-system",
      senderRole: "user",
      whatsappMsgId: msgId,
    });

    log.info("[whatsapp] Mensaje persistido en conversación:", {
      conversationId: conversation.id,
      messageId: message.id,
    });

    // 4. Bridge to Socket.IO via eventBus for real-time delivery
    eventBus.emit("whatsapp:message_inbound", {
      conversationId: conversation.id,
      message,
      _room: `conversation_${conversation.id}`,
    });

    // 5. Notify admins via eventBus (global, no room)
    eventBus.emit("whatsapp:new_message", {
      conversationId: conversation.id,
      message,
      from,
    });

    // 6. Dispatch notification for admin team (BROADCAST audience)
    notificationsService.dispatchNotification({
      eventType: "whatsapp_message_received",
      actorId: user?.id || "whatsapp-system",
      entityType: "Conversation",
      entityId: conversation.id,
      notification: {
        type: "whatsapp_message",
        title: `Mensaje WhatsApp de ${user?.name || name || from}`,
        message: text.length > 120 ? text.slice(0, 120) + "..." : text,
        audienceType: "BROADCAST",
        metadata: { actionUrl: "/admin/chat" },
      },
    }).catch((err) => {
      log.error("[whatsapp] Error al despachar notificación:", err);
    });

    return { conversation, message };
  }

  /**
   * Send a message to WhatsApp from the admin chat panel.
   * Persists the message and forwards it via Meta Cloud API.
   */
  async sendOutgoingMessage(data: {
    conversationId: string;
    content: string;
    senderId: string;
    senderRole: "admin" | "user" | "seller";
  }) {
    const conversation = await this.whatsappRepository.findConversationById(data.conversationId);

    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }

    if (conversation.type !== "WHATSAPP") {
      throw new Error("NOT_WHATSAPP_CONVERSATION");
    }

    const rawPhone = conversation.whatsappPhone;
    if (!rawPhone) {
      throw new Error("WHATSAPP_PHONE_NOT_FOUND");
    }

    // Normalize phone to E.164 format
    const phone = normalizePhone(rawPhone);

    // 1. Send via WhatsApp Cloud API
    const whatsappMsgId = await this.whatsappRepository.sendWhatsAppMessage(phone, data.content);

    if (!whatsappMsgId) {
      log.error("[whatsapp] No se pudo enviar el mensaje a WhatsApp. El mensaje no se persistirá.");
      throw new Error("WHATSAPP_SEND_FAILED");
    }

    // 2. Persist the message only if WhatsApp delivery succeeded
    const message = await this.whatsappRepository.createWhatsAppMessage({
      conversationId: data.conversationId,
      content: data.content,
      senderId: data.senderId,
      senderRole: data.senderRole,
      whatsappMsgId,
    });

    log.info("[whatsapp] Mensaje saliente enviado y persistido:", {
      conversationId: data.conversationId,
      whatsappMsgId,
    });

    return message;
  }

  async getWhatsAppConversations() {
    return this.whatsappRepository.findAllWhatsAppConversations();
  }

  async markAsRead(conversationId: string) {
    return this.whatsappRepository.markMessagesAsRead(conversationId);
  }

  async getConversationById(conversationId: string) {
    return this.whatsappRepository.findConversationById(conversationId);
  }

  async sendMessageFromAdmin(data: {
    conversationId: string;
    content: string;
    senderId: string;
    senderRole: "admin" | "user" | "seller";
  }) {
    const message = await this.sendOutgoingMessage(data);

    // Bridge to Socket.IO
    eventBus.emit("whatsapp:message_outbound", {
      conversationId: data.conversationId,
      message,
      _room: `conversation_${data.conversationId}`,
    });

    return message;
  }

  /**
   * Send a message to a new WhatsApp number, creating the conversation
   * if it doesn't exist yet. Used from the admin panel to start new chats.
   */
  async sendMessageToNewNumber(data: {
    phone: string;
    content: string;
    senderId: string;
    senderRole: "admin" | "user" | "seller";
  }) {
    const { content, senderId, senderRole } = data;
    const phone = normalizePhone(data.phone);

    // 1. Find user by phone to link (optional)
    const user = await this.whatsappRepository.findUserByPhone(phone);

    // 2. Find or create the conversation
    const conversation = await this.whatsappRepository.findOrCreateWhatsAppConversation(
      phone,
      user?.id
    );

    // 3. Send via WhatsApp Cloud API
    const whatsappMsgId = await this.whatsappRepository.sendWhatsAppMessage(phone, content);

    if (!whatsappMsgId) {
      log.error("[whatsapp] No se pudo enviar el mensaje inicial a WhatsApp:", { phone });
      throw new Error("WHATSAPP_SEND_FAILED");
    }

    // 4. Persist the message
    const message = await this.whatsappRepository.createWhatsAppMessage({
      conversationId: conversation.id,
      content,
      senderId,
      senderRole,
      whatsappMsgId,
    });

    log.info("[whatsapp] Nueva conversación iniciada y mensaje enviado:", {
      conversationId: conversation.id,
      phone,
      whatsappMsgId,
    });

    // 5. Refresh WhatsApp conversations list
    eventBus.emit("whatsapp:new_message", {
      conversationId: conversation.id,
      message,
    });

    // 6. Bridge to room
    eventBus.emit("whatsapp:message_outbound", {
      conversationId: conversation.id,
      message,
      _room: `conversation_${conversation.id}`,
    });

    return { conversation, message };
  }
}
