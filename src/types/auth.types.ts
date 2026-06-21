// Source: src/backend/prisma/schema/auth.model.prisma
export const Role = {
  admin: "admin",
  user: "user",
  seller: "seller",
} as const;

export type Role = keyof typeof Role;

export type AuthMode = "login" | "register";

export interface FormField {
  name: "name" | "email" | "password" | "confirmPassword";
  type: string;
  label: string;
  placeholder: string;
  icon: any; // Lucide icon component
  showIn: AuthMode[];
}
