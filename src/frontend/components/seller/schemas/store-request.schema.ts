import { z } from "zod";

export const storeRequestSchema = z.object({
  name: z.string().min(3, "El nombre de la tienda debe tener al menos 3 caracteres."),
  description: z.string().min(20, "Por favor, danos una descripción más detallada (mínimo 20 caracteres)."),
  phone: z.string().min(7, "Ingresa un número de teléfono válido (mínimo 7 dígitos).").optional().or(z.literal("")),
  email: z.string().email("Ingresa un correo electrónico válido.").optional().or(z.literal("")),
  address: z.string().min(5, "La dirección debe ser más descriptiva (mínimo 5 caracteres).").optional().or(z.literal("")),
  city: z.string().min(3, "La ciudad debe tener al menos 3 caracteres.").optional().or(z.literal("")),
});

export type StoreRequestFormInput = z.infer<typeof storeRequestSchema>;
