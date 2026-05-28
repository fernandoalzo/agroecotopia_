import prisma from "@/backend/db/prisma";
import { ConversationType, PedidoEstado, Prisma, Role } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/chat/chat.repository.ts");

export class ChatRepository {
  async findUserRoleById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
  }

  async findConversationById(id: string) {
    log.debug("Buscando conversación por ID:", { conversationId: id });
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        pedido: {
          select: {
            id: true,
            estado: true,
          },
        },
      },
    });
  }

  async findConversationByUserId(userId: string) {
    log.debug("Buscando conversación por userId:", { userId });
    return prisma.conversation.findFirst({
      where: { userId, type: ConversationType.SUPPORT },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async createConversation(userId: string) {
    log.info("Creando nueva conversación para el usuario:", { userId });
    return prisma.conversation.create({
      data: {
        userId,
        type: ConversationType.SUPPORT,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAllConversations(adminUserId: string) {
    log.debug("Obteniendo todas las conversaciones con último mensaje y conteo de no leídos.");
    const conversations = await prisma.conversation.findMany({
      where: {
        type: ConversationType.SUPPORT,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const mappedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            isRead: false,
            senderId: {
              not: adminUserId,
            },
          },
        });
        return {
          ...conv,
          unreadCount,
        };
      })
    );

    log.debug("Conversaciones obtenidas:", { count: mappedConversations.length });
    return mappedConversations;
  }

  async findOrderConversation(pedidoId: string, storeId: string) {
    log.debug("Buscando conversación de pedido:", { pedidoId, storeId });
    return prisma.conversation.findFirst({
      where: {
        type: ConversationType.ORDER,
        pedidoId,
        storeId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        pedido: {
          select: {
            id: true,
            estado: true,
          },
        },
      },
    });
  }

  async findUserOrderConversations(userId: string) {
    log.debug("Buscando conversaciones de pedidos para comprador:", { userId });
    const conversations = await prisma.conversation.findMany({
      where: {
        type: ConversationType.ORDER,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        pedido: {
          select: {
            id: true,
            estado: true,
            fechaPedido: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return Promise.all(
      conversations.map(async (conv) => ({
        ...conv,
        unreadCount: await prisma.message.count({
          where: {
            conversationId: conv.id,
            isRead: false,
            senderId: {
              not: userId,
            },
          },
        }),
      }))
    );
  }

  async createOrderConversation(data: {
    pedidoId: string;
    storeId: string;
    userId: string;
    sellerId: string;
  }) {
    log.info("Creando conversación de pedido:", data);
    return prisma.conversation.create({
      data: {
        type: ConversationType.ORDER,
        pedidoId: data.pedidoId,
        storeId: data.storeId,
        userId: data.userId,
        sellerId: data.sellerId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        pedido: {
          select: {
            id: true,
            estado: true,
          },
        },
      },
    });
  }

  async findPedidoStoreAccess(pedidoId: string, storeId: string) {
    log.debug("Validando acceso de pedido a tienda:", { pedidoId, storeId });
    return prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        detalles: {
          some: {
            storeId,
          },
        },
      },
      select: {
        id: true,
        usuarioId: true,
        estado: true,
        detalles: {
          where: {
            storeId,
          },
          select: {
            store: {
              select: {
                id: true,
                name: true,
                ownerId: true,
              },
            },
          },
          take: 1,
        },
      },
    });
  }

  async findSellerOrderConversations(storeId: string, sellerId: string) {
    log.debug("Buscando conversaciones de pedidos para vendedor:", { storeId, sellerId });
    const conversations = await prisma.conversation.findMany({
      where: {
        type: ConversationType.ORDER,
        storeId,
        sellerId,
        pedido: {
          estado: {
            in: [
              PedidoEstado.PENDIENTE,
              PedidoEstado.CONFIRMADO,
              PedidoEstado.EN_PREPARACION,
              PedidoEstado.EN_CAMINO,
            ],
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        pedido: {
          select: {
            id: true,
            estado: true,
            fechaPedido: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return Promise.all(
      conversations.map(async (conv) => ({
        ...conv,
        unreadCount: await prisma.message.count({
          where: {
            conversationId: conv.id,
            isRead: false,
            senderId: {
              not: sellerId,
            },
          },
        }),
      }))
    );
  }

  async findMessagesByConversationId(conversationId: string) {
    log.debug("Obteniendo mensajes de la conversación:", { conversationId });
    return prisma.message.findMany({
      where: { conversationId },
      include: {
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            senderRole: true,
            isEncrypted: true,
            encryptionType: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async createMessage(conversationId: string, content: string, senderId: string, senderRole: Role) {
    log.info("Creando mensaje en conversación:", { conversationId, senderId, senderRole });
    return prisma.message.create({
      data: {
        content,
        senderId,
        senderRole,
        conversationId,
      },
    });
  }

  async createRealtimeMessage(data: {
    conversationId: string;
    content: string;
    senderId: string;
    senderRole: Role;
    isEncrypted?: boolean;
    encryptionType?: number;
    replyToId?: string;
  }) {
    log.info("Creando mensaje realtime en conversación:", { conversationId: data.conversationId, senderId: data.senderId, senderRole: data.senderRole });
    const message = await prisma.message.create({
      data: {
        content: data.content,
        isEncrypted: data.isEncrypted || false,
        encryptionType: data.encryptionType || 0,
        senderId: data.senderId,
        senderRole: data.senderRole,
        conversationId: data.conversationId,
        ...(data.replyToId ? { replyToId: data.replyToId } : {}),
      },
      include: {
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            senderRole: true,
            isEncrypted: true,
            encryptionType: true,
          },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async markMessagesAsRead(conversationId: string, excludeSenderId: string) {
    log.debug("Marcando mensajes como leídos en conversación:", { conversationId, excludeSenderId });
    return prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: excludeSenderId,
        },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async deleteConversation(id: string) {
    log.info("Eliminando conversación de la base de datos:", { conversationId: id });
    return prisma.conversation.delete({
      where: { id },
    });
  }

  async findUsersPaginated(searchQuery?: string, page: number = 1) {
    const take = 20;
    const skip = (page - 1) * take;

    const where: Prisma.UserWhereInput = {};
    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    log.debug("Buscando usuarios paginados:", { searchQuery, page, skip, take });
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: {
          name: "asc",
        },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    log.debug("Usuarios encontrados:", { totalCount, totalPages: Math.ceil(totalCount / take), currentPage: page });
    return {
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / take),
      currentPage: page,
    };
  }
}
