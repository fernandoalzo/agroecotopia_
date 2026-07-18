"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Check, Loader2, Sparkles, MessageSquare, Award } from "lucide-react";
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

interface ProductRating {
  productId: string;
  productName: string;
  productEmoji?: string;
  productImage?: string | null;
  score: number;
  comment: string;
}

interface BulkRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Array<{
    productId: string;
    productName: string;
    productEmoji?: string;
    productImage?: string | null;
    pedidoId: string;
  }>;
  existingRatings?: Record<string, { score: number; comment?: string | null }>;
  onRate: (productId: string, pedidoId: string, score: number, comment: string) => Promise<void>;
}

const STAR_PALETTE = [
  {
    color: "text-rose-500",
    fill: "fill-rose-500",
    glow: "drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    label: { es: "Muy malo", en: "Very bad" },
  },
  {
    color: "text-orange-500",
    fill: "fill-orange-500",
    glow: "drop-shadow-[0_0_10px_rgba(249,115,22,0.6)]",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    label: { es: "Malo", en: "Bad" },
  },
  {
    color: "text-amber-500",
    fill: "fill-amber-500",
    glow: "drop-shadow-[0_0_10px_rgba(245,158,11,0.65)]",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: { es: "Regular", en: "Average" },
  },
  {
    color: "text-yellow-500",
    fill: "fill-yellow-500",
    glow: "drop-shadow-[0_0_10px_rgba(234,179,8,0.65)]",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: { es: "Bueno", en: "Good" },
  },
  {
    color: "text-emerald-500",
    fill: "fill-emerald-500",
    glow: "drop-shadow-[0_0_10px_rgba(16,185,129,0.65)]",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: { es: "Excelente", en: "Excellent" },
  },
];

