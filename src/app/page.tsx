import ImmersiveJourney from "@/components/home/ImmersiveJourney";
import Footer from "@/components/Footer";
import { getPaginatedProductsAction } from "@/backend/modules/product/product.actions";
import { getPostsAction } from "@/backend/modules/forum/forum.actions";
import prisma from "@/backend/db/prisma";
import logger from "@/utils/logger";

const log = logger.child("src/app/page.tsx");

export const dynamic = "force-dynamic";

export default async function Home() {
  log.info("Renderizando página de inicio (Home Page).");

  let products: any[] = [];
  try {
    log.debug("Página de inicio: consultando catálogo de productos.");
    const result = await getPaginatedProductsAction(1, 40);
    products = result.products;
    log.debug("Página de inicio: catálogo de productos cargado exitosamente.", { totalProductos: products.length });
  } catch (error) {
    log.error("Página de inicio: error al cargar el catálogo de productos:", error);
  }

  let forumTopics: any[] = [];
  try {
    const res = await getPostsAction(undefined, undefined, 3, undefined, "popular");
    if (res.success && res.posts) {
      const colors = ["bg-emerald-500", "bg-amber-500", "bg-blue-500"];
      forumTopics = res.posts.map((post: any, i: number) => {
        const diff = Date.now() - new Date(post.createdAt).getTime();
        const minutes = Math.floor(diff / 60000);
        let timeStr = `${minutes}m`;
        if (minutes >= 60) {
          const hours = Math.floor(minutes / 60);
          timeStr = hours >= 24 ? `${Math.floor(hours / 24)}d` : `${hours}h`;
        }
        
        return {
          title: post.title,
          author: post.author?.name || "Usuario",
          avatar: post.author?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${post.author?.name || 'User'}`,
          participants: (post._count?.answers || 0) + 1,
          posts: post._count?.answers || 0,
          time: timeStr,
          color: colors[i % colors.length]
        };
      });
    }
  } catch (error) {
    log.error("Página de inicio: error al cargar el foro:", error);
  }

  let realStats = { users: 500, posts: 100, products: 15 };
  try {
    const [users, posts, productsCount] = await Promise.all([
      prisma.user.count(),
      prisma.forumPost.count(),
      prisma.product.count()
    ]);
    realStats = { users, posts, products: productsCount };
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

