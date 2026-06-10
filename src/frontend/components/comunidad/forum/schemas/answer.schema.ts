import { z } from "zod";
import type { Translations } from "@/frontend/architecture/languages/types";

export function createAnswerSchema(t: Translations["forum"]) {
  return z.object({
    content: z
      .string()
      .min(10, t.answer.minLengthError)
      .max(2000, t.answer.maxLengthError),
  });
}

export type AnswerFormData = z.infer<ReturnType<typeof createAnswerSchema>>;
