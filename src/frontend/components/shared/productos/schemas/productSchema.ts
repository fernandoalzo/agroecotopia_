import { z } from "zod";

export const getProductSchema = (t: any) => z.object({
  name: z.string().min(3, t?.product?.validation?.nameMin || "El nombre debe tener al menos 3 caracteres"),
  description: z.string().min(10, t?.product?.validation?.descMin || "La descripción debe tener al menos 10 caracteres"),
  price: z.coerce.number().min(0, t?.product?.validation?.priceNegative || "El precio no puede ser negativo"),
  stock: z.coerce.number().min(0, t?.product?.validation?.stockNegative || "El stock no puede ser negativo"),
  categories: z.array(z.string()).min(1, t?.product?.validation?.categoriesMin || "Debe seleccionar al menos una categoría"),
  unidad: z.string().min(1, t?.product?.validation?.unitRequired || "Unidad es obligatoria (ej. kg, ud)"),
  tag: z.string().optional(),
  emoji: z.string().optional(),
  images: z.array(z.string()).optional(),
  peso: z.coerce.number().min(0, t?.product?.validation?.weightNegative || "El peso no puede ser negativo").optional(),
  dimensiones: z.string().optional(),
  envioGratis: z.boolean().default(false),
});

export type ProductFormValues = z.infer<ReturnType<typeof getProductSchema>>;

