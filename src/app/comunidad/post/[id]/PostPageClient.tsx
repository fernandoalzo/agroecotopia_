"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";

import { mockQuestions, Question } from "@/frontend/components/comunidad/forum/forum.types";
import ForumQuestionDetail from "@/frontend/components/comunidad/forum/ForumQuestionDetail";
import ForumStatsPanel from "@/frontend/components/comunidad/forum/ForumStatsPanel";

export default function PostPageClient({ id }: { id: string }) {
  const router = useRouter();
  const { status } = useSession();
  
  const [question, setQuestion] = useState<Question | null>(null);

  const obtenerDetallesDelPost = () => {
    console.log(`obtenerDetallesDelPost(): Obteniendo detalles para el post con ID: ${id}`);
    const foundQuestion = mockQuestions.find(q => q.id === id);
    setQuestion(foundQuestion || null);
  };

  useEffect(() => {
    obtenerDetallesDelPost();
  }, [id]);

  const añadirNuevaRespuesta = (content: string) => {
    console.log("añadirNuevaRespuesta(): Guardando nueva respuesta...", content);
    if (!question) return;

    const newAnswer = {
      id: `a${Date.now()}`,
      author: "Tú",
      authorRole: "Miembro",
      content,
      rating: 0,
      ratingCount: 0,
      isAccepted: false,
      timestamp: "Justo ahora"
    };

    setQuestion({
      ...question,
      answers: [...question.answers, newAnswer]
    });
  };

  if (!question) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Publicación no encontrada</h1>
          <button 
            onClick={() => router.push("/comunidad")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-all"
          >
            Volver a la Comunidad
          </button>
        </div>
      </div>
    );
  }

  // Handle star rating for the details page
  const handleRate = (itemId: string, rating: number, isQuestion: boolean = false) => {
    console.log(`handleRate(): Calificando item ${itemId} con ${rating} estrellas`);
    if (!question) return;

    if (isQuestion) {
      if (question.id === itemId) {
        const newCount = question.ratingCount + 1;
        const newRating = ((question.rating * question.ratingCount) + rating) / newCount;
        setQuestion({ ...question, rating: Math.round(newRating * 10) / 10, ratingCount: newCount });
      }
    } else {
      setQuestion({
        ...question,
        answers: question.answers.map(ans => {
          if (ans.id === itemId) {
            const newCount = ans.ratingCount + 1;
            const newRating = ((ans.rating * ans.ratingCount) + rating) / newCount;
            return { ...ans, rating: Math.round(newRating * 10) / 10, ratingCount: newCount };
          }
          return ans;
        })
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pt-16 md:pt-20">
      {/* Background Aurora / Glassmorphism */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          <div className="col-span-1 lg:col-span-9 space-y-6">
            <ForumQuestionDetail 
              question={question} 
              onBack={() => router.push("/comunidad")} 
              onRate={handleRate} 
              onAddAnswer={añadirNuevaRespuesta}
            />
          </div>

          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28 space-y-8">
              <div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Contribuidores del Post
                </h3>
                
                <div className="space-y-5">
                  {/* Author of the post */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0 border border-primary/30 shadow-inner">
                      {question.author.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-sm block text-foreground">{question.author}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Autor</span>
                    </div>
                  </div>

                  {/* List authors of answers */}
                  {Array.from(new Set(question.answers.map(a => a.author))).map((authorName, idx) => {
                    if (authorName === question.author) return null; // Already listed as author
                    const answer = question.answers.find(a => a.author === authorName);
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-foreground shrink-0 border border-border">
                          {authorName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-sm block text-foreground">{authorName}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{answer?.authorRole || "Miembro"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
