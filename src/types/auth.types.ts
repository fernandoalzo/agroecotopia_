export type AuthMode = "login" | "register";

export interface FormField {
  name: "name" | "email" | "password" | "confirmPassword";
  type: string;
  label: string;
  placeholder: string;
  icon: any; // Lucide icon component
  showIn: AuthMode[];
}
