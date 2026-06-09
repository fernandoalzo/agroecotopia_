import ImmersiveJourney from "@/components/home/ImmersiveJourney";
import Footer from "@/components/Footer";
import { getPaginatedProductsAction } from "@/backend/modules/product/product.actions";
import { getPostsAction } from "@/backend/modules/forum/forum.actions";
import { getHomeStatsAction } from "@/backend/modules/stats/stats.actions";
import logger from "@/utils/logger";
import type { Product } from "@/types";

const log = logger.child("src/app/page.tsx");

export const dynamic = "force-dynamic";

type HomeForumPost = {
  id: string;
  title: string;
  createdAt: Date | string;
  author?: {
    name?: string | null;
    image?: string | null;
  } | null;
  _count?: {
    answers?: number;
  };
};
type HomeForumTopic = {
  id: string;
  title: string;
  author: string;
  avatar: string;
  participants: number;
  posts: number;
  time: string;
  color: string;
};

function formatRelativeAge(now: number, createdAt: Date | string) {
  const diff = now - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  return hours >= 24 ? `${Math.floor(hours / 24)}d` : `${hours}h`;
}

export default async function Home() {
  log.info("Renderizando página de inicio (Home Page).");

  const [productsResult, forumResult, statsResult] = await Promise.all([
    (async () => {
      try {
        log.debug("Página de inicio: consultando catálogo de productos.");
        const result = await getPaginatedProductsAction(1, 40);
        const products = result.products as unknown as Product[];
        log.debug("Página de inicio: catálogo de productos cargado exitosamente.", { totalProductos: products.length });
        return products;
      } catch (error) {
        log.error("Página de inicio: error al cargar el catálogo de productos:", error);
        return [] as Product[];
      }
    })(),
    (async () => {
      try {
        log.debug("Página de inicio: consultando foro.");
        const res = await getPostsAction(undefined, undefined, 3, undefined, "popular");
        const colors = ["bg-emerald-500", "bg-amber-500", "bg-blue-500"];
        const now = new Date().getTime();
        const topics: HomeForumTopic[] = res.success && res.posts
          ? (res.posts as HomeForumPost[]).map((post, i) => ({
              id: (post as any).id || "",
              title: post.title,
              author: post.author?.name || "Usuario",
              avatar: post.author?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${post.author?.name || 'User'}`,
              participants: (post._count?.answers || 0) + 1,
              posts: post._count?.answers || 0,
              time: formatRelativeAge(now, post.createdAt),
              color: colors[i % colors.length]
            }))
          : [];
        log.debug("Página de inicio: foro cargado exitosamente.", { topics: topics.length });
        return topics;
      } catch (error) {
        log.error("Página de inicio: error al cargar el foro:", error);
        return [] as HomeForumTopic[];
      }
    })(),
    (async () => {
      try {
        log.debug("Página de inicio: consultando estadísticas globales.");
        const result = await getHomeStatsAction();
        log.debug("Página de inicio: estadísticas globales cargadas exitosamente.", { stats: result.stats });
        return result.stats;
      } catch (error) {
        log.error("Página de inicio: error al cargar estadísticas globales:", error);
        return { users: 500, posts: 100, products: 15 };
      }
    })(),
  ]);

  const products = productsResult;
  const forumTopics = forumResult;
  const realStats = statsResult;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-grow">
        <ImmersiveJourney initialProducts={products} initialForumTopics={forumTopics} realStats={realStats} />
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
