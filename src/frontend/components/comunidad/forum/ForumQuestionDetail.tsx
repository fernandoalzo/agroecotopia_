"use client";

import { useState } from "react";
import { z } from "zod";

import { motion } from "framer-motion";
import { ArrowLeft, Star, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Question } from "./forum.types";
import ForumAnswerCard from "./ForumAnswerCard";

interface ForumQuestionDetailProps {
  question: Question;
  onBack: () => void;
  onRate: (id: string, rating: number, isQuestion: boolean) => void;
  onAddAnswer: (content: string) => void;
}

import { answerSchema } from "../schemas/answer.schema";

export default function ForumQuestionDetail({ question, onBack, onRate, onAddAnswer }: ForumQuestionDetailProps) {
  const { status } = useSession();
  const [replyContent, setReplyContent] = useState("");
  const [error, setError] = useState("");

  const handleAddAnswer = () => {
    try {
      const validatedData = answerSchema.parse({ content: replyContent });
      onAddAnswer(validatedData.content);
      setReplyContent("");
      setError("");
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      }
    }
  };

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

      {/* Question Thread: Beautiful Background Blend */}
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
              <span>{new Date(question.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-foreground leading-[1.1] mb-6">
            {question.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-8">
            {question.labels.map(label => (
              <span key={label} className="px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary bg-primary/10 rounded-full border border-primary/20">
                {label}
              </span>
            ))}

            {/* Inline Star Rating */}
            <div className="flex items-center gap-1 ml-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => onRate(question.id, star, true)}
                  className="transition-all hover:scale-125"
                >
                  <Star
                    className={`w-5 h-5 transition-colors ${
                      star <= Math.round(question.ratingTotal)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-none text-muted-foreground/30 hover:text-amber-300"
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm font-bold text-foreground ml-2">
                {question.ratingTotal.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                ({question.ratingCount} valoraciones)
              </span>
            </div>
          </div>

          <p className="text-foreground/80 text-lg leading-relaxed whitespace-pre-wrap font-medium">
            {question.body}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 px-2 text-foreground/70 font-bold">
        <MessageCircle className="w-5 h-5" />
        <h3>{question.answers.length} Respuestas</h3>
      </div>

      <div className="space-y-4">
        {question.answers.map(ans => (
          <ForumAnswerCard key={ans.id} answer={ans} onRate={(id, r) => onRate(id, r, false)} />
        ))}
      </div>

      {status === "authenticated" ? (
        <div className="mt-8 bg-secondary/30 border border-border/50 rounded-3xl p-6 backdrop-blur-md">
          <h3 className="font-bold text-foreground mb-4">Añadir una respuesta</h3>
          <div className={`bg-background/50 border rounded-xl p-4 focus-within:border-primary/50 transition-all mb-2 ${error ? 'border-red-500' : 'border-border/50'}`}>
            <textarea 
              rows={4}
              value={replyContent}
              onChange={(e) => { setReplyContent(e.target.value); setError(""); }}
              placeholder="Escribe tu respuesta aquí para ayudar a la comunidad..."
              className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold mb-4">{error}</p>}
          <div className="flex justify-end">
            <button 
              onClick={handleAddAnswer}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-all text-sm"
            >
              Publicar Respuesta
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-secondary/30 border border-border/50 rounded-3xl p-6 backdrop-blur-md text-center">
          <p className="text-muted-foreground font-medium mb-4">Inicia sesión para participar en la conversación.</p>
          <a href="/login" className="inline-block px-6 py-2.5 border border-primary text-primary rounded-full font-bold hover:bg-primary/10 transition-all text-sm">
            Iniciar Sesión
          </a>
        </div>
      )}
    </motion.div>
  );
}
