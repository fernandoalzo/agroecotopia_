import { z } from "zod";

export const answerSchema = z.object({
  content: z.string().min(10, "La respuesta debe tener al menos 10 caracteres").max(2000, "La respuesta es demasiado larga")
});

export type AnswerSchema = z.infer<typeof answerSchema>;
