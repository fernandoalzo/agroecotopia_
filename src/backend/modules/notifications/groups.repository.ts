import prisma from "@/backend/db/prisma";
import { Prisma } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child();

export class GroupsRepository {
  // ─── Group CRUD ─────────────────────────────────────────

  async createGroup(data: { name: string; description?: string | null; createdBy: string }) {
    log.debug("Creando grupo:", { name: data.name, createdBy: data.createdBy });
    return await prisma.group.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        createdBy: data.createdBy,
      },
      include: {
        _count: { select: { members: true } },
      },
    });
  }

  async findGroupById(id: string) {
    log.debug("Buscando grupo por ID:", { groupId: id });
    return await prisma.group.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        _count: { select: { members: true } },
      },
    });
  }

  async findGroupByName(name: string) {
    log.debug("Buscando grupo por nombre:", { name });
    return await prisma.group.findUnique({
      where: { name },
    });
  }

  async findAllGroups() {
    log.debug("Obteniendo todos los grupos.");
    return await prisma.group.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        _count: { select: { members: true } },
      },
    });
  }

  async updateGroup(id: string, data: Prisma.GroupUpdateInput) {
    log.debug("Actualizando grupo:", { groupId: id });
    return await prisma.group.update({
      where: { id },
      data,
      include: {
        _count: { select: { members: true } },
      },
    });
  }

  async deleteGroup(id: string) {
    log.info("Eliminando grupo:", { groupId: id });
    return await prisma.group.delete({
      where: { id },
    });
  }

  // ─── Membership ─────────────────────────────────────────

  async addMember(groupId: string, userId: string) {
    log.debug("Añadiendo miembro al grupo:", { groupId, userId });
    return await prisma.groupMember.create({
      data: {
        groupId,
        userId,
      },
    });
  }

  async removeMember(groupId: string, userId: string) {
    log.debug("Removiendo miembro del grupo:", { groupId, userId });
    return await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
  }

  async findMembersByGroupId(groupId: string) {
    log.debug("Obteniendo miembros del grupo:", { groupId });
    return await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
  }

  /**
   * Get just the user IDs of a group (optimized for audience resolution).
   */
  async findMemberIdsByGroupId(groupId: string): Promise<string[]> {
    log.debug("Obteniendo IDs de miembros del grupo:", { groupId });
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  async findGroupsByUserId(userId: string) {
    log.debug("Obteniendo grupos del usuario:", { userId });
    return await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
    return !!member;
  }
}
