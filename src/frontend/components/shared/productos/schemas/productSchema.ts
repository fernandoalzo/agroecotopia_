import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo"),
  categories: z.array(z.string()).min(1, "Debe seleccionar al menos una categoría"),
  unidad: z.string().min(1, "Unidad es obligatoria (ej. kg, ud)"),
  tag: z.string().optional(),
  emoji: z.string().optional(),
  images: z.array(z.string()).optional(),
  peso: z.coerce.number().min(0, "El peso no puede ser negativo").optional(),
  dimensiones: z.string().optional(),
  envioGratis: z.boolean().default(false),
});

export type ProductFormValues = z.infer<typeof productSchema>;
