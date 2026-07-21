import { WhatsAppRepository } from "./whatsapp.repository";
import { WhatsAppService } from "./whatsapp.service";
import { CacheService } from "@/backend/cache";

const cacheService = new CacheService();
export const whatsappRepository = new WhatsAppRepository(cacheService);
export const whatsappService = new WhatsAppService(whatsappRepository);
