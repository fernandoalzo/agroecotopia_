"use server";

import { withAuth } from "@/lib/auth-guards";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/ai.actions.ts");

export async function aiChatAction(_conversationId: string, _message: string) {
  return withAuth(async () => {
    log.info("[AI Action] aiChatAction — NO IMPLEMENTADO. Active el módulo AI para usar esta función.");
    return {
      error: "El módulo de IA no está activo. Consulte la documentación de FASE IA para más información.",
    };
  });
}

export async function aiSemanticSearchAction(_query: string) {
  return withAuth(async () => {
    log.info("[AI Action] aiSemanticSearchAction — NO IMPLEMENTADO.");
    return { results: [], error: "Búsqueda semántica no activa." };
  });
}

export async function aiGenerateDescriptionAction(
  _data: { name: string; category: string; tags: string[] },
) {
  return withAuth(async () => {
    log.info("[AI Action] aiGenerateDescriptionAction — NO IMPLEMENTADO.");
    return { error: "Generación de descripciones no activa." };
  });
}

export async function aiModerateContentAction(_content: string) {
  return withAuth(async () => {
    log.info("[AI Action] aiModerateContentAction — NO IMPLEMENTADO.");
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
  return withAuth(async () => {
    return {
      moduleActive: false,
      provider: null,
      message: "Módulo AI presente pero no activo. Configure AI_ENABLED=true para activarlo.",
    };
  });
}
