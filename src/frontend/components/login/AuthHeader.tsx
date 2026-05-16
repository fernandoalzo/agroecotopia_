"use client";

import { AuthMode } from "@/types/auth.types";

interface AuthHeaderProps {
  mode: AuthMode;
  t: any;
}

export function AuthHeader({ mode, t }: AuthHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-extrabold tracking-tight mb-2">
        {mode === "login"
          ? (t.auth?.welcome ?? "Bienvenido")
          : (t.auth?.registerPrompt ?? "Crear nueva cuenta")}
      </h2>
      <p className="text-muted-foreground text-sm font-medium">
        {mode === "login"
          ? (t.auth?.loginPrompt ?? "Ingresa tus datos para continuar")
          : "Completa tus datos para unirte"}
      </p>
    </div>
  );
}
