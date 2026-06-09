"use server";

import { withAdmin } from "@/lib/auth-guards";
import { groupsService } from "./index";
import logger from "@/utils/logger";

const log = logger.child();

function getGroupActionErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Ocurrió un error inesperado al gestionar grupos.";

  const messages: Record<string, string> = {
    GROUP_NAME_ALREADY_EXISTS: "Ya existe un grupo con este nombre.",
    GROUP_NOT_FOUND: "No se encontró el grupo especificado.",
    USER_NOT_IN_GROUP: "El usuario no pertenece a este grupo.",
  };

  return messages[error.message] || "Ocurrió un error inesperado al gestionar grupos.";
}

export async function createGroupAction(name: string, description?: string) {
  return withAdmin(async (session) => {
    const createdBy = session.user.id;

    try {
      return await groupsService.createGroup({ name, description, createdBy });
    } catch (error) {
      log.error("Error creando grupo:", error);
      return { error: getGroupActionErrorMessage(error) };
    }
  });
}

export async function getAllGroupsAction() {
  return withAdmin(async () => {
    try {
      return await groupsService.getAllGroups();
    } catch (error) {
      log.error("Error obteniendo grupos:", error);
      return { error: getGroupActionErrorMessage(error) };
    }
  });
}

export async function addGroupMemberAction(groupId: string, userId: string) {
  return withAdmin(async () => {
    try {
      await groupsService.addMember(groupId, userId);
      return { success: true };
    } catch (error) {
      log.error("Error añadiendo miembro al grupo:", error);
      return { error: getGroupActionErrorMessage(error) };
    }
  });
}

export async function removeGroupMemberAction(groupId: string, userId: string) {
  return withAdmin(async () => {
    try {
      await groupsService.removeMember(groupId, userId);
      return { success: true };
    } catch (error) {
      log.error("Error removiendo miembro del grupo:", error);
      return { error: getGroupActionErrorMessage(error) };
    }
  });
}

export async function getGroupMembersAction(groupId: string) {
  return withAdmin(async () => {
    try {
      return await groupsService.getGroupMembers(groupId);
    } catch (error) {
      log.error("Error obteniendo miembros del grupo:", error);
      return { error: getGroupActionErrorMessage(error) };
    }
  });
}

export async function deleteGroupAction(groupId: string) {
  return withAdmin(async () => {
    try {
      await groupsService.deleteGroup(groupId);
      return { success: true };
    } catch (error) {
      log.error("Error eliminando grupo:", error);
      return { error: getGroupActionErrorMessage(error) };
    }
  });
}
