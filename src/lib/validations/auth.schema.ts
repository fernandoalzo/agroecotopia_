import { z } from "zod";

/**
 * Common validation rules for authentication.
 */
export const LoginSchema = z.object({
  email: z.string().email({ message: "Formato de correo inválido" }),
  password: z.string().min(1, { message: "La contraseña es requerida" }),
});

export const RegisterSchema = z.object({
  name: z.string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(50, { message: "El nombre es demasiado largo" }),
  email: z.string().email({ message: "Formato de correo inválido" }),
  password: z.string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .max(100, { message: "La contraseña es demasiado larga" }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
