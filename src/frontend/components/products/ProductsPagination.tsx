"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductsPaginationProps {
  pageParam: number;
  totalPages: number;
  updateUrl: (query: string, page: number, limit: number) => void;
  isLoading: boolean;
  queryParam: string;
  limitParam: number;
  t: any;
}

export function ProductsPagination({
  pageParam,
  totalPages,
  updateUrl,
  isLoading,
  queryParam,
  limitParam,
  t,
}: ProductsPaginationProps) {
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, pageParam - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          disabled={isLoading}
          onClick={() => updateUrl(queryParam, i, limitParam)}
          className={cn(
            "w-10 h-10 rounded-xl font-bold transition-all active:scale-95",
            pageParam === i
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50"
          )}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-20 pt-10 border-t border-border/50">
      <div className="flex items-center gap-2">
        <button
          disabled={pageParam <= 1 || isLoading}
          onClick={() => updateUrl(queryParam, pageParam - 1, limitParam)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mx-2">
          {renderPageNumbers()}
        </div>

        <button
          disabled={pageParam >= totalPages || isLoading}
          onClick={() => updateUrl(queryParam, pageParam + 1, limitParam)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="text-sm text-muted-foreground font-body italic">
        Página <span className="text-foreground font-bold">{pageParam}</span> de {totalPages}
      </div>
    </div>
  );
}
