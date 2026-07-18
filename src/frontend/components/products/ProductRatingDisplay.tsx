"use client";

import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface ProductRatingDisplayProps {
  average: number;
  count: number;
  distribution?: Record<number, number>;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  showDistribution?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { star: "w-3 h-3", text: "text-[10px]", gap: "gap-0.5", bar: "h-1.5" },
  md: { star: "w-4 h-4", text: "text-sm", gap: "gap-1", bar: "h-2" },
  lg: { star: "w-5 h-5", text: "text-base", gap: "gap-1", bar: "h-2.5" },
};

export function ProductRatingDisplay({
  average,
  count,
  distribution,
  size = "md",
  showCount = true,
  showDistribution = false,
  className,
}: ProductRatingDisplayProps) {
  const { language } = useLanguage();
  const s = sizeMap[size];

  const fullStars = Math.floor(average);
  const hasHalf = average - fullStars >= 0.25 && average - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  const totalDistributionVotes = distribution
    ? Object.values(distribution).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className={cn("flex items-center", s.gap)}>
        <div className={cn("flex text-[#ffa41c]", s.gap)}>
          {[...Array(fullStars)].map((_, i) => (
            <Star key={`full-${i}`} className={cn(s.star, "fill-current")} />
          ))}
          {hasHalf && <StarHalf className={cn(s.star, "fill-current")} />}
          {[...Array(emptyStars)].map((_, i) => (
            <Star key={`empty-${i}`} className={cn(s.star, "text-muted-foreground/20")} />
          ))}
        </div>
        <span className={cn("font-semibold text-muted-foreground ml-1", s.text)}>
          {average.toFixed(1)}
        </span>
        {showCount && count > 0 && (
          <span className={cn("text-muted-foreground/60 ml-1", s.text)}>
            ({count})
          </span>
        )}
      </div>

      {showDistribution && distribution && totalDistributionVotes > 0 && (
        <div className="mt-3 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const votes = distribution[star] || 0;
            const percentage = totalDistributionVotes > 0
              ? (votes / totalDistributionVotes) * 100
              : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-right font-medium text-muted-foreground">{star}</span>
                <Star className="w-3 h-3 text-[#ffa41c] fill-current" />
                <div className="flex-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn("bg-[#ffa41c] rounded-full transition-all", s.bar)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground/60">{votes}</span>
              </div>
            );
          })}
        </div>
      )}

      {count === 0 && (
        <p className={cn("text-muted-foreground/50", s.text)}>
          {language === "es" ? "Sin calificaciones" : "No ratings yet"}
        </p>
      )}
    </div>
  );
}
