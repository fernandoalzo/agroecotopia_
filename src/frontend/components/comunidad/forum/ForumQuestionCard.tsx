"use client";

import { motion } from "framer-motion";
import { Flame, MessageCircle, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { Question } from "./forum.types";

interface ForumQuestionCardProps {
  question: Question;
  onRate: (id: string, rating: number) => void;
}

export default function ForumQuestionCard({ question, onRate }: ForumQuestionCardProps) {
  const router = useRouter();

  return (
    <motion.div
      layoutId={`post-${question.id}`}
      className="bg-card/50 backdrop-blur-md border border-border/50 rounded-3xl overflow-hidden hover:border-primary/30 transition-all group shadow-sm hover:shadow-md"
    >
      <div
        className="p-4 md:p-6 cursor-pointer"
        onClick={() => router.push(`/comunidad/post/${question.id}`)}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span className="font-bold text-foreground/80">{question.author}</span>
          <span>•</span>
          <span>{question.timestamp}</span>
          {question.isTrending && (
            <>
              <span>•</span>
              <span className="text-red-500 flex items-center gap-1 font-bold">
                <Flame className="w-3 h-3" /> Hot
              </span>
            </>
          )}
        </div>

        <h3 className="text-xl font-bold text-foreground mb-2 leading-tight group-hover:text-primary transition-colors">
          {question.title}
        </h3>

        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed">
          {question.body}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 rounded-full border border-primary/20">
              {question.plantType}
            </span>
            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 rounded-full border border-accent/20">
              {question.soilType}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Star Rating */}
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={(e) => { e.stopPropagation(); onRate(question.id, star); }}
                    className="transition-all hover:scale-125"
                  >
                    <Star
                      className={`w-4 h-4 transition-colors ${star <= Math.round(question.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-none text-muted-foreground/40 hover:text-amber-300"
                        }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-muted-foreground ml-1">
                {question.rating.toFixed(1)}
              </span>
            </div>

            {/* Answers Count */}
            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground/70 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-bold">{question.answers.length}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
