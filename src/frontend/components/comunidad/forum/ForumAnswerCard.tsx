"use client";

import { useState } from "react";
import { Star, Award, User, Pencil, Trash2, Check, X } from "lucide-react";
import { Answer } from "./forum.types";
import { cn } from "@/lib/utils";

interface ForumAnswerCardProps {
  answer: Answer;
  onRate: (id: string, rating: number) => void;
  onEdit?: (answerId: string, newContent: string) => void;
  onDelete?: (answerId: string) => void;
  currentUserId?: string;
  currentUserRole?: string;
}

export default function ForumAnswerCard({ answer, onRate, onEdit, onDelete, currentUserId, currentUserRole }: ForumAnswerCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(answer.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canModify = currentUserId && (currentUserId === answer.authorId || currentUserRole === "admin");

  const handleSaveEdit = () => {
    if (editContent.trim().length < 10) return;
    onEdit?.(answer.id, editContent.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(answer.content);
    setIsEditing(false);
  };

  const handleConfirmDelete = () => {
    onDelete?.(answer.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className={cn(
      "bg-card/50 backdrop-blur-md border rounded-3xl overflow-hidden shadow-sm transition-all",
      answer.isAccepted ? "border-accent/30 shadow-[0_0_15px_rgba(var(--color-accent),0.1)]" : "border-border/50"
    )}>
      <div className="p-6">
        {answer.isAccepted && (
          <div className="flex items-center gap-2 text-accent mb-4 text-xs font-black uppercase tracking-wider">
            <Award className="w-4 h-4" />
            Respuesta Aceptada
          </div>
        )}

        {/* Content or Edit Mode */}
        {isEditing ? (
          <div className="mb-6 space-y-3">
            <textarea
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-background/50 border border-primary/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none transition-all text-[15px]"
            />
            {editContent.trim().length < 10 && (
              <p className="text-red-500 text-xs font-bold">La respuesta debe tener al menos 10 caracteres.</p>
            )}
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editContent.trim().length < 10}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-3.5 h-3.5" /> Guardar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-[15px] mb-6">
            {answer.content}
          </p>
        )}
        
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

            {/* Action buttons */}
            <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
              {canModify && !isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </button>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="text-red-500">¿Seguro?</span>
                      <button
                        onClick={handleConfirmDelete}
                        className="text-red-500 hover:text-red-600 font-black transition-colors"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="hover:text-foreground transition-colors"
                      >
                        No
                      </button>
                    </span>
                  )}
                </>
              )}
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
