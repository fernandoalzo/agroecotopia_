"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, MessageCircle, Star, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Question } from "./forum.types";
import { cn } from "@/lib/utils";
import { calculateBayesianAverage } from "@/utils/ratingSystem";

interface ForumQuestionCardProps {
  question: Question & { 
    // Añadimos opcionalmente la distribución para demostrar su uso
    ratingDistribution?: { 1: number, 2: number, 3: number, 4: number, 5: number } 
  };
  onRate: (id: string, rating: number) => void;
}

export default function ForumQuestionCard({ question, onRate }: ForumQuestionCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract initials for avatar fallback
  const initials = question.author
    ? question.author.substring(0, 2).toUpperCase()
    : "US";

  // Calculamos la calificación profesional usando el sistema que creamos en utils.
  // Si disponemos de la distribución detallada de votos desde el backend, usamos
  // el cálculo Bayesiano para mayor precisión y justicia en el ranking.
  // De lo contrario, usamos el ratingTotal como fallback.
  const displayRating = question.ratingDistribution 
    ? calculateBayesianAverage(question.ratingDistribution).bayesianAverage || question.ratingTotal
    : question.ratingTotal;

  return (
    <motion.div
      layoutId={`post-${question.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-card/80 bg-gradient-to-br from-card/80 to-background/40 backdrop-blur-xl border border-border/50 rounded-[32px] p-6 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden cursor-pointer isolate hover:-translate-y-1"
      onClick={() => router.push(`/comunidad/post/${question.id}`)}
    >
      {/* Premium Hover Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-accent/0 group-hover:from-primary/10 group-hover:via-transparent group-hover:to-accent/10 transition-all duration-500 -z-10" />
      
      {/* Decorative Top Highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex gap-5">
        {/* Author Avatar Column */}
        <div className="hidden sm:flex flex-col items-center gap-3 shrink-0 pt-1">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-background shadow-md shadow-black/5 group-hover:ring-2 ring-primary/20 transition-all duration-300 bg-secondary flex items-center justify-center">
            {question.authorImage ? (
              <img src={question.authorImage} alt={question.author} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-black text-muted-foreground">{initials}</span>
            )}
          </div>
        </div>

        {/* Main Content Column */}
        <div className="flex-1 min-w-0">
          {/* Meta header */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 sm:hidden">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-secondary flex items-center justify-center border border-border">
                {question.authorImage ? (
                  <img src={question.authorImage} alt={question.author} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[8px] font-black">{initials}</span>
                )}
              </div>
            </div>
            
            <span className="font-bold text-foreground/90">{question.author}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <time className="font-medium">{new Date(question.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
            
            {question.isTrending && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-[10px] tracking-widest uppercase border border-red-500/20">
                  <Flame className="w-3 h-3 animate-pulse" /> Hot
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors duration-300 pr-4">
            {question.title}
          </h3>

          {/* Body Preview */}
          <div className="mb-6">
            <p className={cn("text-muted-foreground/80 text-sm sm:text-base leading-relaxed break-words overflow-hidden whitespace-pre-wrap", !isExpanded && "line-clamp-2")}>
              {question.body}
            </p>
            {question.body.length > 150 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-primary text-sm font-bold mt-1 hover:underline focus:outline-none"
              >
                {isExpanded ? "Ver menos" : "Ver más"}
              </button>
            )}
          </div>

          {/* Footer: Labels & Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
            {/* Labels */}
            <div className="flex flex-wrap gap-2 flex-1">
              {question.labels.slice(0, 3).map((label) => (
                <span 
                  key={label} 
                  className="px-3 py-1 text-[11px] font-bold tracking-wide text-foreground/70 bg-secondary/60 hover:bg-secondary rounded-xl border border-border/40 transition-colors"
                >
                  {label}
                </span>
              ))}
              {question.labels.length > 3 && (
                <span className="px-3 py-1 text-[11px] font-bold tracking-wide text-muted-foreground bg-secondary/30 rounded-xl border border-border/30">
                  +{question.labels.length - 3}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5 shrink-0 bg-background/50 backdrop-blur px-4 py-2 rounded-2xl border border-border/40 shadow-sm">
              {/* Star Rating */}
              <div 
                className="flex items-center gap-2 group/rating relative" 
                onClick={(e) => {
                  e.stopPropagation();
                  // For a real premium feel, maybe open a small popover, but for now we keep the inline stars
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
                          "w-4 h-4 transition-all duration-300",
                          star <= Math.round(displayRating)
                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                            : "fill-none text-muted-foreground/30 hover:text-amber-300"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-black text-foreground/80 w-5">
                  {displayRating.toFixed(1)}
                </span>
              </div>

              <div className="w-[1px] h-4 bg-border/60" />

              {/* Answers Count */}
              <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors font-medium">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-bold">{question._count?.answers || question.answers?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
