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
  let products: Product[] = [];
  try {
    log.debug("Página de inicio: consultando catálogo de productos.");
    const result = await getPaginatedProductsAction(1, 40);
    products = result.products as unknown as Product[];
    log.debug("Página de inicio: catálogo de productos cargado exitosamente.", { totalProductos: products.length });
  } catch (error) {
    log.error("Página de inicio: error al cargar el catálogo de productos:", error);
  }

  let forumTopics: HomeForumTopic[] = [];
  try {
    log.debug("Página de inicio: consultando foro.");
    const res = await getPostsAction(undefined, undefined, 3, undefined, "popular");
    if (res.success && res.posts) {
      const colors = ["bg-emerald-500", "bg-amber-500", "bg-blue-500"];
      const now = new Date().getTime();
      forumTopics = (res.posts as HomeForumPost[]).map((post, i) => {
        return {
          id: (post as any).id || "",
          title: post.title,
          author: post.author?.name || "Usuario",
          avatar: post.author?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${post.author?.name || 'User'}`,
          participants: (post._count?.answers || 0) + 1,
          posts: post._count?.answers || 0,
          time: formatRelativeAge(now, post.createdAt),
          color: colors[i % colors.length]
        };
      });
      log.debug("Página de inicio: foro cargado exitosamente.", { topics: forumTopics.length });
    }
  } catch (error) {
    log.error("Página de inicio: error al cargar el foro:", error);
  }

  let realStats = { users: 500, posts: 100, products: 15 };
  try {
    log.debug("Página de inicio: consultando estadísticas globales.");
    const result = await getHomeStatsAction();
    realStats = result.stats;
    log.debug("Página de inicio: estadísticas globales cargadas exitosamente.", { stats: realStats });
  } catch (error) {
    log.error("Página de inicio: error al cargar estadísticas globales:", error);
  }

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
