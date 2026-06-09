"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, Check, X, Loader2, Pencil, Trash2, MessageCircle, Award } from "lucide-react";
import { Answer } from "./forum.types";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ForumAnswerCardProps {
  answer: Answer;
  onRate: (id: string, rating: number) => Promise<void> | void;
  onEdit?: (answerId: string, newContent: string) => Promise<void> | void;
  onDelete?: (answerId: string) => Promise<void> | void;
  onAddAnswer?: (content: string, parentId?: string | null) => Promise<void> | void;
  onAcceptAnswer?: (answerId: string) => Promise<void> | void;
  currentUserId?: string;
  currentUserRole?: string;
  isPostAuthor?: boolean;
}

const replySchema = z.object({
  content: z
    .string()
    .min(10, "La respuesta debe tener al menos 10 caracteres.")
    .max(2000, "La respuesta no puede exceder los 2000 caracteres."),
});

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-code:bg-secondary/50 prose-code:px-1 prose-code:rounded prose-a:text-primary prose-pre:bg-secondary/50 prose-pre:border prose-pre:border-border/30 [&_pre>code]:bg-transparent [&_pre>code]:p-0 overflow-x-auto">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function ForumAnswerCard({ answer, onRate, onEdit, onDelete, onAddAnswer, onAcceptAnswer, currentUserId, currentUserRole, isPostAuthor }: ForumAnswerCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(answer.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [userVote, setUserVote] = useState(0);
  const [localScore, setLocalScore] = useState(answer.ratingTotal);

  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyError, setReplyError] = useState("");
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [isVoting, setIsVoting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const CHAR_LIMIT = 350;
  const REPLY_MAX = 2000;
  const isLongContent = answer.content.length > CHAR_LIMIT;

  const canModify = currentUserId && (currentUserId === answer.authorId || currentUserRole === "admin");
  const canAccept = isPostAuthor && answer.authorId !== currentUserId;

  const handleVote = async (vote: 1 | -1) => {
    if (isVoting) return;
    setIsVoting(true);
    let newVote: number;
    if (userVote === vote) {
      newVote = 0;
    } else {
      newVote = vote;
    }
    setUserVote(newVote);
    setLocalScore(localScore - userVote + newVote);
    try {
      await onRate(answer.id, newVote);
    } finally {
      setIsVoting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (isEditSubmitting || editContent.trim().length < 10) return;
    setIsEditSubmitting(true);
    try {
      await onEdit?.(answer.id, editContent.trim());
      setIsEditing(false);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(answer.content);
    setIsEditing(false);
  };

  const handleConfirmDelete = async () => {
    if (isDeleteSubmitting || !onDelete) return;
    setIsDeleteSubmitting(true);
    try {
      await onDelete(answer.id);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const handleAcceptToggle = async () => {
    if (isAccepting || !onAcceptAnswer) return;
    setIsAccepting(true);
    try {
      await onAcceptAnswer(answer.id);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReplySubmit = async () => {
    if (isReplySubmitting || !onAddAnswer) return;
    try {
      replySchema.parse({ content: replyContent });
      setIsReplySubmitting(true);
      await onAddAnswer(replyContent, answer.id);
      setReplyContent("");
      setReplyError("");
      setIsReplying(false);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setReplyError(err.issues[0].message);
      }
    } finally {
      setIsReplySubmitting(false);
    }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleReplySubmit();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  const relativeDate = formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true, locale: es });

  return (
    <div id={`answer-${answer.id}`} className="py-6 border-b border-border/30 last:border-b-0 scroll-mt-24">
      <div className="flex gap-3 sm:gap-6">
        {/* Voting sidebar */}
        <div className="flex flex-col items-center gap-1 shrink-0 w-8 sm:w-12">
          {answer.isAccepted && (
            <div className="mb-1" title="Respuesta aceptada">
              <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center shadow-sm">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            </div>
          )}

          <button
            onClick={() => handleVote(1)}
            disabled={isVoting}
            className={cn(
              "transition-all hover:scale-110 p-1 focus:outline-none leading-none rounded min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center",
              userVote === 1
                ? "text-primary"
                : "text-muted-foreground/40 hover:text-primary/60",
              isVoting && "opacity-50 cursor-not-allowed hover:scale-100"
            )}
            title="Me gusta"
          >
            <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <span className={cn(
            "text-base sm:text-lg font-bold leading-none",
            userVote === 1 ? "text-primary" : userVote === -1 ? "text-red-500" : "text-foreground/80",
            answer.isAccepted && "text-green-600"
          )}>
            {localScore}
          </span>

          <button
            onClick={() => handleVote(-1)}
            disabled={isVoting}
            className={cn(
              "transition-all hover:scale-110 p-1 focus:outline-none leading-none rounded min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center",
              userVote === -1
                ? "text-red-500"
                : "text-muted-foreground/40 hover:text-red-500/60",
              isVoting && "opacity-50 cursor-not-allowed hover:scale-100"
            )}
            title="No me gusta"
          >
            <ThumbsDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                rows={4}
                value={editContent}
                onChange={(e) => { setEditContent(e.target.value); autoResize(e.target); }}
                onKeyDown={handleEditKeyDown}
                className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-foreground resize-none transition-all text-sm"
                ref={(el) => { if (el) autoResize(el); }}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={isEditSubmitting || editContent.trim().length < 10}
                    className={`px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isEditSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {isEditSubmitting ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-1.5 rounded-md text-xs font-bold text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
                <span className="text-[10px] text-muted-foreground/60">
                  ⌘Enter para enviar
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Author info — at the top */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-[10px] overflow-hidden shrink-0">
                  {answer.authorImage ? (
                    <img src={answer.authorImage} alt={answer.author} className="w-full h-full object-cover" />
                  ) : (
                    answer.author.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{answer.author}</span>
                  {answer.isAccepted && (
                    <span className="flex items-center gap-0.5 text-green-600 font-bold text-[10px] uppercase tracking-wider">
                      <Award className="w-3 h-3" />
                      Aceptada
                    </span>
                  )}
                  <span className="text-border/60">·</span>
                  <span>{relativeDate}</span>
                </div>
              </div>

              {/* Parent mention — flat reference */}
              {answer.parentAuthor && (
                <button
                  onClick={() => {
                    const el = document.getElementById(`answer-${answer.parentId}`);
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    el?.classList.add("ring-2", "ring-primary/30", "rounded-lg");
                    setTimeout(() => el?.classList.remove("ring-2", "ring-primary/30", "rounded-lg"), 2000);
                  }}
                  className="mb-3 text-xs text-muted-foreground/70 hover:text-primary transition-colors font-medium flex items-center gap-1"
                >
                  <span className="text-border/60">↳</span>
                  En respuesta a <span className="font-semibold">@{answer.parentAuthor}</span>
                </button>
              )}

              {/* Answer body */}
              <div className="text-foreground/85 leading-relaxed text-sm sm:text-[15px]">
                <AnimatePresence mode="wait">
                  {!isExpanded && isLongContent ? (
                    <motion.div
                      key="collapsed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <MarkdownRenderer content={answer.content.slice(0, CHAR_LIMIT).trim() + "..."} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <MarkdownRenderer content={answer.content} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {isLongContent && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-primary hover:text-primary/80 font-bold text-xs sm:text-sm mt-2 transition-colors focus:outline-none"
                >
                  {isExpanded ? "Ver menos" : "Ver más..."}
                </button>
              )}

              {/* Footer: Reply + Edit/Delete */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4 pt-1 text-xs text-muted-foreground">
                <button
                  onClick={() => { setIsReplying(true); setReplyError(""); setTimeout(() => replyTextareaRef.current?.focus(), 0); }}
                  className="hover:text-primary transition-colors font-medium flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Responder
                </button>

                {canAccept && (
                  <>
                    <span className="text-border/60">·</span>
                    <button
                      onClick={handleAcceptToggle}
                      disabled={isAccepting}
                      className={`hover:text-green-600 transition-colors font-medium flex items-center gap-1 ${isAccepting ? 'opacity-60 cursor-not-allowed' : ''} ${answer.isAccepted ? 'text-green-600' : ''}`}
                      title={answer.isAccepted ? "Quitar como aceptada" : "Marcar como respuesta aceptada"}
                    >
                      <Award className="w-3 h-3" />
                      {answer.isAccepted ? "Aceptada" : "Aceptar"}
                    </button>
                  </>
                )}

                {canModify && (
                  <>
                    <span className="text-border/60">·</span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="hover:text-primary transition-colors font-medium"
                    >
                      <Pencil className="w-3 h-3 inline mr-1" />
                      Editar
                    </button>
                    <span className="text-border/60">·</span>
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="hover:text-red-500 transition-colors font-medium"
                      >
                        <Trash2 className="w-3 h-3 inline mr-1" />
                        Eliminar
                      </button>
                    ) : (
                      <span className="flex items-center gap-1">
                        <button
                          onClick={handleConfirmDelete}
                          disabled={isDeleteSubmitting}
                          className="min-w-[36px] min-h-[36px] sm:w-6 sm:h-6 rounded-md bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500/20 hover:border-green-500/50 shadow-sm active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Confirmar eliminación"
                        >
                          {isDeleteSubmitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          )}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="min-w-[36px] min-h-[36px] sm:w-6 sm:h-6 rounded-md bg-secondary border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60 shadow-sm active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center"
                          title="Cancelar eliminación"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Inline reply textarea (GitHub style) */}
              {isReplying && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 border border-border rounded-md bg-secondary/10 overflow-hidden"
                >
                  <textarea
                    ref={replyTextareaRef}
                    rows={3}
                    value={replyContent}
                    onChange={(e) => { setReplyContent(e.target.value); setReplyError(""); autoResize(e.target); }}
                    onKeyDown={handleReplyKeyDown}
                    placeholder="Escribe tu respuesta..."
                    className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-foreground placeholder:text-muted-foreground text-sm px-3 py-2"
                    autoFocus
                  />
                  {replyError && (
                    <p className="text-red-500 text-xs font-bold px-3 pb-1">{replyError}</p>
                  )}
                  <div className="flex items-center justify-between gap-2 px-3 pb-3">
                    <span className="text-[10px] text-muted-foreground/60">{replyContent.length}/{REPLY_MAX}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setIsReplying(false); setReplyContent(""); setReplyError(""); }}
                        className="px-3 py-1.5 rounded-md text-xs font-bold text-muted-foreground hover:bg-secondary transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleReplySubmit}
                        disabled={isReplySubmitting}
                        className={`px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:bg-primary/90 transition-all ${isReplySubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {isReplySubmitting ? 'Enviando...' : 'Responder'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 1-level tree: children of top-level answers (premium connector) */}
              {answer.replies && answer.replies.length > 0 && (
                <div className="relative mt-4">
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "100%", opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute left-[12px] sm:left-[17px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/40 via-primary/20 to-border/10 rounded-full shadow-[0_0_6px_rgba(var(--color-primary),0.15)]"
                  />
                  <div className="space-y-0">
                    {answer.replies.map((reply, idx) => {
                      const isLast = idx === answer.replies!.length - 1;
                      const delay = 0.1 * (idx + 1);
                      return (
                        <motion.div
                          key={reply.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay, ease: "easeOut" }}
                          className="relative flex"
                        >
                          <div className="relative w-6 sm:w-8 shrink-0">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3, delay: delay + 0.15, ease: "backOut" }}
                              className="absolute left-1/2 -translate-x-1/2 top-[18px] w-[10px] h-[10px] rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-[0_0_8px_rgba(var(--color-primary),0.3)] ring-2 ring-background z-10"
                            />
                            <div className="absolute left-1/2 -translate-x-1/2 top-[18px] w-[10px] h-[10px] rounded-full bg-primary/20 animate-pulse z-0" />
                            <motion.div
                              initial={{ width: 0, opacity: 0 }}
                              animate={{ width: "100%", opacity: 1 }}
                              transition={{ duration: 0.3, delay: delay + 0.2, ease: "easeOut" }}
                              className="absolute left-1/2 right-0 top-[22px] h-[2px] bg-gradient-to-r from-primary/40 via-primary/20 to-transparent rounded-full"
                            />
                            {!isLast && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "100%", opacity: 1 }}
                                transition={{ duration: 0.5, delay: delay + 0.1, ease: "easeOut" }}
                                className="absolute left-1/2 -translate-x-1/2 top-6 bottom-0 w-[2px] bg-gradient-to-b from-primary/25 via-primary/10 to-transparent rounded-full"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <ForumAnswerCard
                              answer={reply}
                              onRate={(id, r) => onRate(id, r)}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              onAddAnswer={onAddAnswer}
                              onAcceptAnswer={onAcceptAnswer}
                              currentUserId={currentUserId}
                              currentUserRole={currentUserRole}
                              isPostAuthor={isPostAuthor}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
