import { z } from "zod";

export const postSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres").max(200, "El título es demasiado largo"),
  body: z.string().min(20, "La descripción debe tener al menos 20 caracteres para ser útil"),
  labels: z.array(z.string()).min(1, "Selecciona al menos una etiqueta").max(5, "No puedes seleccionar más de 5 etiquetas")
});

export type PostSchema = z.infer<typeof postSchema>;
