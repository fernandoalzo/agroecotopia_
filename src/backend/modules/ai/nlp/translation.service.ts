import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/nlp/translation.service.ts");

export type SupportedLocale = "es" | "en" | "pt" | "fr";

export class TranslationService {
  async translate(
    _text: string,
    _targetLocale: SupportedLocale,
    _sourceLocale?: SupportedLocale,
  ): Promise<string> {
    log.info("🤖 [Translation] Service placeholder — implementar cuando se active.");
    throw new Error("TranslationService no implementado. Active AI_FEATURE_TRANSLATION para usarlo.");
  }

  async detectLanguage(_text: string): Promise<SupportedLocale> {
    log.info("🤖 [Translation] detectLanguage placeholder.");
    return "es";
  }
}
