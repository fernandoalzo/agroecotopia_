import React from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface AccessDeniedViewProps {
  onGoHome: () => void;
}

export function AccessDeniedView({ onGoHome }: AccessDeniedViewProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-6 text-center text-foreground pt-14 md:pt-20">
      <div className="p-4 bg-destructive/15 rounded-full text-destructive mb-6">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-2xl font-bold font-display tracking-tight mb-2">Acceso Denegado</h1>
      <p className="text-muted-foreground max-w-sm mb-8 text-sm">
        No tienes permisos de administrador para acceder a este panel de chat.
      </p>
      <button
        onClick={onGoHome}
        className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Inicio
      </button>
    </div>
  );
}
