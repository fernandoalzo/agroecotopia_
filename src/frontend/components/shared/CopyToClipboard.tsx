"use client";

import React, { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyToClipboardProps {
  /** The text to copy to the clipboard */
  text: string;
  /** Duration in ms to show the success check icon (default: 2000) */
  feedbackDuration?: number;
  /** Icon size class (default: "h-3.5 w-3.5") */
  iconClassName?: string;
  /** Additional className for the button wrapper */
  className?: string;
  /** Accessible label (default: "Copiar al portapapeles") */
  ariaLabel?: string;
  /** Optional callback fired after a successful copy */
  onCopy?: () => void;
}

export function CopyToClipboard({
  text,
  feedbackDuration = 2000,
  iconClassName = "h-3.5 w-3.5",
  className,
  ariaLabel = "Copiar al portapapeles",
  onCopy,
}: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (copied) return; // prevent spamming while showing feedback
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), feedbackDuration);
    } catch {
      // silently fail – clipboard may not be available
    }
  }, [text, copied, feedbackDuration, onCopy]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-1 transition-all duration-200",
        "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
        "active:scale-90",
        copied && "text-emerald-500 hover:text-emerald-500",
        className,
      )}
    >
      {copied ? (
        <Check className={cn(iconClassName, "text-emerald-500 animate-in zoom-in-50 duration-200")} />
      ) : (
        <Copy className={cn(iconClassName, "animate-in fade-in duration-200")} />
      )}
    </button>
  );
}
