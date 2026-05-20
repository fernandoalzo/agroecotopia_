import prisma from "@/backend/db/prisma";
import { Role } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/chat/chat.repository.ts");

export class ChatRepository {
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
      },
    });
  }

  async findConversationByUserId(userId: string) {
    log.debug("Buscando conversación por userId:", { userId });
    return prisma.conversation.findUnique({
      where: { userId },
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

  async findAllConversations() {
    log.debug("Obteniendo todas las conversaciones con último mensaje y conteo de no leídos.");
    const conversations = await prisma.conversation.findMany({
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
            senderRole: "user",
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

    const where: any = {};
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
