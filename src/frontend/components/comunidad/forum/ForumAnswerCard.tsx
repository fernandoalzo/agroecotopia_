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
  const [isExpanded, setIsExpanded] = useState(false);

  const CHAR_LIMIT = 350;
  const isLongContent = answer.content.length > CHAR_LIMIT;

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
      "relative group bg-gradient-to-br from-card/80 via-card/50 to-background/40 backdrop-blur-xl border rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 isolate",
      answer.isAccepted ? "border-accent/40 shadow-[0_0_20px_rgba(var(--color-accent),0.15)] ring-1 ring-accent/20" : "border-border/50 hover:border-primary/20 hover:ring-1 hover:ring-primary/10"
    )}>
      {/* Premium Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all duration-500 -z-10" />
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="p-5 sm:p-6 flex flex-col gap-4 relative z-10">
        
        {/* Cabecera: Info del autor y Badge de Aceptada */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground border-2 border-background shadow-sm overflow-hidden shrink-0">
              {answer.authorImage ? (
                <img src={answer.authorImage} alt={answer.author} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-sm sm:text-base leading-tight">{answer.author}</span>
              <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-widest text-primary mt-0.5">{answer.authorRole}</span>
            </div>
          </div>

          {answer.isAccepted && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border border-accent/20 shrink-0">
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Respuesta</span> Aceptada
            </div>
          )}
        </div>

        {/* Content or Edit Mode */}
        {isEditing ? (
          <div className="space-y-3 mt-2">
            <textarea
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-background/50 border border-primary/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none transition-all text-sm sm:text-[15px]"
            />
            {editContent.trim().length < 10 && (
              <p className="text-red-500 text-xs font-bold px-1">La respuesta debe tener al menos 10 caracteres.</p>
            )}
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editContent.trim().length < 10}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Check className="w-3.5 h-3.5" /> Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-1 pl-1 sm:pl-2">
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap break-words text-sm sm:text-[15px]">
              {!isExpanded && isLongContent 
                ? answer.content.slice(0, CHAR_LIMIT).trim() + "..." 
                : answer.content}
            </p>
            {isLongContent && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary hover:text-primary/80 font-bold text-xs sm:text-sm mt-2 transition-colors focus:outline-none"
              >
                {isExpanded ? "Ver menos" : "Ver más..."}
              </button>
            )}
          </div>
        )}
        
        {/* Footer: Acciones (Rating, Edit, Delete) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-2 border-t border-border/40">
          
          {/* Star Rating Integrado */}
          <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-2xl border border-border/50">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => onRate(answer.id, star)}
                  className="transition-all hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-all duration-300 ${
                      star <= Math.round(answer.ratingTotal)
                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]"
                        : "fill-none text-muted-foreground/30 hover:text-amber-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 border-l border-border/60 pl-2 ml-1">
              <span className="text-xs sm:text-sm font-black text-foreground/80">
                {answer.ratingTotal.toFixed(1)}
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-medium">
                ({answer.ratingCount})
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-bold text-muted-foreground">
            {canModify && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-secondary hover:text-primary transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Editar</span>
                </button>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Eliminar</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-xl">
                    <span className="text-red-500 font-bold hidden sm:inline">¿Seguro?</span>
                    <button
                      onClick={handleConfirmDelete}
                      className="text-red-500 hover:text-red-600 font-black transition-colors"
                    >
                      Sí
                    </button>
                    <span className="text-red-500/30">|</span>
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
      </div>
    </div>
  );
}
