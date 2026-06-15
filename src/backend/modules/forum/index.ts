import { ForumRepository } from "./forum.repository";
import { ForumService } from "./forum.service";
import { CacheService } from "@/backend/cache";
import { userRepository } from "@/backend/modules/user";

const cacheService = new CacheService();

export const forumRepository = new ForumRepository(cacheService);
export const forumService = new ForumService(forumRepository, userRepository);
