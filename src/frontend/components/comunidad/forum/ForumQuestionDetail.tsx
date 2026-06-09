"use client";

import { useState, useRef } from "react";
import { z } from "zod";

import { motion } from "framer-motion";
import { ArrowLeft, ThumbsUp, ThumbsDown, Share2, Check, X, Loader2, Trash2, Pencil, ArrowUpDown, Clock, TrendingUp, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Question } from "./forum.types";
import ForumAnswerCard from "./ForumAnswerCard";

interface ForumQuestionDetailProps {
  question: Question;
  onBack: () => void;
  onRate: (id: string, rating: number, isQuestion: boolean) => Promise<void> | void;
  onAddAnswer: (content: string, parentId?: string | null) => Promise<void> | void;
  onEditAnswer?: (answerId: string, content: string) => Promise<void> | void;
  onDeleteAnswer?: (answerId: string) => Promise<void> | void;
  onDeleteQuestion?: (questionId: string) => Promise<void> | void;
  onAcceptAnswer?: (answerId: string) => Promise<void> | void;
  onEditPost?: (data: { title?: string; body?: string; labels?: string[] }) => Promise<void> | void;
  currentUserId?: string;
  currentUserRole?: string;
}

import { answerSchema } from "../schemas/answer.schema";
import logger from "@/utils/logger";

const log = logger.child("src/frontend/components/comunidad/forum/ForumQuestionDetail.tsx");

