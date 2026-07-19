import { ChatRepository } from "./chat.repository";
import { ChatService } from "./chat.service";
import { CacheService } from "@/backend/cache";

const cacheService = new CacheService();
export const chatRepository = new ChatRepository(cacheService);
export const chatService = new ChatService(chatRepository);
