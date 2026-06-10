import { ForumRepository } from "./forum.repository";
import { ForumService } from "./forum.service";
import { CacheService } from "@/backend/cache";

const cacheService = new CacheService();

export const forumRepository = new ForumRepository(cacheService);
export const forumService = new ForumService(forumRepository);
