import { AudienceType } from "@prisma/client";
import { GroupsRepository } from "./groups.repository";
import { NotificationsRepository } from "./notifications.repository";
import logger from "@/utils/logger";

const log = logger.child();

/**
 * AudienceResolver — Strategy-based audience resolution engine.
 *
 * Resolves an AudienceType + optional audienceRef into a concrete list of user IDs.
 * This is a pure resolution component with no business logic.
 *
 * Strategy Mapping:
 * - INDIVIDUAL → [audienceRef] (the userId itself)
 * - GROUP      → all member userIds from the referenced group
 * - BROADCAST  → empty array (lazy materialization — no recipients created upfront)
 */
export class AudienceResolver {
  constructor(
    private groupsRepository: GroupsRepository,
    private notificationsRepository: NotificationsRepository,
  ) {}

  /**
   * Resolve an audience type to a list of target user IDs.
   *
   * @param audienceType - The type of audience to resolve
   * @param audienceRef - Reference ID (userId for INDIVIDUAL, groupId for GROUP, null for BROADCAST)
   * @returns Array of user IDs that should receive the notification
   */
  async resolve(audienceType: AudienceType, audienceRef?: string | null): Promise<string[]> {
    log.debug("Resolviendo audiencia:", { audienceType, audienceRef });

    switch (audienceType) {
      case AudienceType.INDIVIDUAL:
        return this.resolveIndividual(audienceRef);

      case AudienceType.GROUP:
        return this.resolveGroup(audienceRef);

      case AudienceType.BROADCAST:
        return this.resolveBroadcast();

      default: {
        log.error("Tipo de audiencia desconocido:", { audienceType });
        throw new Error(`UNKNOWN_AUDIENCE_TYPE: ${audienceType}`);
      }
    }
  }

  /**
   * INDIVIDUAL: Returns a single-element array with the target userId.
   * @throws Error if audienceRef is not provided
   */
  private resolveIndividual(audienceRef?: string | null): string[] {
    if (!audienceRef) {
      throw new Error("AUDIENCE_REF_REQUIRED: audienceRef (userId) es obligatorio para INDIVIDUAL");
    }
    log.debug("Audiencia resuelta: INDIVIDUAL →", { targetUserId: audienceRef });
    return [audienceRef];
  }

  /**
   * GROUP: Queries group membership and returns all member user IDs.
   * @throws Error if audienceRef (groupId) is not provided or group doesn't exist
   */
  private async resolveGroup(audienceRef?: string | null): Promise<string[]> {
    if (!audienceRef) {
      throw new Error("AUDIENCE_REF_REQUIRED: audienceRef (groupId) es obligatorio para GROUP");
    }

    const memberIds = await this.groupsRepository.findMemberIdsByGroupId(audienceRef);

    if (memberIds.length === 0) {
      log.warn("El grupo no tiene miembros o no existe:", { groupId: audienceRef });
    }

    log.debug("Audiencia resuelta: GROUP →", { groupId: audienceRef, memberCount: memberIds.length });
    return memberIds;
  }

  /**
   * BROADCAST: Returns an empty array.
   *
   * Broadcast notifications use LAZY MATERIALIZATION:
   * - No NotificationRecipient rows are created at dispatch time
   * - The notification is stored with audienceType=BROADCAST
   * - When users query their notifications, broadcast entries are merged virtually
   * - A NotificationRecipient is only created when a user marks a broadcast as read
   *
   * This enables O(1) broadcast dispatch regardless of user count.
   */
  private resolveBroadcast(): string[] {
    log.debug("Audiencia resuelta: BROADCAST → lazy materialization (0 recipients creados)");
    return [];
  }
}
