"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ChatMessageSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Reusable skeleton component simulating chat messages in loading state.
 */
export function ChatMessageSkeleton({ count = 4, className }: ChatMessageSkeletonProps) {
  const skeletonPatterns = [
    { isMe: false, lines: 1, width: "max-w-[50%] sm:max-w-[40%] md:max-w-[35%]" },
    { isMe: true, lines: 1, width: "max-w-[40%] sm:max-w-[30%] md:max-w-[25%]" },
    { isMe: false, lines: 2, width: "max-w-[60%] sm:max-w-[50%] md:max-w-[45%]" },
    { isMe: true, lines: 1, width: "max-w-[35%] sm:max-w-[25%] md:max-w-[20%]" },
    { isMe: false, lines: 1, width: "max-w-[45%] sm:max-w-[35%] md:max-w-[30%]" },
  ];

  const items = Array.from({ length: count }, (_, i) => skeletonPatterns[i % skeletonPatterns.length]);

  return (
    <div className={cn("flex-1 p-4 md:p-6 space-y-4 overflow-hidden bg-secondary/5 h-full min-h-0", className)}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className={cn(
            "flex flex-col w-full animate-pulse space-y-1.5",
            item.isMe ? "ml-auto items-end" : "mr-auto items-start",
            item.width
          )}
        >
          <div
            className={cn(
              "p-3 rounded-2xl space-y-1.5 w-full",
              item.isMe
                ? "bg-primary/20 rounded-tr-none border border-primary/10"
                : "bg-muted/60 dark:bg-muted/40 rounded-tl-none border border-border/40"
            )}
          >
            {item.lines === 2 ? (
              <>
                <div className="h-3 bg-foreground/15 rounded-md w-full" />
                <div className="h-3 bg-foreground/15 rounded-md w-2/3" />
              </>
            ) : (
              <div className="h-3 bg-foreground/15 rounded-md w-4/5" />
            )}
          </div>
          <div className="h-2 bg-muted-foreground/20 rounded w-10 px-1" />
        </div>
      ))}
    </div>
  );
}
