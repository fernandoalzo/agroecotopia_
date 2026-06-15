import type { AIProvider, AIProviderConfig, ProviderName } from "./types";
import { PROVIDER_DEFAULTS } from "./types";
import { DeepSeekProvider } from "./deepseek";
import { OpenAIProvider } from "./openai";
import { OllamaProvider } from "./ollama";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/providers/factory.ts");

type ProviderConstructor = new (config: AIProviderConfig) => AIProvider;

export class AIProviderFactory {
  private static registry: Map<ProviderName, ProviderConstructor> = new Map<ProviderName, ProviderConstructor>([
    ["deepseek", DeepSeekProvider],
    ["openai", OpenAIProvider],
    ["ollama", OllamaProvider],
  ]);

  static create(
    name: ProviderName,
    overrides?: Partial<AIProviderConfig>,
  ): AIProvider {
    const ProviderClass = AIProviderFactory.registry.get(name);

    if (!ProviderClass) {
      const available = [...AIProviderFactory.registry.keys()].join(", ");
      throw new Error(
        `AIProviderFactory: provider "${name}" no registrado. Disponibles: ${available}`,
      );
    }

    const defaults = PROVIDER_DEFAULTS[name];
    if (!defaults) {
      throw new Error(
        `AIProviderFactory: no hay defaults configurados para "${name}".`,
      );
    }

    const apiKey = overrides?.apiKey || process.env[`${name.toUpperCase()}_API_KEY`] || "";

    const config: AIProviderConfig = {
      apiKey,
      baseUrl: overrides?.baseUrl || defaults.baseUrl || "",
      defaultModel: overrides?.defaultModel || defaults.defaultModel || "",
      embeddingModel: overrides?.embeddingModel || defaults.embeddingModel || "",
      maxRetries: overrides?.maxRetries ?? 3,
      timeout: overrides?.timeout ?? 30000,
    };

    log.info("🤖 Creando proveedor AI:", {
      provider: name,
      baseUrl: config.baseUrl,
      model: config.defaultModel,
    });

    return new ProviderClass(config);
  }

  static registerProvider(
    name: ProviderName,
    providerClass: ProviderConstructor,
  ): void {
    log.info("🤖 Registrando proveedor AI dinámico:", { provider: name });
    AIProviderFactory.registry.set(name, providerClass);
  }

  static getAvailableProviders(): ProviderName[] {
    return [...AIProviderFactory.registry.keys()];
  }
}
