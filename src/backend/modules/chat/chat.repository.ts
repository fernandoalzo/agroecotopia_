import prisma from "@/backend/db/prisma";
import { Role } from "@prisma/client";

export class ChatRepository {
  async findConversationById(id: string) {
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

    return mappedConversations;
  }

  async findMessagesByConversationId(conversationId: string) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async createMessage(conversationId: string, content: string, senderId: string, senderRole: Role) {
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

    return {
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / take),
      currentPage: page,
    };
  }
}
