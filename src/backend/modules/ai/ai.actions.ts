"use server";

import { withAuth } from "@/lib/auth-guards";
import type { ChatMessage } from "./providers/types";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/ai.actions.ts");

export async function aiChatAction(
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>,
) {
  return withAuth(async (session) => {
    if (!message || message.trim().length === 0) {
      return { error: "El mensaje no puede estar vacío." };
    }

    try {
      const startTime = Date.now();

      const { aiService } = await import("@/backend/modules/ai");

      if (!aiService) {
        log.warn("🤖 [Action] aiChatAction: Módulo AI no activo");
        return {
          error: "El módulo de IA no está activo. Configure AI_ENABLED=true para activarlo.",
        };
      }

      const messages: ChatMessage[] = [
        ...(history ?? []).map(h => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user", content: message.trim() },
      ];

      const response = await aiService.ragChat(messages);

      const elapsed = Date.now() - startTime;
      log.info("🤖 [Action] aiChatAction completado:", {
        userId: session.user.id,
        tokens: response.tokens,
        elapsed: `${elapsed}ms`,
      });

      return {
        content: response.content,
        tokens: response.tokens,
        model: response.model,
      };
    } catch (error) {
      log.error("🤖 [Action] Error en aiChatAction:", error);
      return {
        error: error instanceof Error ? error.message : "Error al procesar la consulta con IA.",
      };
    }
  });
}

export async function* aiStreamChatAction(
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>,
) {
  try {
    const { authService } = await import("@/backend/modules/auth");
    const session = await authService.ensureAuthenticated();

    if (!message || message.trim().length === 0) {
      yield JSON.stringify({ error: "El mensaje no puede estar vacío." });
      return;
    }

    const { aiService } = await import("@/backend/modules/ai");

    if (!aiService) {
      log.warn("🤖 [Action] aiStreamChatAction: Módulo AI no activo");
      yield JSON.stringify({ error: "El módulo de IA no está activo." });
      return;
    }

    const messages: ChatMessage[] = [
      ...(history ?? []).map(h => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message.trim() },
    ];

    const stream = aiService.ragStreamChat(messages);
    for await (const chunk of stream) {
      // Usar yield simple para enviar el texto crudo. 
      // Next.js serializará esto al cliente.
      yield chunk;
    }

  } catch (error) {
    log.error("🤖 [Action] Error en aiStreamChatAction:", error);
    yield JSON.stringify({ error: error instanceof Error ? error.message : "Error al procesar la consulta." });
  }
}

export async function aiSemanticSearchAction(_query: string) {
  return withAuth(async () => {
    return { results: [], error: "Búsqueda semántica disponible vía los módulos de producto/foro." };
  });
}

export async function aiGenerateDescriptionAction(
  name: string,
  categories: string[],
  tags: string,
) {
  return withAuth(async () => {
    if (!name?.trim()) {
      return { error: "El nombre del producto es obligatorio." };
    }

    try {
      const { aiService } = await import("@/backend/modules/ai");

      if (!aiService) {
        log.warn("🤖 [Action] aiGenerateDescriptionAction: Módulo AI no activo");
        return {
          error: "El módulo de IA no está activo. Configure AI_ENABLED=true para activarlo.",
        };
      }

      const description = await aiService.generateProductDescription({ name, categories, tags });

      log.info("🤖 [Action] Descripción generada exitosamente", {
        productName: name,
        descriptionLength: description.length,
      });

      return { description };
    } catch (error) {
      log.error("🤖 [Action] Error generando descripción:", error);
      return {
        error: error instanceof Error ? error.message : "Error al generar la descripción.",
      };
    }
  });
}

export async function aiModerateContentAction(_content: string) {
  return withAuth(async () => {
    return {
      isSpam: false,
      isOffensive: false,
      isHarmful: false,
      confidence: 0,
      reason: "Moderación no activa.",
    };
  });
}

export async function aiCheckHealthAction() {
  try {
    const { aiService } = await import("@/backend/modules/ai");

    if (!aiService) {
      return {
        moduleActive: false,
        provider: null,
        message: "Módulo AI presente pero no activo. Configure AI_ENABLED=true para activarlo.",
      };
    }

    const available = await aiService.isAvailable();
    return {
      moduleActive: true,
      provider: process.env.AI_PROVIDER || "deepseek",
      available,
      message: available
        ? "🤖 Módulo AI activo y disponible."
        : "🤖 Módulo AI activo pero el proveedor no está disponible.",
    };
  } catch (error) {
    return {
      moduleActive: false,
      provider: null,
      message: `🤖 Módulo AI: error al verificar salud: ${error}`,
    };
  }
}