export function BulkRatingModal({
  open,
  onOpenChange,
  products,
  existingRatings = {},
  onRate,
}: BulkRatingModalProps) {
  const { language } = useLanguage();
  const [hoveredStars, setHoveredStars] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const buildRatings = useCallback(
    () =>
      products.map((p) => {
        const existing = existingRatings[p.productId];
        return {
          productId: p.productId,
          productName: p.productName,
          productEmoji: p.productEmoji,
          productImage: p.productImage,
          score: existing?.score ?? 0,
          comment: existing?.comment ?? "",
        };
      }),
    [products, existingRatings]
  );

  const [ratings, setRatings] = useState<ProductRating[]>(buildRatings);

  // Sync ratings when existingRatings arrive asynchronously
  useEffect(() => {
    setRatings(buildRatings());
  }, [buildRatings]);

  const isExisting = useCallback(
    (productId: string) => productId in existingRatings,
    [existingRatings]
  );

  const updateScore = useCallback((productId: string, score: number) => {
    setRatings((prev) =>
      prev.map((r) => (r.productId === productId ? { ...r, score } : r))
    );
  }, []);

  const updateComment = useCallback((productId: string, comment: string) => {
    setRatings((prev) =>
      prev.map((r) => (r.productId === productId ? { ...r, comment } : r))
    );
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    const pedidoId = products[0]?.pedidoId;
    if (!pedidoId) return;

    try {
      const toRate = ratings.filter(
        (r) => r.score > 0 && !submittedIds.has(r.productId) && !isExisting(r.productId)
      );
      if (toRate.length === 0) {
        setError(
          language === "es"
            ? "Selecciona una calificación para al menos un producto."
            : "Select a rating for at least one product."
        );
        return;
      }
      for (const r of toRate) {
        await onRate(r.productId, pedidoId, r.score, r.comment);
        setSubmittedIds((prev) => new Set(prev).add(r.productId));
      }
      const totalHandled =
        submittedIds.size + toRate.length + Object.keys(existingRatings).length;
      if (totalHandled >= ratings.length) handleOpenChange(false);
    } catch {
      setError(
        language === "es"
          ? "Error al enviar calificaciones. Intenta de nuevo."
          : "Error submitting ratings. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalExisting = Object.keys(existingRatings).length;
  const pendingCount = ratings.length - submittedIds.size - totalExisting;
  const currentlyRated = submittedIds.size + totalExisting;
  const progressPct = ratings.length > 0 ? (currentlyRated / ratings.length) * 100 : 0;
  const allDone = pendingCount === 0 && ratings.length > 0;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setRatings(buildRatings());
      setSubmittedIds(new Set());
      setHoveredStars({});
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[88vh] overflow-hidden flex flex-col border-0 bg-transparent p-0 shadow-none [&>button]:z-50">
        {/* Glassy card shell */}
        <div className="flex flex-col h-full max-h-[88vh] rounded-2xl border border-border/60 bg-background/95 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden">

          {/* ── Header ── */}
          <div className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogHeader className="space-y-1 text-left">
                  <DialogTitle className="text-[1.15rem] font-bold tracking-tight leading-tight">
                    {language === "es" ? "Califica tus productos" : "Rate your products"}
                  </DialogTitle>
                  <DialogDescription className="text-[0.8rem] text-muted-foreground leading-relaxed">
                    {language === "es"
                      ? "Tu opinión ayuda a la comunidad agroecológica."
                      : "Your opinion helps the agroecological community."}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>

            {/* Progress */}
            {ratings.length > 1 && (
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {language === "es" ? "Progreso" : "Progress"}
                  </span>
                  <span className={cn(
                    "text-[11px] font-bold tabular-nums transition-colors duration-300",
                    allDone ? "text-emerald-500" : "text-primary"
                  )}>
                    {currentlyRated}/{ratings.length}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      allDone
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                        : "bg-gradient-to-r from-amber-400 via-primary to-emerald-500"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ type: "spring", stiffness: 70, damping: 18 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Scrollable product list ── */}
          <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3 custom-scrollbar">
            {ratings.map((rating, idx) => {
              const alreadyRated = isExisting(rating.productId);
              const isSubmitted = submittedIds.has(rating.productId);
              const readOnly = alreadyRated || isSubmitted;

              const hover = hoveredStars[rating.productId] ?? 0;
              const displayScore = hover > 0 ? hover : rating.score;
              const palette = displayScore > 0 ? STAR_PALETTE[displayScore - 1] : null;

              return (
                <motion.div
                  key={rating.productId}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className={cn(
                      "relative rounded-xl border transition-all duration-300 overflow-hidden",
                      readOnly
                        ? "border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.04] to-transparent"
                        : rating.score > 0
                        ? cn("border-opacity-40", `border-${STAR_PALETTE[rating.score - 1].color.split('-')[1]}-500/30`, "bg-card/70 shadow-sm hover:shadow-md")
                        : "border-border/50 bg-card/50 hover:border-border hover:bg-card/70 hover:shadow-sm"
                    )}
                  >
                    {/* Rated glow overlay */}
                    {readOnly && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.02] to-transparent pointer-events-none" />
                    )}

                    <div className="p-4 space-y-3.5">
                      {/* Product header row */}
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          {rating.productImage ? (
                            <img
                              src={rating.productImage}
                              alt={rating.productName}
                              className="w-12 h-12 rounded-xl object-cover border border-border/40 shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-secondary/70 flex items-center justify-center text-[22px] border border-border/40 shadow-sm">
                              {rating.productEmoji || "📦"}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[0.82rem] font-bold text-foreground leading-snug truncate pr-2">
                            {rating.productName}
                          </p>
                          {readOnly && rating.score > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={cn(
                                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                STAR_PALETTE[rating.score - 1].bg,
                                STAR_PALETTE[rating.score - 1].border,
                                STAR_PALETTE[rating.score - 1].color
                              )}>
                                <Check className="h-2.5 w-2.5" />
                                {language === "es" ? "Calificado" : "Rated"}
                              </span>
                            </div>
                          )}
                          {!readOnly && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {language === "es" ? "Toca las estrellas para calificar" : "Tap the stars to rate"}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stars row */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isLit = star <= displayScore;
                            const p = isLit && displayScore > 0 ? STAR_PALETTE[displayScore - 1] : null;

                            return (
                              <motion.button
                                key={star}
                                type="button"
                                disabled={readOnly}
                                onClick={readOnly ? undefined : () => updateScore(rating.productId, star)}
                                onMouseEnter={readOnly ? undefined : () => setHoveredStars(prev => ({ ...prev, [rating.productId]: star }))}
                                onMouseLeave={readOnly ? undefined : () => setHoveredStars(prev => ({ ...prev, [rating.productId]: 0 }))}
                                whileHover={readOnly ? {} : { scale: 1.3, y: -3 }}
                                whileTap={readOnly ? {} : { scale: 0.85 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                className={cn(
                                  "relative p-1 outline-none",
                                  readOnly ? "cursor-default" : "cursor-pointer"
                                )}
                              >
                                <Star
                                  className={cn(
                                    "w-9 h-9 transition-all duration-100",
                                    isLit && p
                                      ? cn("fill-current", p.color, p.glow)
                                      : "fill-none text-muted-foreground/25"
                                  )}
                                />
                              </motion.button>
                            );
                          })}
                        </div>

                        <AnimatePresence mode="wait">
                          {displayScore > 0 && palette && (
                            <motion.span
                              key={displayScore}
                              initial={{ opacity: 0, y: -4, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.9 }}
                              transition={{ duration: 0.15 }}
                              className={cn(
                                "text-[11px] font-bold tracking-wide",
                                palette.color
                              )}
                            >
                              {language === "es" ? palette.label.es : palette.label.en}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Comment area */}
                      <AnimatePresence>
                        {rating.score > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            {readOnly && rating.comment ? (
                              <div className="flex gap-2 items-start rounded-xl bg-secondary/40 border border-border/30 px-3 py-2.5">
                                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                                  &ldquo;{rating.comment}&rdquo;
                                </p>
                              </div>
                            ) : !readOnly ? (
                              <div className="relative group">
                                <textarea
                                  value={rating.comment}
                                  onChange={(e) => updateComment(rating.productId, e.target.value)}
                                  maxLength={500}
                                  rows={2}
                                  placeholder={
                                    language === "es"
                                      ? "¿Qué te pareció? Escribe una reseña (opcional)..."
                                      : "What did you think? Write a review (optional)..."
                                  }
                                  className="w-full rounded-xl border border-border/70 bg-secondary/30 focus:bg-background/80 px-3.5 py-2.5 text-[12px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200 leading-relaxed placeholder:text-muted-foreground/50"
                                />
                                <span className="absolute bottom-2 right-3 text-[9px] font-medium text-muted-foreground/40 group-focus-within:text-muted-foreground/70 transition-colors">
                                  {rating.comment.length}/500
                                </span>
                              </div>
                            ) : null}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Footer ── */}
          <div className="px-4 pb-4 pt-3 border-t border-border/40 shrink-0 space-y-3">
            {error && (
              <p className="text-[11px] font-semibold text-rose-500 text-center bg-rose-500/5 py-2 rounded-xl border border-rose-500/10">
                {error}
              </p>
            )}

            {!allDone ? (
              <div className="flex gap-2.5">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl border-border/70 hover:bg-secondary/50 text-muted-foreground font-semibold text-sm"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  {language === "es" ? "Después" : "Later"}
                </Button>
                <Button
                  className="flex-2 h-11 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-primary via-primary to-emerald-600 hover:opacity-90 text-white shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={isSubmitting || ratings.every(r => isExisting(r.productId) || submittedIds.has(r.productId))}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {language === "es" ? "Enviando..." : "Sending..."}
                    </span>
                  ) : (
                    language === "es" ? "Enviar calificaciones" : "Submit ratings"
                  )}
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1, stiffness: 200, damping: 12 }}
                    className="h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 border border-emerald-500/25"
                  >
                    <Award className="h-4 w-4" />
                  </motion.div>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {language === "es" ? "¡Gracias por tus calificaciones!" : "Thanks for your ratings!"}
                  </p>
                </div>
                <Button
                  className="w-full h-11 rounded-xl font-semibold text-sm bg-secondary hover:bg-secondary/70 text-foreground border border-border/50 shadow-sm"
                  onClick={() => handleOpenChange(false)}
                >
                  {language === "es" ? "Cerrar" : "Close"}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
