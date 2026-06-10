"use client";

import { Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";

interface ForumTrendingBannerProps {
  tags: string[];
  isLoading?: boolean;
}

export default function ForumTrendingBanner({ tags, isLoading }: ForumTrendingBannerProps) {
  const { t } = useLanguage();
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-5 w-44 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-5 w-24 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (tags.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 text-primary font-bold mb-4">
        <Flame className="w-5 h-5 animate-pulse" />
        <h2 className="text-lg">{t.forum.sidebar.trending}</h2>
      </div>
      <div className="flex flex-wrap gap-4">
        {tags.map(tag => (
          <span key={tag} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1">
            <span className="text-primary/50">#</span>{tag.replace('#', '')}
          </span>
        ))}
      </div>
    </div>
  );
}
