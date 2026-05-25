"use client";

import { Star, Award, User } from "lucide-react";
import { Answer } from "./forum.types";
import { cn } from "@/lib/utils";

interface ForumAnswerCardProps {
  answer: Answer;
  onRate: (id: string, rating: number) => void;
}

export default function ForumAnswerCard({ answer, onRate }: ForumAnswerCardProps) {
  return (
    <div className={cn(
      "bg-card/50 backdrop-blur-md border rounded-3xl overflow-hidden shadow-sm",
      answer.isAccepted ? "border-accent/30 shadow-[0_0_15px_rgba(var(--color-accent),0.1)]" : "border-border/50"
    )}>
      <div className="p-6">
        {answer.isAccepted && (
          <div className="flex items-center gap-2 text-accent mb-4 text-xs font-black uppercase tracking-wider">
            <Award className="w-4 h-4" />
            Respuesta Aceptada
          </div>
        )}

        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-[15px] mb-6">
          {answer.content}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Star Rating */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => onRate(answer.id, star)}
                  className="transition-all hover:scale-125"
                >
                  <Star
                    className={`w-4 h-4 transition-colors ${
                      star <= Math.round(answer.ratingTotal)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-none text-muted-foreground/40 hover:text-amber-300"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-muted-foreground ml-1.5">
                {answer.ratingTotal.toFixed(1)}
              </span>
              <span className="text-[10px] text-muted-foreground/60 ml-0.5">
                ({answer.ratingCount})
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
              <button className="hover:text-foreground transition-colors">Responder</button>
              <button className="hover:text-foreground transition-colors">Compartir</button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="font-bold text-foreground text-sm block">{answer.author}</span>
              <span className="text-[10px] uppercase font-black tracking-wider text-primary">{answer.authorRole}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground border border-border overflow-hidden">
              {answer.authorImage ? (
                <img src={answer.authorImage} alt={answer.author} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
