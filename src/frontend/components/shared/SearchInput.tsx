"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onClear?: () => void;
  containerClassName?: string;
  inputClassName?: string;
  showClearButton?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  onClear,
  containerClassName,
  inputClassName,
  showClearButton = true,
}: SearchInputProps) {
  const hasValue = value.trim().length > 0;

  return (
    <div className={cn("relative", containerClassName)}>
      <div className="pointer-events-none absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-sm">
        <Search className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "relative z-0 w-full rounded-2xl border border-border/50 bg-card/50 py-3 pl-14 pr-11 text-sm font-medium placeholder:text-muted-foreground/50 shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all",
          inputClassName
        )}
      />
      {showClearButton && hasValue && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
