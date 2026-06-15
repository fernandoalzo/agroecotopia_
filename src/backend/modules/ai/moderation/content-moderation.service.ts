import type { AIProvider, ModerationResult, ModerationOptions } from "../providers/types";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/moderation/content-moderation.service.ts");

export class ContentModerationService {
  constructor(private provider: AIProvider) {}

  async moderate(content: string, options?: ModerationOptions): Promise<ModerationResult> {
    if (!this.provider.moderate) {
      log.warn("[Moderation] El proveedor activo no soporta moderación.");
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

  async moderateProductDescription(_description: string): Promise<ModerationResult> {
    log.info("[Moderation] moderateProductDescription placeholder.");
    return {
      isSpam: false,
      isOffensive: false,
      isHarmful: false,
      confidence: 1,
      reason: "Moderación no implementada — modo placeholder.",
    };
  }

  async moderateForumPost(_title: string, _body: string): Promise<ModerationResult> {
    log.info("[Moderation] moderateForumPost placeholder.");
    return {
      isSpam: false,
      isOffensive: false,
      isHarmful: false,
      confidence: 1,
      reason: "Moderación no implementada — modo placeholder.",
    };
  }
}
