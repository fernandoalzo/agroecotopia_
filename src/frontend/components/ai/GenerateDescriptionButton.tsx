"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerateDescriptionButtonProps {
  name: string;
  categories: string[];
  tags: string;
  onGenerate: (name: string, categories: string[], tags: string) => Promise<string>;
  onGenerated: (description: string) => void;
  disabled?: boolean;
}

export const GenerateDescriptionButton = ({
  name,
  categories,
  tags,
  onGenerate,
  onGenerated,
  disabled,
}: GenerateDescriptionButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!name.trim()) {
      setError("Completa el nombre del producto primero.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const description = await onGenerate(name.trim(), categories, tags);
      if (description) {
        onGenerated(description);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar la descripción.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={loading || disabled}
        className="text-xs font-bold text-primary hover:text-primary/80 hover:bg-primary/5 gap-1.5 px-2 py-1 h-auto rounded-lg w-fit"
      >
        {loading ? (
          <>
            <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3" />
            Generar con IA
          </>
        )}
      </Button>
      {error && (
        <p className="text-[10px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
};
