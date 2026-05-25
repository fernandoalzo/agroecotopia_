"use client";

import { Flame } from "lucide-react";
import { trendingTags } from "./forum.types";

export default function ForumTrendingBanner() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 text-primary font-bold mb-4">
        <Flame className="w-5 h-5 animate-pulse" />
        <h2 className="text-lg">Tendencias esta semana</h2>
      </div>
      <div className="flex flex-wrap gap-4">
        {trendingTags.map(tag => (
          <span key={tag} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1">
            <span className="text-primary/50">#</span>{tag.replace('#', '')}
          </span>
        ))}
      </div>
    </div>
  );
}
