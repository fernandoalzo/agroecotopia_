import { useQuery } from "@tanstack/react-query";
import { getPopularProductsAction } from "@/backend/modules/product/product.actions";
import { getPostsAction } from "@/backend/modules/forum/forum.actions";
import { getHomeStatsAction } from "@/backend/modules/stats/stats.actions";
import type { Product } from "@/types";

interface HomeForumPost {
  id: string;
  title: string;
  createdAt: Date | string;
  author?: { name?: string | null; image?: string | null } | null;
  _count?: { answers?: number };
}

export interface HomeForumTopic {
  id: string;
  title: string;
  author: string;
  avatar: string;
  participants: number;
  posts: number;
  time: string;
  color: string;
}

export interface HomeStats {
  users: number;
  posts: number;
  products: number;
}

function formatRelativeAge(now: number, createdAt: Date | string) {
  const diff = now - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return hours >= 24 ? `${Math.floor(hours / 24)}d` : `${hours}h`;
}

export function useHomeData() {
  const productsQuery = useQuery({
    queryKey: ["home", "products"],
    queryFn: async () => {
      try {
        const result = await getPopularProductsAction(1, 10);
        return (result.products ?? []) as Product[];
      } catch {
        return [] as Product[];
      }
    },
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const forumQuery = useQuery({
    queryKey: ["home", "forum"],
    queryFn: async () => {
      try {
        const res = await getPostsAction(undefined, undefined, 3, undefined, "popular");
        const colors = ["bg-emerald-500", "bg-amber-500", "bg-blue-500"];
        const now = new Date().getTime();
        if (res.success && res.posts) {
          return (res.posts as HomeForumPost[]).map((post, i) => ({
            id: post.id || "",
            title: post.title,
            author: post.author?.name || "Usuario",
            avatar: post.author?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${post.author?.name || 'User'}`,
            participants: (post._count?.answers || 0) + 1,
            posts: post._count?.answers || 0,
            time: formatRelativeAge(now, post.createdAt),
            color: colors[i % colors.length],
          }));
        }
        return [] as HomeForumTopic[];
      } catch {
        return [] as HomeForumTopic[];
      }
    },
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const statsQuery = useQuery({
    queryKey: ["home", "stats"],
    queryFn: async () => {
      try {
        const result = await getHomeStatsAction();
        return result.stats as HomeStats;
      } catch {
        return { users: 500, posts: 100, products: 15 } as HomeStats;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    products: productsQuery.data ?? ([] as Product[]),
    forumTopics: forumQuery.data ?? ([] as HomeForumTopic[]),
    stats: statsQuery.data ?? { users: 500, posts: 100, products: 15 },
    isPending: productsQuery.isPending || forumQuery.isPending || statsQuery.isPending,
    loadPopularProducts: getPopularProductsAction,
  };
}
