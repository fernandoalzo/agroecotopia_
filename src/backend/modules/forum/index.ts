import { ForumRepository } from "./forum.repository";
import { ForumService } from "./forum.service";

export const forumRepository = new ForumRepository();
export const forumService = new ForumService(forumRepository);
