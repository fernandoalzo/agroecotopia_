import { z } from "zod";
import type { Translations } from "@/frontend/architecture/languages/types";
import { config } from "@/config/config";

export function createAnswerSchema(t: Translations["forum"]) {
  return z.object({
    content: z
      .string()
      .min(config.forum.validation.answer.contentMin, t.answer.minLengthError)
      .max(config.forum.validation.answer.contentMax, t.answer.maxLengthError),
  });
}

export type AnswerFormData = z.infer<ReturnType<typeof createAnswerSchema>>;
