import type { AIProvider, ModerationResult, ModerationOptions } from "../providers/types";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/moderation/content-moderation.service.ts");

export class ContentModerationService {
  constructor(private provider: AIProvider) {}

  async moderate(content: string, options?: ModerationOptions): Promise<ModerationResult> {
    if (!this.provider.moderate) {
      log.warn("🤖 [Moderation] El proveedor activo no soporta moderación.");
      return {
        isSpam: false,
        isOffensive: false,
        isHarmful: false,
        confidence: 0,
        reason: "Moderación no disponible para el proveedor actual.",
      };
    }

    return this.provider.moderate(content, options);
  }

  async moderateProductDescription(description: string): Promise<ModerationResult> {
    return this.moderate(description);
  }

  async moderateForumPost(title: string, body: string): Promise<ModerationResult> {
    const contentToModerate = `Título: ${title}\nCuerpo: ${body}`;
    try {
      return await this.moderate(contentToModerate);
    } catch (error) {
      log.error("🤖 [Moderation] Error en moderateForumPost, activando fallback:", error);
      return {
        isSpam: false,
        isOffensive: false,
        isHarmful: false,
        confidence: 0,
        reason: "Fallback activado por error en el servicio de moderación.",
      };
    }
  }
}
