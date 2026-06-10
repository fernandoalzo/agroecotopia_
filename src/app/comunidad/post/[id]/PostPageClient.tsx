"use client";

import { useMemo, useCallback, Component, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

import { useSession } from "next-auth/react";

import { Question, type RawAnswer, type RawPost, Answer } from "@/frontend/components/comunidad/forum/forum.types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import ForumQuestionDetail from "@/frontend/components/comunidad/forum/ForumQuestionDetail";

type ActionResult = { success?: boolean; [key: string]: unknown };

interface PostPageClientProps {
  id: string;
  getPostById: (id: string) => Promise<ActionResult>;
  createAnswer: (data: { content: string; postId: string; parentId?: string | null }) => Promise<ActionResult>;
  rateItem: (data: { itemId: string; itemType: "post" | "answer"; value: number }) => Promise<ActionResult>;
  editAnswer: (data: { answerId: string; content: string }) => Promise<ActionResult>;
  deleteAnswer: (answerId: string) => Promise<ActionResult>;
  deletePost: (postId: string) => Promise<ActionResult>;
  acceptAnswer: (data: { answerId: string; postId: string }) => Promise<ActionResult>;
  editPost: (data: { postId: string; title?: string; body?: string; labels?: string[] }) => Promise<ActionResult>;
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8">
            <h2 className="text-2xl font-black text-foreground">Algo salió mal</h2>
            <p className="text-muted-foreground text-sm">{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-bold text-xs"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-border/20", className)} />
  );
}

function PostSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pt-16 md:pt-20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="col-span-1 lg:col-span-9 space-y-6">
            {/* Back button skeleton */}
            <SkeletonBlock className="h-8 w-36 rounded-full" />

            {/* Author skeleton */}
            <div className="flex items-center gap-3 mb-8">
              <SkeletonBlock className="w-10 h-10 rounded-full" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3 w-20" />
              </div>
            </div>

            {/* Title skeleton */}
            <SkeletonBlock className="h-12 w-full mb-2" />
            <SkeletonBlock className="h-12 w-3/4 mb-8" />

            {/* Labels skeleton */}
            <div className="flex gap-2 mb-8">
              <SkeletonBlock className="h-6 w-20 rounded-full" />
              <SkeletonBlock className="h-6 w-16 rounded-full" />
              <SkeletonBlock className="h-6 w-24 rounded-full" />
            </div>

            {/* Share + rating skeleton */}
            <div className="flex items-center gap-3 mb-8">
              <SkeletonBlock className="h-8 w-24 rounded-full" />
              <SkeletonBlock className="h-8 w-8 rounded-full" />
              <SkeletonBlock className="h-5 w-16 ml-auto" />
            </div>

            {/* Body skeleton */}
            <div className="space-y-2 mb-8">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
              <SkeletonBlock className="h-4 w-4/5" />
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-4 w-2/3" />
            </div>

            {/* Answers header skeleton */}
            <SkeletonBlock className="h-6 w-40 mb-6" />

            {/* Answer textarea skeleton */}
            <SkeletonBlock className="h-32 w-full mb-8 rounded-md" />

            {/* Answer cards skeleton */}
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4 py-6 border-b border-border/30">
                <div className="flex flex-col items-center gap-2 w-12 shrink-0">
                  <SkeletonBlock className="w-5 h-5 rounded" />
                  <SkeletonBlock className="h-5 w-8" />
                  <SkeletonBlock className="w-5 h-5 rounded" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <SkeletonBlock className="w-6 h-6 rounded-full" />
                    <SkeletonBlock className="h-3 w-40" />
                  </div>
                  <SkeletonBlock className="h-4 w-full" />
                  <SkeletonBlock className="h-4 w-5/6" />
                  <SkeletonBlock className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar skeleton */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28 space-y-6">
              <SkeletonBlock className="h-4 w-40 mb-6" />
              <div className="flex items-center gap-3">
                <SkeletonBlock className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostPageClient({
  id,
  getPostById,
  createAnswer,
  rateItem,
  editAnswer,
  deleteAnswer,
  deletePost,
  acceptAnswer,
  editPost,
}: PostPageClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useLanguage();

  const queryClient = useQueryClient();

  const { data: postData, isLoading } = useQuery({
    queryKey: ["forumPost", id],
    queryFn: async () => {
      const res = await getPostById(id);
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
      return res.post as RawPost & { answers: RawAnswer[] };
    },
    staleTime: 30000,
  });

  const question: Question | null = useMemo(() => {
    if (!postData) return null;

    const authorMap = new Map<string, string>();
    const parentMap = new Map<string, string>();
    postData.answers.forEach(a => {
      authorMap.set(a.id, a.author.name || t.forum.fallbackAuthorName);
      if (a.parentId) parentMap.set(a.id, a.parentId);
    });

    const rootIds = new Set<string>();
    for (const ans of postData.answers) {
      if (!ans.parentId) rootIds.add(ans.id);
    }

    function findRootId(id: string): string | null {
      let current = id;
      const visited = new Set<string>();
      while (parentMap.has(current)) {
        if (visited.has(current)) return null;
        visited.add(current);
        current = parentMap.get(current)!;
      }
      return rootIds.has(current) ? current : null;
    }

    const roots: Answer[] = [];

    for (const ans of postData.answers) {
      const mapped: Answer = {
        id: ans.id,
        content: ans.content,
        author: ans.author.name || t.forum.fallbackAuthorName,
        authorId: ans.authorId,
        authorImage: ans.author.image,
        authorRole: ans.author.role,
        ratingTotal: ans.ratingTotal,
        ratingCount: ans.ratingCount,
        isAccepted: ans.isAccepted,
        createdAt: ans.createdAt,
        parentId: ans.parentId ?? null,
      };

      if (!ans.parentId) {
        mapped.replies = [];
        roots.push(mapped);
      } else {
        const rootId = findRootId(ans.id);
        if (rootId) {
          const root = roots.find(r => r.id === rootId);
          if (root) {
            if (!root.replies) root.replies = [];
            if (!rootIds.has(ans.parentId)) {
              mapped.parentAuthor = authorMap.get(ans.parentId);
            }
            root.replies.push(mapped);
          }
        }
      }
    }

    for (const root of roots) {
      if (root.replies) {
        root.replies.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    }

    return {
      id: postData.id,
      title: postData.title,
      body: postData.body,
      author: postData.author.name || t.forum.fallbackAuthorName,
      authorId: postData.authorId || postData.author.id,
      authorImage: postData.author.image,
      labels: postData.labels,
      ratingTotal: postData.ratingTotal,
      ratingCount: postData.ratingCount,
      createdAt: postData.createdAt,
      isTrending: postData.isTrending,
      answers: roots,
    };
  }, [postData, t]);

  const createAnswerMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: string | null }) => {
      const res = await createAnswer({ content: data.content, postId: id, parentId: data.parentId ?? null });
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
      return res.answer as RawAnswer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPost", id] });
      toast.success(t.forum.toasts.answerSent);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? t.forum.toasts.answerSendError);
    },
  });

  const rateItemMutation = useMutation({
    mutationFn: async (data: { itemId: string; rating: number; isQuestion: boolean }) => {
      const res = await rateItem({
        itemId: data.itemId,
        itemType: data.isQuestion ? "post" : "answer",
        value: data.rating,
      });
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
      return res.rating as unknown;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPost", id] });
      toast.success(t.forum.toasts.ratingSaved);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? t.forum.toasts.ratingError);
    },
  });

  const editAnswerMutation = useMutation({
    mutationFn: async (data: { answerId: string; content: string }) => {
      const res = await editAnswer(data);
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
      return res.answer as RawAnswer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPost", id] });
      toast.success(t.forum.toasts.answerUpdated);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? t.forum.toasts.answerUpdateError);
    },
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: async (answerId: string) => {
      const res = await deleteAnswer(answerId);
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPost", id] });
      toast.success(t.forum.toasts.answerDeleted);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? t.forum.toasts.answerDeleteError);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await deletePost(postId);
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
    },
    onSuccess: () => {
      toast.success(t.forum.toasts.postDeleted);
      router.push("/comunidad");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? t.forum.toasts.postDeleteError);
    },
  });

  const acceptAnswerMutation = useMutation({
    mutationFn: async (data: { answerId: string; postId: string }) => {
      const res = await acceptAnswer(data);
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
      return res.answer as RawAnswer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPost", id] });
      toast.success(t.forum.toasts.answerAccepted);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? t.forum.toasts.answerAcceptError);
    },
  });

  const editPostMutation = useMutation({
    mutationFn: async (data: { postId: string; title?: string; body?: string; labels?: string[] }) => {
      const res = await editPost(data);
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
      return res.post as RawPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPost", id] });
      toast.success(t.forum.toasts.postUpdated);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? t.forum.toasts.postUpdateError);
    },
  });

  const añadirNuevaRespuesta = useCallback(async (content: string, parentId?: string | null) => {
    if (status !== "authenticated") {
      toast.error(t.forum.toasts.loginRequired);
      return;
    }
    await createAnswerMutation.mutateAsync({ content, parentId });
  }, [status, createAnswerMutation, t]);

  const handleRate = async (itemId: string, rating: number, isQuestion: boolean = false) => {
    if (status !== "authenticated") {
      toast.error(t.forum.toasts.loginRequiredVote);
      return;
    }
    await rateItemMutation.mutateAsync({ itemId, rating, isQuestion });
  };

  const handleEditAnswer = async (answerId: string, content: string) => {
    await editAnswerMutation.mutateAsync({ answerId, content });
  };

  const handleDeleteAnswer = async (answerId: string) => {
    await deleteAnswerMutation.mutateAsync(answerId);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    await deletePostMutation.mutateAsync(questionId);
  };

  const handleAcceptAnswer = async (answerId: string) => {
    await acceptAnswerMutation.mutateAsync({ answerId, postId: id });
  };

  const handleEditPost = async (data: { title?: string; body?: string; labels?: string[] }) => {
    await editPostMutation.mutateAsync({ postId: id, ...data });
  };

  if (!question || isLoading) {
    return <PostSkeleton />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden pt-16 md:pt-20">
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
                onAcceptAnswer={handleAcceptAnswer}
                onEditPost={handleEditPost}
                currentUserId={session?.user?.id}
                currentUserRole={session?.user?.role}
              />
            </div>

            <div className="hidden lg:block lg:col-span-3">
              <div className="sticky top-28 space-y-8">
                <div>
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {t.forum.sidebar.contributors}
                  </h3>
                  
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0 border border-primary/30 shadow-inner">
                        {question.author.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-sm block text-foreground">{question.author}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t.forum.sidebar.author}</span>
                      </div>
                    </div>

                    {Array.from(new Set(question.answers.map(a => a.author))).map((authorName, idx) => {
                      if (authorName === question.author) return null;
                      const answer = question.answers.find(a => a.author === authorName);
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-foreground shrink-0 border border-border">
                            {authorName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-sm block text-foreground">{authorName}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{answer?.authorRole || t.forum.fallbackRole}</span>
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
    </ErrorBoundary>
  );
}
