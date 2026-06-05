"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";

import { Question } from "@/frontend/components/comunidad/forum/forum.types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import ForumQuestionDetail from "@/frontend/components/comunidad/forum/ForumQuestionDetail";
import ForumStatsPanel from "@/frontend/components/comunidad/forum/ForumStatsPanel";
import { Loading } from "@/frontend/components/ui/Loading";

interface PostPageClientProps {
  id: string;
  getPostById: (id: string) => Promise<any>;
  createAnswer: (data: { content: string; postId: string }) => Promise<any>;
  rateItem: (data: { itemId: string; itemType: "post" | "answer"; value: number }) => Promise<any>;
  editAnswer: (data: { answerId: string; content: string }) => Promise<any>;
  deleteAnswer: (answerId: string) => Promise<any>;
  deletePost: (postId: string) => Promise<any>;
}

export default function PostPageClient({
  id,
  getPostById,
  createAnswer,
  rateItem,
  editAnswer,
  deleteAnswer,
  deletePost,
}: PostPageClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [question, setQuestion] = useState<Question | null>(null);

  const queryClient = useQueryClient();

  const { data: postData, isLoading } = useQuery({
    queryKey: ["forumPost", id],
    queryFn: async () => {
      const res = await getPostById(id);
      if (!res.success) throw new Error(res.error);
      return res.post;
    },
  });

  useEffect(() => {
    if (postData) {
      const mapped: Question = {
        id: postData.id,
        title: postData.title,
        body: postData.body,
        author: postData.author.name || "Usuario",
        authorId: postData.authorId || postData.author.id, // Añadido authorId
        authorImage: postData.author.image,
        labels: postData.labels,
        ratingTotal: postData.ratingTotal,
        ratingCount: postData.ratingCount,
        createdAt: postData.createdAt,
        isTrending: postData.isTrending,
        answers: postData.answers.map((ans: any) => ({
          id: ans.id,
          content: ans.content,
          author: ans.author.name || "Usuario",
          authorId: ans.authorId,
          authorImage: ans.author.image,
          authorRole: ans.author.role,
          ratingTotal: ans.ratingTotal,
          ratingCount: ans.ratingCount,
          isAccepted: ans.isAccepted,
          createdAt: ans.createdAt,
        })),
      };
      setQuestion(mapped);
    }
  }, [postData]);

  const createAnswerMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await createAnswer({ content, postId: id });
      if ("error" in res) throw new Error(res.error);
      if (!res.success) throw new Error("Unknown error");
      return res.answer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPost", id] });
      toast.success("Respuesta enviada");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al enviar la respuesta");
    },
  });

  const rateItemMutation = useMutation({
    mutationFn: async (data: { itemId: string; rating: number; isQuestion: boolean }) => {
      const res = await rateItem({ 
        itemId: data.itemId, 
        itemType: data.isQuestion ? "post" : "answer", 
        value: data.rating 
      });
      if ("error" in res) throw new Error(res.error);
      if (!res.success) throw new Error("Unknown error");
      return res.rating;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPost", id] });
      toast.success("Calificación guardada");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al calificar");
    },
  });

  const añadirNuevaRespuesta = async (content: string) => {
    if (status !== "authenticated") {
      toast.error("Debes iniciar sesión para responder");
      return;
    }
    await createAnswerMutation.mutateAsync(content);
  };

  const handleRate = (itemId: string, rating: number, isQuestion: boolean = false) => {
    if (status !== "authenticated") {
      toast.error("Debes iniciar sesión para calificar");
      return;
    }
    rateItemMutation.mutate({ itemId, rating, isQuestion });
  };

  const editAnswerMutation = useMutation({
    mutationFn: async (data: { answerId: string; content: string }) => {
      const res = await editAnswer(data);
      if ("error" in res) throw new Error(res.error);
      if (!res.success) throw new Error("Unknown error");
      return res.answer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPost", id] });
      toast.success("Respuesta actualizada");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al editar la respuesta");
    },
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: async (answerId: string) => {
      const res = await deleteAnswer(answerId);
      if ("error" in res) throw new Error(res.error);
      if (!res.success) throw new Error("Unknown error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPost", id] });
      toast.success("Respuesta eliminada");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al eliminar la respuesta");
    },
  });

  const handleEditAnswer = (answerId: string, content: string) => {
    editAnswerMutation.mutate({ answerId, content });
  };

  const handleDeleteAnswer = (answerId: string) => {
    deleteAnswerMutation.mutate(answerId);
  };

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await deletePost(postId);
      if ("error" in res) throw new Error(res.error);
      if (!res.success) throw new Error("Unknown error");
    },
    onSuccess: () => {
      toast.success("Publicación eliminada correctamente");
      router.push("/comunidad"); // Redirect to forum feed after deleting
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al eliminar la publicación");
    },
  });

  const handleDeleteQuestion = (questionId: string) => {
    deletePostMutation.mutate(questionId);
  };

  if (!question || isLoading) {
    return (
      <Loading fullScreen text="Cargando publicación..." subtext="Obteniendo los detalles del post" />
    );
  }

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
              onEditAnswer={handleEditAnswer}
              onDeleteAnswer={handleDeleteAnswer}
              onDeleteQuestion={handleDeleteQuestion}
              currentUserId={session?.user?.id}
              currentUserRole={session?.user?.role}
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
