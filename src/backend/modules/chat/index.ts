import { ChatRepository } from "./chat.repository";
import { ChatService } from "./chat.service";

export const chatRepository = new ChatRepository();
export const chatService = new ChatService(chatRepository);