type SortMode = "votes" | "newest" | "oldest";

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-code:bg-secondary/50 prose-code:px-1 prose-code:rounded prose-a:text-primary prose-pre:bg-secondary/50 prose-pre:border prose-pre:border-border/30 [&_pre>code]:bg-transparent [&_pre>code]:p-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function ForumQuestionDetail({ question, onBack, onRate, onAddAnswer, onEditAnswer, onDeleteAnswer, onDeleteQuestion, onAcceptAnswer, onEditPost, currentUserId, currentUserRole }: ForumQuestionDetailProps) {
  const { status } = useSession();
  const [replyContent, setReplyContent] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);
  const [isVotingQuestion, setIsVotingQuestion] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("votes");
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState(question.title);
  const [editBody, setEditBody] = useState(question.body);
  const [editLabels, setEditLabels] = useState(question.labels.join(", "));
  const [isEditPostSubmitting, setIsEditPostSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ANSWER_MAX = 2000;
  const canDeleteQuestion = currentUserId && (currentUserId === question.authorId || currentUserRole === "admin");
  const canEditPost = currentUserId && (currentUserId === question.authorId || currentUserRole === "admin");

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      log.error("Error al copiar", err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleAddAnswer = async () => {
    if (isSubmitting) return;
    try {
      const validatedData = answerSchema.parse({ content: replyContent });
      setIsSubmitting(true);
      await onAddAnswer(validatedData.content);
      setReplyContent("");
      setError("");
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (isDeletingQuestion || !onDeleteQuestion) return;
    setIsDeletingQuestion(true);
    try {
      await onDeleteQuestion(question.id);
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  const handleVoteQuestion = async (rating: number) => {
    if (isVotingQuestion) return;
    setIsVotingQuestion(true);
    try {
      await onRate(question.id, rating, true);
    } finally {
      setIsVotingQuestion(false);
    }
  };

  const handleEditPostSubmit = async () => {
    if (isEditPostSubmitting || !onEditPost) return;
    setIsEditPostSubmitting(true);
    try {
      const labels = editLabels.split(",").map(l => l.trim()).filter(Boolean);
      await onEditPost({ title: editTitle, body: editBody, labels });
      setIsEditingPost(false);
    } catch {
      // Error handled by parent toast
    } finally {
      setIsEditPostSubmitting(false);
    }
  };

  const sortedAnswers = [...question.answers].sort((a, b) => {
    if (sortMode === "votes") return b.ratingTotal - a.ratingTotal;
    if (sortMode === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAddAnswer();
    }
  };

  const relativeDate = formatDistanceToNow(new Date(question.createdAt), { addSuffix: true, locale: es });

  const sortOptions: { key: SortMode; label: string; icon: typeof ArrowUpDown }[] = [
    { key: "votes", label: "Votos", icon: TrendingUp },
    { key: "newest", label: "Más nuevas", icon: Clock },
    { key: "oldest", label: "Más antiguas", icon: ArrowUpDown },
  ];

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 font-bold text-sm bg-secondary px-4 py-2 rounded-full w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al Feed
      </button>

      <div className="mb-12 relative">
        <div className="flex-1">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-lg shadow-inner overflow-hidden">
              {question.authorImage ? (
                <img src={question.authorImage} alt={question.author} className="w-full h-full object-cover" />
              ) : (
                question.author.charAt(0)
              )}
            </div>
            <div>
              <span className="font-bold text-foreground block">{question.author}</span>
              <span>{relativeDate}</span>
            </div>
          </div>

          {isEditingPost ? (
            <div className="space-y-4 mb-6">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-3xl md:text-5xl font-black font-display tracking-tight text-foreground leading-[1.1] bg-transparent border-b border-border/30 focus:outline-none focus:border-primary/50 pb-2"
                placeholder="Título de la publicación"
              />
              <textarea
                rows={8}
                value={editBody}
                onChange={(e) => { setEditBody(e.target.value); autoResize(e.target); }}
                className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-foreground resize-none transition-all text-sm"
                ref={(el) => { if (el) autoResize(el); }}
              />
              <input
                value={editLabels}
                onChange={(e) => setEditLabels(e.target.value)}
                className="w-full bg-transparent border-b border-border/30 focus:outline-none focus:border-primary/50 pb-1 text-sm text-muted-foreground"
                placeholder="Labels (separados por coma)"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditPostSubmit}
                  disabled={isEditPostSubmitting}
                  className={`px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isEditPostSubmitting ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  onClick={() => setIsEditingPost(false)}
                  className="px-4 py-1.5 rounded-md text-xs font-bold text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-foreground leading-[1.1] mb-6">
                {question.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mb-8">
                {question.labels.map(label => (
                  <span key={label} className="px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary bg-primary/10 rounded-full border border-primary/20">
                    {label}
                  </span>
                ))}

                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex items-center gap-1.5 ml-auto md:ml-4 px-3 py-1.5 rounded-full text-xs font-bold transition-all border bg-secondary/50 hover:bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSharing ? (
                    <span className="animate-pulse">Compartiendo...</span>
                  ) : copied ? (
                    <><Check className="w-3.5 h-3.5 text-green-500" /> ¡Copiado!</>
                  ) : (
                    <><Share2 className="w-3.5 h-3.5" /> Compartir</>
                  )}
                </button>

                {canEditPost && (
                  <button
                    onClick={() => { setIsEditingPost(true); setEditTitle(question.title); setEditBody(question.body); setEditLabels(question.labels.join(", ")); }}
                    className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-primary/10 hover:text-primary text-muted-foreground"
                    title="Editar publicación"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}

                {canDeleteQuestion && (
                  <div className="relative">
                    {!showDeleteConfirm ? (
                      <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-red-500/10 hover:text-red-500 text-muted-foreground"
                        title="Eliminar post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-red-500/10 rounded-full border border-red-500/20 px-2 py-1">
                        <button onClick={handleDeleteQuestion} disabled={isDeletingQuestion} className="min-w-[36px] min-h-[36px] sm:w-6 sm:h-6 rounded-md bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" title="Confirmar eliminación">
                          {isDeletingQuestion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setShowDeleteConfirm(false)} className="min-w-[36px] min-h-[36px] sm:w-6 sm:h-6 rounded-md bg-secondary/50 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center" title="Cancelar eliminación">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={() => handleVoteQuestion(1)}
                    disabled={isVotingQuestion}
                    className={`transition-all hover:scale-110 p-1 focus:outline-none min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center ${isVotingQuestion ? 'opacity-50 cursor-not-allowed' : 'text-muted-foreground/40 hover:text-primary/60'}`}
                    title="Me gusta"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-foreground min-w-[1.5ch] text-center">
                    {question.ratingTotal}
                  </span>
                  <button
                    onClick={() => handleVoteQuestion(-1)}
                    disabled={isVotingQuestion}
                    className={`transition-all hover:scale-110 p-1 focus:outline-none min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center ${isVotingQuestion ? 'opacity-50 cursor-not-allowed' : 'text-muted-foreground/40 hover:text-red-500/60'}`}
                    title="No me gusta"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-foreground/80 text-base leading-relaxed">
                <MarkdownRenderer content={question.body} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Answers header with sort tabs */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
          <h2 className="text-lg font-bold text-foreground">
            {question.answers.length} {question.answers.length === 1 ? 'Respuesta' : 'Respuestas'}
          </h2>
          {question.answers.length > 1 && (
            <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
              {sortOptions.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSortMode(key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    sortMode === key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={label}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main answer textarea */}
        {status === "authenticated" ? (
          <div className="mb-8 pb-6 border-b border-border/30">
            <h3 className="font-bold text-foreground mb-3 text-sm">Tu respuesta</h3>
            <div className={`border rounded-md focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all ${error ? 'border-red-500' : 'border-border'}`}>
              <textarea
                ref={textareaRef}
                rows={5}
                value={replyContent}
                onChange={(e) => { setReplyContent(e.target.value); setError(""); autoResize(e.target); }}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu respuesta aquí para ayudar a la comunidad..."
                className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-foreground placeholder:text-muted-foreground text-sm px-3 py-2"
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-muted-foreground/60">{replyContent.length}/{ANSWER_MAX}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground/60 hidden sm:block">⌘Enter para enviar</span>
                <button
                  onClick={handleAddAnswer}
                  disabled={isSubmitting}
                  className={`px-5 py-2 bg-primary text-primary-foreground rounded-md font-bold hover:bg-primary/90 transition-all text-xs ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Enviando...' : 'Publicar respuesta'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 pb-6 border-b border-border/30 text-center">
            <p className="text-muted-foreground font-medium mb-3 text-sm">Inicia sesión para participar en la conversación.</p>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  const url = encodeURIComponent(window.location.pathname);
                  window.location.href = `/login?callbackUrl=${url}`;
                }
              }}
              className="inline-block px-5 py-2 border border-primary text-primary rounded-md font-bold hover:bg-primary/10 transition-all text-xs"
            >
              Iniciar Sesión
            </button>
          </div>
        )}

        {/* Answers list — conector premium agrupando todas las respuestas */}
        <div className="relative">
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "100%", opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute left-[8px] sm:left-[10px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/40 via-primary/20 to-border/10 rounded-full shadow-[0_0_6px_rgba(var(--color-primary),0.15)]"
          />
          {sortedAnswers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Aún no hay respuestas</h3>
              <p className="text-muted-foreground text-sm">Sé el primero en responder a esta pregunta.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {sortedAnswers.map((ans, idx) => {
                const delay = 0.1 * (idx + 1);
                return (
                  <motion.div
                    key={ans.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay, ease: "easeOut" }}
                    className="relative flex"
                  >
                    {/* Connector gutter — dot + branch */}
                    <div className="relative w-4 sm:w-5 shrink-0">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: delay + 0.15, ease: "backOut" }}
                        className="absolute left-1/2 -translate-x-1/2 top-[22px] w-[10px] h-[10px] rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-[0_0_8px_rgba(var(--color-primary),0.3)] ring-2 ring-background z-10"
                      />
                      <div className="absolute left-1/2 -translate-x-1/2 top-[22px] w-[10px] h-[10px] rounded-full bg-primary/20 animate-pulse z-0" />
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "100%", opacity: 1 }}
                        transition={{ duration: 0.3, delay: delay + 0.2, ease: "easeOut" }}
                        className="absolute left-1/2 right-0 top-[26px] h-[2px] bg-gradient-to-r from-primary/40 via-primary/20 to-transparent rounded-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <ForumAnswerCard
                        answer={ans}
                        onRate={(id, r) => onRate(id, r, false)}
                        onEdit={onEditAnswer}
                        onDelete={onDeleteAnswer}
                        onAddAnswer={onAddAnswer}
                        onAcceptAnswer={onAcceptAnswer}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                        isPostAuthor={currentUserId === question.authorId}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      {/* Scroll-to-top when many answers */}
      {sortedAnswers.length > 5 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-16 sm:bottom-6 right-6 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all z-50"
          title="Volver arriba"
        >
          <ArrowUpDown className="w-4 h-4 rotate-90" />
        </button>
      )}
    </motion.div>
  );
}
