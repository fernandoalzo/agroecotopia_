import prisma from "@/backend/db/prisma";
import { Prisma, MessageChannel as PrismaMessageChannel } from "@prisma/client";
import logger from "@/utils/logger";
import { CacheService, CacheKeys } from "@/backend/cache";
import { config } from "@/config/config";

const log = logger.child("src/backend/modules/whatsapp/whatsapp.repository.ts");

export class WhatsAppRepository {
  constructor(private cacheService?: CacheService) {}

  async findUserByPhone(phone: string) {
    log.debug("[db] Buscando usuario por teléfono:", { phone });
    // Try both the full number and the local suffix (without country code)
    const full = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, email: true, role: true },
    });
    if (full) return full;
    // Try stripping country code prefix for local-format matching
    const localSuffix = phone.replace(/^\d{2}/, "");
    if (localSuffix.length >= 7) {
      return prisma.user.findFirst({
        where: { phone: { endsWith: localSuffix } },
        select: { id: true, name: true, email: true, role: true },
      });
    }
    return null;
  }

  async findConversationByPhone(phone: string) {
    log.debug("[db] Buscando conversación WhatsApp por teléfono:", { phone });
    const digits = phone.replace(/\D/g, "");
    const withoutPrefix = digits.replace(/^57/, "");

    return prisma.conversation.findFirst({
      where: {
        type: "WHATSAPP",
        OR: [
          { whatsappPhone: phone },
          { whatsappPhone: digits },
          { whatsappPhone: `57${withoutPrefix}` },
          { whatsappPhone: withoutPrefix },
          ...(withoutPrefix.length >= 7 ? [{ whatsappPhone: { endsWith: withoutPrefix } }] : []),
        ],
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async createWhatsAppConversation(phone: string, userId?: string) {
    log.info("[db] Creando nueva conversación WhatsApp:", { phone, userId });
    return prisma.conversation.create({
      data: {
        type: "WHATSAPP",
        whatsappPhone: phone,
        ...(userId ? { userId } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findOrCreateWhatsAppConversation(phone: string, userId?: string) {
    const existing = await this.findConversationByPhone(phone);
    if (existing) return existing;
    return this.createWhatsAppConversation(phone, userId);
  }

  async createWhatsAppMessage(data: {
    conversationId: string;
    content: string;
    senderId: string;
    senderRole: "admin" | "user" | "seller";
    whatsappMsgId?: string;
  }) {
    log.info("[db] Creando mensaje WhatsApp:", {
      conversationId: data.conversationId,
      senderRole: data.senderRole,
    });

    let finalWhatsappMsgId = data.whatsappMsgId;
    if (finalWhatsappMsgId) {
      const existing = await prisma.message.findUnique({
        where: { whatsappMsgId: finalWhatsappMsgId },
      });
      if (existing) {
        finalWhatsappMsgId = `${finalWhatsappMsgId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }
    }

    const message = await prisma.message.create({
      data: {
        content: data.content,
        senderId: data.senderId,
        senderRole: data.senderRole,
        channel: "WHATSAPP" as PrismaMessageChannel,
        conversationId: data.conversationId,
        ...(finalWhatsappMsgId ? { whatsappMsgId: finalWhatsappMsgId } : {}),
      },
    });

    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    await this.cacheService?.del(CacheKeys.chat.messagesByConversationId(data.conversationId));
    return message;
  }

  async findConversationById(id: string) {
    log.debug("[db] Buscando conversación por ID:", { conversationId: id });
    const key = CacheKeys.chat.conversationById(id);
    return this.cacheService?.getOrSet(
      key,
      () => prisma.conversation.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      }),
      120
    ) ?? prisma.conversation.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });
  }

  async findAllWhatsAppConversations() {
    log.debug("[db] Obteniendo todas las conversaciones WhatsApp");
    const conversations = await prisma.conversation.findMany({
      where: { type: "WHATSAPP" },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            isRead: false,
            channel: "WHATSAPP",
          },
        });
        return { ...conv, unreadCount };
      })
    );
  }

  async markMessagesAsRead(conversationId: string) {
    log.debug("[db] Marcando mensajes WhatsApp como leídos:", { conversationId });
    return prisma.message.updateMany({
      where: {
        conversationId,
        channel: "WHATSAPP",
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  /** Send a message through Meta Cloud API */
  async sendWhatsAppMessage(to: string, text: string): Promise<string | null> {
    if (!config.whatsapp.enabled || !config.whatsapp.apiKey || !config.whatsapp.phoneNumberId) {
      log.warn("WhatsApp no configurado. No se puede enviar el mensaje.");
      return null;
    }

    const url = `${config.whatsapp.apiBaseUrl}/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}/messages`;

    try {
      log.debug("[whatsapp] Enviando mensaje WhatsApp:", { to, textLength: text.length });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.whatsapp.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: false, body: text },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        log.error("[whatsapp] Error al enviar mensaje WhatsApp:", {
          status: response.status,
          body: errorBody,
        });
        return null;
      }

      const result = await response.json();
      const msgId: string | undefined = result?.messages?.[0]?.id;
      log.info("[whatsapp] Mensaje WhatsApp enviado exitosamente:", { msgId });
      return msgId || null;
    } catch (error) {
      log.error("[whatsapp] Excepción al enviar mensaje WhatsApp:", error);
      return null;
    }
  }
}
