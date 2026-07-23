import { Metadata } from "next";
import { notFound } from "next/navigation";
import { config } from "@/config/config";
import { getPublicStoreBySlugAction } from "@/backend/modules/store/store.actions";
import { getPaginatedProductsAction } from "@/backend/modules/product/product.actions";
import { openStoreChatAction, getStoreChatUnreadAction } from "@/backend/modules/chat/chat.actions";
import { StorePublicProfile } from "@/frontend/components/store/StorePublicProfile";
import logger from "@/utils/logger";

const log = logger.child();

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const store = await getPublicStoreBySlugAction(slug);
    if (store) {
      const description = store.description?.length > 200
        ? `${store.description.slice(0, 200)}...`
        : store.description || "";
      const url = `${config.app.url}/tienda/${slug}`;

      return {
        title: `${store.name} | ${config.app.name}`,
        description,
        openGraph: {
          title: store.name,
          description,
          url,
          siteName: config.app.name,
          type: "website",
          ...(store.logo ? { images: [{ url: store.logo, width: 400, height: 400 }] } : {}),
        },
        twitter: {
          card: "summary",
          title: store.name,
          description,
          ...(store.logo ? { images: [store.logo] } : {}),
        },
        alternates: { canonical: url },
      };
    }
  } catch {}
  return { title: `Tienda | ${config.app.name}` };
}

export default async function StorePublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  log.info("Renderizando página pública de tienda:", { slug });

  const store = await getPublicStoreBySlugAction(slug);

  if (!store) {
    log.warn("Tienda pública no encontrada:", { slug });
    notFound();
  }

  // Fetch store products (up to 50 for the public page)
  const { products } = await getPaginatedProductsAction(1, 50, undefined, store.id);

  return <StorePublicProfile store={store as any} products={products as any[]} openStoreChatAction={openStoreChatAction} getStoreChatUnreadAction={getStoreChatUnreadAction} />;
}
