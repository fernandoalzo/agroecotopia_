"use client";

import { useState, useEffect } from "react";
import CommunityQAForum from "@/frontend/components/comunidad/CommunityQAForum";
import { Question } from "@/frontend/components/comunidad/forum/forum.types";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ComunidadPageClientProps {
  getPosts: (...args: any[]) => Promise<any>;
  createPost: (postData: { title: string; body: string; labels: string[] }) => Promise<any>;
  rateItem: (data: { itemId: string; itemType: "post" | "answer"; value: number }) => Promise<any>;
  getCommunityStats: () => Promise<any>;
  getTopContributors: () => Promise<any>;
  getTrendingLabels: () => Promise<any>;
}

interface TopContributorResult {
  name: string;
  role: string;
  points: number;
}

export default function ComunidadPageClient({
  getPosts,
  createPost,
  rateItem,
  getCommunityStats,
  getTopContributors,
  getTrendingLabels,
}: ComunidadPageClientProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeCommunityStats, setActiveCommunityStats] = useState({ totalMembers: "0", onlineNow: "0" });
  const [topContributors, setTopContributors] = useState<any[]>([]);

  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");

  const handleSetFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      // "Todos" clears the category
      if (value === "Todos") {
        const next = { ...prev };
        delete next[category];
        return next;
      }

      const current = prev[category] || [];
      const isAlreadySelected = current.includes(value);

      // Toggle: remove if already selected, add if not
      const updated = isAlreadySelected
        ? current.filter(v => v !== value)
        : [...current, value];

      // If empty after removal, delete the category key
      if (updated.length === 0) {
        const next = { ...prev };
        delete next[category];
        return next;
      }

      return { ...prev, [category]: updated };
    });
  };

  const queryClient = useQueryClient();

  const { 
    data: postsData, 
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ["forumPosts", activeFilters, searchQuery, sortBy],
    queryFn: async ({ pageParam = undefined }: { pageParam: string | undefined }) => {
      const res = await getPosts(activeFilters, searchQuery, 10, pageParam, sortBy);
      if (!res.success) throw new Error(res.error);
      return { posts: res.posts, nextCursor: res.nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  // Transform backend posts to UI Question format
  useEffect(() => {
    if (postsData) {
      const allPosts = postsData.pages.flatMap((page) => page.posts);
      const mapped: Question[] = allPosts.map((p: any) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        author: p.author.name || "Usuario",
        authorImage: p.author.image,
        labels: p.labels,
        ratingTotal: p.ratingTotal,
        ratingCount: p.ratingCount,
        createdAt: p.createdAt,
        answers: [], // We don't fetch all answers for the feed
        _count: p._count,
        isTrending: p.isTrending,
      }));
      setQuestions(mapped);
    }
  }, [postsData]);

  const { data: communityStats } = useQuery({
    queryKey: ["communityStats"],
    queryFn: async () => {
      const res = await getCommunityStats();
      if ("error" in res) throw new Error(res.error);
      if (!res.success) throw new Error("Unknown error");
      return res.stats;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: topContributorsData } = useQuery({
    queryKey: ["topContributors"],
    queryFn: async () => {
      const res = await getTopContributors();
      if ("error" in res) throw new Error(res.error);
      if (!res.success) throw new Error("Unknown error");
      return res.contributors;
    },
  });

  const { data: trendingLabels } = useQuery({
    queryKey: ["trendingLabels"],
    queryFn: async () => {
      const res = await getTrendingLabels();
      if (!res.success) throw new Error(res.error);
      return res.labels;
    },
  });

  useEffect(() => {
    if (communityStats) {
      setActiveCommunityStats({
        totalMembers: communityStats.totalMembers > 1000 ? (communityStats.totalMembers / 1000).toFixed(1) + "k" : communityStats.totalMembers.toString(),
        onlineNow: communityStats.onlineNow.toString()
      });
    }
  }, [communityStats]);

  useEffect(() => {
    if (topContributorsData) {
      const mapped = topContributorsData.map((c: TopContributorResult, index: number) => ({
        name: c.name,
        role: c.role,
        points: c.points > 1000 ? (c.points / 1000).toFixed(1) + "k" : c.points.toString(),
        rank: index + 1
      }));
      setTopContributors(mapped);
    }
  }, [topContributorsData]);

  // Filtering is now handled by the backend via the query
  const filteredQuestions = questions;

  const createPostMutation = useMutation({
    mutationFn: async (postData: { title: string; body: string; labels: string[] }) => {
      const res = await createPost(postData);
      if ("error" in res) throw new Error(res.error);
      if (!res.success) throw new Error("Unknown error");
      return res.post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      toast.success("Publicación creada con éxito");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al crear la publicación");
    },
  });

  const rateItemMutation = useMutation({
    mutationFn: async (data: { itemId: string; rating: number }) => {
      const res = await rateItem({ itemId: data.itemId, itemType: "post", value: data.rating });
      if ("error" in res) throw new Error(res.error);
      if (!res.success) throw new Error("Unknown error");
      return res.rating;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      toast.success("Calificación guardada");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al calificar");
    },
  });

  const crearNuevaPublicacion = (postData: { title: string; body: string; labels: string[] }) => {
    createPostMutation.mutate(postData);
  };

  const handleRate = (itemId: string, rating: number) => {
    rateItemMutation.mutate({ itemId, rating });
  };

  return (
    <main className="min-h-screen bg-background">
      <CommunityQAForum 
        questions={filteredQuestions}
        activeCommunityStats={activeCommunityStats}
        topContributors={topContributors}
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
