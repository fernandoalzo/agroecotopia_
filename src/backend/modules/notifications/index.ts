import { NotificationsRepository } from "./notifications.repository";
import { GroupsRepository } from "./groups.repository";
import { AudienceResolver } from "./audience-resolver";
import { NotificationsService } from "./notifications.service";
import { GroupsService } from "./groups.service";

// 1. Repositories
export const notificationsRepository = new NotificationsRepository();
export const groupsRepository = new GroupsRepository();

// 2. Cross-cutting/Strategy Components
export const audienceResolver = new AudienceResolver(groupsRepository, notificationsRepository);

// 3. Services (injecting repos and resolvers)
export const notificationsService = new NotificationsService(notificationsRepository, audienceResolver);
export const groupsService = new GroupsService(groupsRepository);
