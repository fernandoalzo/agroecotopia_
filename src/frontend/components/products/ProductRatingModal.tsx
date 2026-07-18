"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const STAR_COLORS = ["text-red-500", "text-orange-500", "text-yellow-500", "text-lime-500", "text-emerald-500"];

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
  const { t, language } = useLanguage();
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

  const getStarColor = (star: number) => {
    const filled = star <= (hoveredStar || score);
    if (!filled) return "text-muted-foreground/20";
    return STAR_COLORS[star - 1];
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{language === "es" ? "Calificar producto" : "Rate product"}</DialogTitle>
          <DialogDescription>
            {language === "es"
              ? "Comparte tu opinión sobre este producto para ayudar a la comunidad"
              : "Share your opinion about this product to help the community"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
          {productImage ? (
            <img src={productImage} alt={productName} className="w-14 h-14 object-cover rounded-lg" />
          ) : (
            <span className="text-3xl">{productEmoji || "📦"}</span>
          )}
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{productName}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 py-4">
          <p className="text-sm font-semibold text-muted-foreground">
            {language === "es" ? "Tu calificación" : "Your rating"}
          </p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                type="button"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setScore(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className={`transition-colors ${getStarColor(star)} ${score >= star ? "drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : ""}`}
              >
                <Star
                  className={`w-10 h-10 ${(hoveredStar || score) >= star ? "fill-current" : "fill-none"}`}
                />
              </motion.button>
            ))}
          </div>
          {score > 0 && (
            <p className="text-sm font-bold text-muted-foreground">
              {score === 1 ? (language === "es" ? "Muy malo" : "Very bad") : ""}
              {score === 2 ? (language === "es" ? "Malo" : "Bad") : ""}
              {score === 3 ? (language === "es" ? "Regular" : "Average") : ""}
              {score === 4 ? (language === "es" ? "Bueno" : "Good") : ""}
              {score === 5 ? (language === "es" ? "Excelente" : "Excellent") : ""}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {language === "es" ? "Comentario (opcional)" : "Comment (optional)"}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={language === "es" ? "Cuéntanos qué te pareció el producto..." : "Tell us what you thought about the product..."}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-[10px] text-muted-foreground text-right">{comment.length}/500</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {language === "es" ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            className="flex-1 rounded-xl font-bold"
            onClick={handleSubmit}
            disabled={score < 1 || isSubmitting}
          >
            {isSubmitting
              ? (language === "es" ? "Enviando..." : "Sending...")
              : (language === "es" ? "Enviar calificación" : "Submit rating")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
