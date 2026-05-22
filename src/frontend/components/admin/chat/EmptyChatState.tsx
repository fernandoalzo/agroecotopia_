import React from "react";
import { MessageSquare, Sparkles } from "lucide-react";

export function EmptyChatState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
      <div className="p-5 bg-secondary/50 rounded-full text-muted-foreground/80 mb-5 relative">
        <MessageSquare className="w-10 h-10" />
        <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
      </div>
      <h2 className="text-foreground/90 font-semibold font-display mb-1 text-base">Comienza a Chatear</h2>
      <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
        Selecciona una conversación de la barra lateral para ver los mensajes y responder en tiempo real.
      </p>
    </div>
  );
}
