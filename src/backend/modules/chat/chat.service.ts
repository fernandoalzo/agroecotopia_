import { ChatRepository } from "./chat.repository";
import { ConversationType, PedidoEstado, Role } from "@prisma/client";
import logger from "@/utils/logger";
import { notificationsService } from "@/backend/modules/notifications";

const log = logger.child("src/backend/modules/chat/chat.service.ts");

export class ChatService {
  constructor(private chatRepository: ChatRepository) {}

  private readonly openOrderStatuses: PedidoEstado[] = [
    PedidoEstado.PENDIENTE,
    PedidoEstado.CONFIRMADO,
    PedidoEstado.EN_PREPARACION,
    PedidoEstado.EN_CAMINO,
  ];

  async getOrCreateConversationForUser(userId: string) {
    let conversation = await this.chatRepository.findConversationByUserId(userId);
    if (!conversation) {
      log.info("No se encontró conversación existente. Creando nueva conversación para el usuario:", { userId });
      conversation = await this.chatRepository.createConversation(userId);
    } else {
      log.debug("Conversación existente encontrada para el usuario:", { userId, conversationId: conversation.id });
    }
    return conversation;
  }

  async getConversationById(id: string, currentUserId: string, userRole: Role) {
    const conversation = await this.chatRepository.findConversationById(id);
    if (!conversation) {
      log.warn("Conversación no encontrada:", { conversationId: id });
      throw new Error("CONVERSATION_NOT_FOUND");
    }

    const canAccessSupport = conversation.type === ConversationType.SUPPORT
      && (userRole === "admin" || conversation.userId === currentUserId);
    const canAccessOrder = conversation.type === ConversationType.ORDER
      && (conversation.userId === currentUserId || conversation.sellerId === currentUserId || userRole === "admin");

    if (!canAccessSupport && !canAccessOrder) {
      log.warn("Acceso no autorizado a conversación:", { conversationId: id, currentUserId, ownerUserId: conversation.userId });
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    return conversation;
  }

  async getMessages(conversationId: string, currentUserId: string, userRole: Role) {
    // Check if conversation exists and user has access
    await this.getConversationById(conversationId, currentUserId, userRole);
    log.debug("Obteniendo mensajes de la conversación:", { conversationId });
    return this.chatRepository.findMessagesByConversationId(conversationId);
  }

  async getAdminConversations(adminUserId: string) {
    log.debug("Obteniendo todas las conversaciones para panel de administración.");
    return this.chatRepository.findAllConversations(adminUserId);
  }

  async getOrCreateOrderConversation(pedidoId: string, storeId: string, currentUserId: string, userRole: Role) {
    const access = await this.chatRepository.findPedidoStoreAccess(pedidoId, storeId);

    if (!access || !access.detalles[0]?.store) {
      log.warn("Pedido no asociado a la tienda para chat:", { pedidoId, storeId, currentUserId });
      throw new Error("ORDER_STORE_NOT_FOUND");
    }

    if (!this.openOrderStatuses.includes(access.estado)) {
      log.warn("Intento de abrir chat para pedido cerrado:", { pedidoId, estado: access.estado });
      throw new Error("ORDER_CLOSED");
    }

    const sellerId = access.detalles[0].store.ownerId;
    const isBuyer = access.usuarioId === currentUserId;
    const isSeller = sellerId === currentUserId;

    if (!isBuyer && !isSeller && userRole !== "admin") {
      log.warn("Acceso denegado para conversación de pedido:", { pedidoId, storeId, currentUserId, sellerId, buyerId: access.usuarioId });
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    const existing = await this.chatRepository.findOrderConversation(pedidoId, storeId);
    if (existing) return existing;

    return await this.chatRepository.createOrderConversation({
      pedidoId,
      storeId,
      userId: access.usuarioId,
      sellerId,
    });
  }

  async getSellerOrderConversations(storeId: string, sellerId: string, userRole: Role) {
    if (userRole !== "admin" && userRole !== "seller") {
      throw new Error("UNAUTHORIZED_ACCESS");
    }
    return await this.chatRepository.findSellerOrderConversations(storeId, sellerId);
  }

  async getUserOrderConversations(userId: string, userRole: Role) {
    if (!["user", "admin", "seller"].includes(userRole)) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }
    return await this.chatRepository.findUserOrderConversations(userId);
  }

  async canSendMessage(conversationId: string, senderId: string, senderRole: Role) {
    const conversation = await this.getConversationById(conversationId, senderId, senderRole);

    if (conversation.type === ConversationType.ORDER) {
      if (!conversation.pedido || !this.openOrderStatuses.includes(conversation.pedido.estado)) {
        log.warn("Intento de enviar mensaje a pedido cerrado:", { conversationId, senderId });
        throw new Error("ORDER_CLOSED");
      }
    }

    return conversation;
  }

  async sendRealtimeMessage(data: {
    conversationId: string;
    content: string;
    senderId: string;
    senderRole?: Role;
    isEncrypted?: boolean;
    encryptionType?: number;
    replyToId?: string;
  }) {
    const sender = await this.chatRepository.findUserRoleById(data.senderId);
    if (!sender) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    const conversation = await this.canSendMessage(data.conversationId, data.senderId, sender.role);
    const message = await this.chatRepository.createRealtimeMessage({
      ...data,
      senderRole: sender.role,
    });

    // ─── Dispatch notification for ORDER messages ───
    log.debug("sendRealtimeMessage - conversation check:", {
      type: conversation.type,
      hasPedido: !!conversation.pedido,
      pedidoId: conversation.pedido?.id,
      senderId: data.senderId,
      sellerId: conversation.seller?.id,
      userId: conversation.userId,
    });

    if (conversation.type === ConversationType.ORDER && conversation.pedido) {
      const isSeller = data.senderId === conversation.seller?.id;
      const recipientId = isSeller ? conversation.userId : conversation.seller?.id;

      log.debug("sendRealtimeMessage - notification check:", {
        isSeller,
        recipientId,
        senderId: data.senderId,
        shouldDispatch: !!(recipientId && recipientId !== data.senderId),
      });

      if (recipientId && recipientId !== data.senderId) {
        const actionUrl = isSeller
          ? `/pedidos/${conversation.pedido.id}`
          : "/mi-tienda";

        notificationsService.dispatchNotification({
          eventType: "order_message_sent",
          actorId: data.senderId,
          entityType: "Pedido",
          entityId: conversation.pedido.id,
          notification: {
            type: "order_message",
            title: isSeller ? "Respuesta del vendedor" : "Nuevo mensaje en tu pedido",
            message: data.content.length > 120 ? data.content.slice(0, 120) + "..." : data.content,
            audienceType: "INDIVIDUAL",
            audienceRef: recipientId,
            metadata: { actionUrl },
          },
        }).then((result) => {
          log.info("Notificación de mensaje despachada exitosamente:", {
            notificationId: result.notification.id,
            recipientCount: result.recipientCount,
          });
        }).catch((err) => {
          log.error("Error al despachar notificación de mensaje:", err);
        });
      }
    }

    return message;
  }

  async markAsRead(conversationId: string, currentUserId: string) {
    log.debug("Marcando mensajes como leídos:", { conversationId, excludeSenderId: currentUserId });
    return this.chatRepository.markMessagesAsRead(conversationId, currentUserId);
  }

  async deleteConversation(conversationId: string, currentUserId: string, userRole: Role) {
    const conversation = await this.chatRepository.findConversationById(conversationId);
    if (!conversation) {
      log.warn("Intento de eliminar conversación inexistente:", { conversationId });
      throw new Error("CONVERSATION_NOT_FOUND");
    }

    // Solo soporte mantiene borrado por usuario/admin. Los chats de pedido se conservan como historial operativo.
    if (conversation.type !== ConversationType.SUPPORT) {
      throw new Error("DELETE_NOT_ALLOWED");
    }

    if (userRole !== "admin" && conversation.userId !== currentUserId) {
      log.warn("Acceso no autorizado para eliminar conversación:", { conversationId, currentUserId, ownerUserId: conversation.userId });
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    log.info("Eliminando conversación:", { conversationId, deletedBy: currentUserId, role: userRole });
    return this.chatRepository.deleteConversation(conversationId);
  }

  async getUsersForAdminChat(searchQuery?: string, page: number = 1) {
    log.debug("Buscando usuarios paginados para chat de admin:", { searchQuery, page });
    return this.chatRepository.findUsersPaginated(searchQuery, page);
  }

  async registerE2EEDevice(
    userId: string,
    data: {
      registrationId: number;
      identityKey: string;
      identityPrivateKey?: string | null;
      signedPreKeyId: number;
      signedPreKey: string;
      signedPreKeyPrivateKey?: string | null;
      signedPreKeySig: string;
      preKeys: Array<{ keyId: number; publicKey: string }>;
    }
  ) {
    if (
      data.registrationId == null ||
      !data.identityKey ||
      data.signedPreKeyId == null ||
      !data.signedPreKey ||
      !data.signedPreKeySig ||
      !Array.isArray(data.preKeys)
    ) {
      throw new Error("INVALID_E2EE_PAYLOAD");
    }

    return this.chatRepository.upsertE2EEDevice({ userId, ...data });
  }

  async getE2EEBundle(requestingUserId: string, targetUserIdOrAlias: string) {
    let targetUserId = targetUserIdOrAlias;

    if (targetUserIdOrAlias === "admin") {
      const admin = await this.chatRepository.findAdminE2EEDeviceOwner();
      if (!admin?.e2eeDevice) {
        throw new Error("ADMIN_DEVICE_NOT_FOUND");
      }
      targetUserId = admin.id;
    }

    const device = await this.chatRepository.findE2EEDeviceBundle(targetUserId);
    if (!device) {
      throw new Error("DEVICE_NOT_FOUND");
    }

    const preKey = device.preKeys[0] ?? null;
    const isSelf = targetUserId === requestingUserId;

    return {
      registrationId: device.registrationId,
      identityKey: device.identityKey,
      signedPreKey: {
        keyId: device.signedPreKeyId,
        publicKey: device.signedPreKey,
        signature: device.signedPreKeySig,
      },
      preKey: preKey
        ? {
            keyId: preKey.keyId,
            publicKey: preKey.publicKey,
          }
        : null,
      ...(isSelf
        ? {
            privateKeys: {
              identityPrivateKey: device.identityPrivateKey,
              signedPreKeyPrivateKey: device.signedPreKeyPrivateKey,
            },
          }
        : {}),
    };
  }
}
