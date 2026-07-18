"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, MessageSquare, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProductRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productEmoji?: string;
  productImage?: string | null;
  initialScore?: number;
  initialComment?: string;
  isSubmitting: boolean;
  onSubmit: (score: number, comment: string) => Promise<void>;
}

const STAR_COLORS = [
  "text-rose-500 dark:text-rose-400",
  "text-orange-500 dark:text-orange-400",
  "text-amber-500 dark:text-amber-400",
  "text-yellow-500 dark:text-yellow-400",
  "text-emerald-500 dark:text-emerald-400"
];

const STAR_GLOWS = [
  "drop-shadow-[0_0_8px_rgba(244,63,94,0.45)]",
  "drop-shadow-[0_0_8px_rgba(249,115,22,0.45)]",
  "drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]",
  "drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]",
  "drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
];

const STAR_LABELS_ES = ["Muy malo", "Malo", "Regular", "Bueno", "Excelente"];
const STAR_LABELS_EN = ["Very bad", "Bad", "Average", "Good", "Excellent"];

export function ProductRatingModal({
  open,
  onOpenChange,
  productName,
  productEmoji,
  productImage,
  initialScore = 0,
  initialComment = "",
  isSubmitting,
  onSubmit,
}: ProductRatingModalProps) {
  const { language } = useLanguage();
  const [score, setScore] = useState(initialScore);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState(initialComment);

  const handleSubmit = async () => {
    if (score < 1) return;
    await onSubmit(score, comment);
    setScore(0);
    setComment("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setScore(0);
      setComment("");
    }
    onOpenChange(open);
  };

  const activeScore = hoveredStar > 0 ? hoveredStar : score;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md border-border/80 bg-background/95 backdrop-blur-lg shadow-2xl p-6 rounded-2xl flex flex-col gap-5">
        <DialogHeader className="space-y-3 pb-1 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/10">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/80">
                {language === "es" ? "Calificar producto" : "Rate product"}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {language === "es"
              ? "Comparte tu opinión sobre este producto para ayudar a la comunidad"
              : "Share your opinion about this product to help the community"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3.5 p-3.5 bg-card/65 border border-border/60 rounded-xl shadow-sm">
          {productImage ? (
            <img
              src={productImage}
              alt={productName}
              className="w-12 h-12 object-cover rounded-xl shadow-sm border border-border/50 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center text-2xl shadow-sm border border-border/50 shrink-0">
              {productEmoji || "📦"}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-sm text-foreground tracking-tight truncate">{productName}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 py-3 bg-secondary/20 dark:bg-secondary/10 rounded-2xl border border-border/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {language === "es" ? "Tu calificación" : "Your rating"}
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const isStarred = star <= activeScore;
              const starColor = isStarred
                ? STAR_COLORS[activeScore - 1]
                : "text-muted-foreground/20 hover:text-amber-400/40";
              const starGlow = isStarred ? STAR_GLOWS[activeScore - 1] : "";

              return (
                <motion.button
                  key={star}
                  type="button"
                  whileHover={{ scale: 1.25, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setScore(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-all duration-150 p-1 relative outline-none cursor-pointer"
                >
                  <Star
                    className={cn(
                      "w-9 h-9 transition-colors duration-150",
                      isStarred ? "fill-current" : "fill-none",
                      starColor,
                      starGlow
                    )}
                  />
                </motion.button>
              );
            })}
          </div>
          {activeScore > 0 && (
            <motion.p
              key={activeScore}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "text-xs font-bold text-center mt-1 transition-colors duration-150",
                STAR_COLORS[activeScore - 1]
              )}
            >
              {language === "es" ? STAR_LABELS_ES[activeScore - 1] : STAR_LABELS_EN[activeScore - 1]}
            </motion.p>
          )}
        </div>

        <AnimatePresence initial={false}>
          {score > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden space-y-1.5"
            >
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-muted-foreground/60" />
                  {language === "es" ? "Comentario (opcional)" : "Comment (optional)"}
                </label>
              </div>
              <div className="relative group">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder={
                    language === "es"
                      ? "Cuéntanos qué te pareció el producto..."
                      : "Tell us what you thought about the product..."
                  }
                  className="w-full rounded-xl border border-border/80 bg-background/50 focus:bg-background px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all duration-200 leading-relaxed placeholder:text-muted-foreground/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]"
                />
                <span className="absolute bottom-2.5 right-3 text-[9px] text-muted-foreground/40 font-semibold group-focus-within:text-muted-foreground/60 transition-colors">
                  {comment.length}/500
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 pt-2 border-t border-border/40">
          <Button
            variant="outline"
            className="flex-1 rounded-xl py-5 border-border/80 hover:bg-secondary/40 text-muted-foreground font-semibold transition-all duration-200"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {language === "es" ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            className="flex-1 rounded-xl py-5 font-bold bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/95 hover:to-emerald-600/95 text-white shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
            onClick={handleSubmit}
            disabled={score < 1 || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {language === "es" ? "Enviando..." : "Sending..."}
              </span>
            ) : (
              language === "es" ? "Enviar calificación" : "Submit rating"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
