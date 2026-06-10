"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import CommunityQAForum from "@/frontend/components/comunidad/CommunityQAForum";
import { Question, type RawPost } from "@/frontend/components/comunidad/forum/forum.types";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSocket } from "@/frontend/context/SocketContext";
import { useSocketRefresh } from "@/frontend/hooks/useSocketRefresh";

type ActionResult = { success?: boolean; [key: string]: unknown };

interface ComunidadPageClientProps {
  initialPosts: unknown[];
  initialNextCursor: unknown;
  getPosts: (
    activeFilters: Record<string, string[]>,
    searchQuery: string,
    limit: number,
    cursor: string | undefined,
    sortBy: "newest" | "popular",
  ) => Promise<ActionResult>;
  createPost: (postData: { title: string; body: string; labels: string[] }) => Promise<ActionResult>;
  rateItem: (data: { itemId: string; itemType: "post" | "answer"; value: number }) => Promise<ActionResult>;
  getCommunityStats: () => Promise<ActionResult>;
  getTopContributors: () => Promise<ActionResult>;
  getTrendingLabels: () => Promise<ActionResult>;
}

export default function ComunidadPageClient({
  initialPosts,
  initialNextCursor,
  getPosts,
  createPost,
  rateItem,
  getCommunityStats,
  getTopContributors,
  getTrendingLabels,
}: ComunidadPageClientProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");

  const { t } = useLanguage();

  const queryClient = useQueryClient();

  const { socket } = useSocket();

  useSocketRefresh({
    socket,
    enabled: true,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["forumPosts"] }),
    events: ["forum:post_created", "forum:post_deleted"],
  });

  const mapRawPost = (p: RawPost) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    author: p.author.name || t.forum.fallbackAuthorName,
    authorImage: p.author.image,
    labels: p.labels,
    ratingTotal: p.ratingTotal,
    ratingCount: p.ratingCount,
    createdAt: p.createdAt,
    answers: [] as Question["answers"],
    _count: p._count,
    isTrending: p.isTrending,
  });

  const initialData = initialPosts.length > 0
    ? {
        pages: [{
          posts: (initialPosts as RawPost[]).map(mapRawPost),
          nextCursor: initialNextCursor as string | undefined,
        }],
        pageParams: [undefined as string | undefined],
      }
    : undefined;

  const {
    data: postsPages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["forumPosts", activeFilters, searchQuery, sortBy],
    queryFn: async ({ pageParam = undefined }: { pageParam: string | undefined }) => {
      const res = await getPosts(activeFilters, searchQuery, 10, pageParam, sortBy);
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
      const rawPosts = res.posts as RawPost[];
      return {
        posts: rawPosts.map(mapRawPost),
        nextCursor: res.nextCursor as string | undefined,
      };
    },
    initialData,
    staleTime: 30000,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  const questions = useMemo(() => {
    if (!postsPages) return [];
    return postsPages.pages.flatMap((page) => page.posts);
  }, [postsPages]);

  const { data: communityStats, isPending: isStatsPending } = useQuery({
    queryKey: ["communityStats"],
    queryFn: async () => {
      const res = await getCommunityStats();
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
      const stats = res.stats as { totalMembers: number; onlineNow: number };
      return stats;
    },
    staleTime: 30000,
    gcTime: 60000,
  });

  const activeCommunityStats = useMemo(() => ({
    totalMembers: communityStats
      ? communityStats.totalMembers > 1000
        ? (communityStats.totalMembers / 1000).toFixed(1) + "k"
        : communityStats.totalMembers.toString()
      : "0",
    onlineNow: communityStats ? communityStats.onlineNow.toString() : "0",
  }), [communityStats]);

  const { data: topContributorsData, isPending: isContributorsPending } = useQuery({
    queryKey: ["topContributors"],
    queryFn: async () => {
      const res = await getTopContributors();
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
      return res.contributors as { id: string; name: string; image: string | null; role: string; points: number }[];
    },
    staleTime: 30000,
    gcTime: 60000,
  });

  const topContributors = useMemo(() => {
    if (!topContributorsData) return [];
    return topContributorsData.map((c, index) => ({
      name: c.name,
      role: c.role,
      points: c.points > 1000 ? (c.points / 1000).toFixed(1) + "k" : c.points.toString(),
      rank: index + 1,
    }));
  }, [topContributorsData]);

  const { data: trendingLabels, isPending: isTrendingPending } = useQuery({
    queryKey: ["trendingLabels"],
    queryFn: async () => {
      const res = await getTrendingLabels();
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
      return res.labels as string[];
    },
    staleTime: 30000,
    gcTime: 60000,
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: { title: string; body: string; labels: string[] }) => {
      const res = await createPost(postData);
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
      return res.post as RawPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      toast.success(t.forum.toasts.postCreated);
    },
    onError: (err: Error) => {
      toast.error(err.message || t.forum.toasts.postCreateError);
    },
  });

  const rateItemMutation = useMutation({
    mutationFn: async (data: { itemId: string; rating: number }) => {
      const res = await rateItem({ itemId: data.itemId, itemType: "post", value: data.rating });
      if (!res.success) throw new Error((res.error as string | undefined) ?? "Unknown error");
      return res.rating as unknown;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      toast.success(t.forum.toasts.ratingSaved);
    },
    onError: (err: Error) => {
      toast.error(err.message || t.forum.toasts.ratingError);
    },
  });

  const handleSetFilter = useCallback((category: string, value: string) => {
    setActiveFilters(prev => {
      if (value === "Todos") {
        const next = { ...prev };
        delete next[category];
        return next;
      }

      const current = prev[category] || [];
      const isAlreadySelected = current.includes(value);

      const updated = isAlreadySelected
        ? current.filter(v => v !== value)
        : [...current, value];

      if (updated.length === 0) {
        const next = { ...prev };
        delete next[category];
        return next;
      }

      return { ...prev, [category]: updated };
    });
  }, []);

  const crearNuevaPublicacion = useCallback(async (postData: { title: string; body: string; labels: string[] }) => {
    await createPostMutation.mutateAsync(postData);
  }, [createPostMutation]);

  const handleRate = useCallback((itemId: string, rating: number) => {
    rateItemMutation.mutate({ itemId, rating });
  }, [rateItemMutation]);

  return (
    <main className="min-h-screen bg-background">
      <CommunityQAForum
        questions={questions}
        activeCommunityStats={activeCommunityStats}
        topContributors={topContributors}
        isStatsLoading={isStatsPending}
        isContributorsLoading={isContributorsPending}
        isTrendingLoading={isTrendingPending}
        crearNuevaPublicacion={crearNuevaPublicacion}
        handleRate={handleRate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilters={activeFilters}
        setActiveFilter={handleSetFilter}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        trendingTags={trendingLabels ?? []}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
    </main>
  );
}
