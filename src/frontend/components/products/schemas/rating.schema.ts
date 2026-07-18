import { z } from "zod";

export const ratingSchema = z.object({
  score: z.number()
    .min(1, "La calificación mínima es 1 estrella")
    .max(5, "La calificación máxima es 5 estrellas"),
  comment: z.string()
    .max(500, "El comentario no puede exceder los 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type RatingFormValues = z.infer<typeof ratingSchema>;
