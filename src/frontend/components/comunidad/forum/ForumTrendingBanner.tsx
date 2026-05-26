"use client";

import { Flame } from "lucide-react";

interface ForumTrendingBannerProps {
  tags: string[];
}

export default function ForumTrendingBanner({ tags }: ForumTrendingBannerProps) {
  if (tags.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 text-primary font-bold mb-4">
        <Flame className="w-5 h-5 animate-pulse" />
        <h2 className="text-lg">Tendencias esta semana</h2>
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
