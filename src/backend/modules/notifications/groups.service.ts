import { GroupsRepository } from "./groups.repository";
import logger from "@/utils/logger";

const log = logger.child();

export class GroupsService {
  constructor(private repo: GroupsRepository) {}

  async createGroup(data: { name: string; description?: string | null; createdBy: string }) {
    // Business logic check: ensure name is unique
    const existing = await this.repo.findGroupByName(data.name);
    if (existing) {
      log.warn("Intento de crear grupo con nombre duplicado:", { name: data.name });
      throw new Error("GROUP_NAME_ALREADY_EXISTS");
    }

    return await this.repo.createGroup(data);
  }

  async getGroupById(id: string) {
    const group = await this.repo.findGroupById(id);
    if (!group) {
      throw new Error("GROUP_NOT_FOUND");
    }
    return group;
  }

  async getAllGroups() {
    return await this.repo.findAllGroups();
  }

  async updateGroup(id: string, data: Record<string, unknown>) {
    await this.getGroupById(id); // Ensure exists
    return await this.repo.updateGroup(id, data);
  }

  async deleteGroup(id: string) {
    await this.getGroupById(id); // Ensure exists
    return await this.repo.deleteGroup(id);
  }

  // ─── Membership ─────────────────────────────────────────

  async addMember(groupId: string, userId: string) {
    // Check if group exists
    await this.getGroupById(groupId);

    // Check if already a member
    const isMember = await this.repo.isMember(groupId, userId);
    if (isMember) {
      log.info("Usuario ya es miembro del grupo, ignorando adición.", { groupId, userId });
      return;
    }

    return await this.repo.addMember(groupId, userId);
  }

  async removeMember(groupId: string, userId: string) {
    // Check if group exists
    await this.getGroupById(groupId);

    // Ensure member exists before attempting removal
    const isMember = await this.repo.isMember(groupId, userId);
    if (!isMember) {
      throw new Error("USER_NOT_IN_GROUP");
    }

    return await this.repo.removeMember(groupId, userId);
  }

  async getGroupMembers(groupId: string) {
    await this.getGroupById(groupId); // Ensure exists
    return await this.repo.findMembersByGroupId(groupId);
  }

  async getMyGroups(userId: string) {
    return await this.repo.findGroupsByUserId(userId);
  }
}
