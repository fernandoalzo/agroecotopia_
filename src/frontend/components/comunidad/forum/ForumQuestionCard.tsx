"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Star, MessageCircle } from "lucide-react";
import { Question } from "./forum.types";
import { cn } from "@/lib/utils";
import { calculateBayesianAverage } from "@/utils/ratingSystem";

interface ForumQuestionCardProps {
  question: Question & { 
    ratingDistribution?: { 1: number, 2: number, 3: number, 4: number, 5: number } 
  };
  onRate: (id: string, rating: number) => void;
}

export default function ForumQuestionCard({ question, onRate }: ForumQuestionCardProps) {
  const router = useRouter();

  // Extract initials for avatar fallback
  const initials = question.author
    ? question.author.substring(0, 2).toUpperCase()
    : "US";

  // Calculate rating
  const displayRating = question.ratingDistribution 
    ? calculateBayesianAverage(question.ratingDistribution).bayesianAverage || question.ratingTotal
    : question.ratingTotal;

  const answersCount = question._count?.answers || question.answers?.length || 0;

  return (
    <motion.div
      layoutId={`post-${question.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col sm:flex-row gap-4 py-4 px-2 -mx-2 rounded-xl border-b border-border/50 hover:border-transparent hover:bg-gradient-to-r hover:from-primary/10 hover:via-primary/5 hover:to-transparent transition-all duration-500 cursor-pointer group"
      onClick={() => router.push(`/comunidad/post/${question.id}`)}
    >
      {/* Stats Column */}
      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0 sm:w-32 text-[13px] text-muted-foreground pt-1 pr-2">
        {/* Star Rating */}
        <div 
          className="flex items-center gap-1.5" 
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={(e) => { e.stopPropagation(); onRate(question.id, star); }}
                className="transition-all hover:scale-125 focus:outline-none"
              >
                <Star
                  className={cn(
                    "w-3.5 h-3.5 transition-all duration-300",
                    star <= Math.round(displayRating)
                      ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                      : "fill-none text-muted-foreground/30 hover:text-amber-300"
                  )}
                />
              </button>
            ))}
          </div>
          <span className="text-xs font-bold text-foreground/80 w-5 text-right">
            {displayRating.toFixed(1)}
          </span>
        </div>

        {/* Answers Count */}
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded",
          answersCount > 0 ? "text-primary border border-primary/30 bg-primary/5 font-medium" : "text-muted-foreground"
        )}>
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="text-xs">{answersCount} res</span>
        </div>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Title */}
        <h3 className="text-[17px] font-medium text-foreground mb-1.5 leading-snug group-hover:text-primary transition-colors pr-4">
          {question.title}
        </h3>

        {/* Body Preview */}
        <div className="mb-2 text-[13px] text-muted-foreground line-clamp-2 leading-relaxed break-words break-all">
          {question.body}
        </div>

        {/* Footer: Labels & Author info */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-auto pt-1">
          {/* Labels */}
          <div className="flex flex-wrap gap-1.5">
            {question.labels.map((label) => (
              <span 
                key={label} 
                className="inline-flex items-center gap-0.5 px-2.5 py-0.5 text-[11px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20 border border-primary/10 hover:border-primary/20 rounded-md transition-all duration-300 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="text-primary/40 font-bold">#</span>
                {label}
              </span>
            ))}
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground ml-auto">
            <span className="text-foreground/90 font-medium hover:text-primary hover:underline transition-colors">{question.author}</span>
            <span className="text-muted-foreground/45">•</span>
            <span className="text-muted-foreground/80">
              {new Date(question.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
