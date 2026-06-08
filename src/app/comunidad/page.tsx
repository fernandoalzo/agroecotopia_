import { Metadata } from "next";
import ComunidadPageClient from "./ComunidadPageClient";
import { config } from "@/config/config";
import {
  getPostsAction,
  createPostAction,
  rateItemAction,
  getCommunityStatsAction,
  getTopContributorsAction,
  getTrendingLabelsAction,
} from "@/backend/modules/forum/forum.actions";

export const metadata: Metadata = {
  title: `Comunidad | ${config.app.name}`,
  description: "Únete a nuestra vibrante comunidad agroecológica. Participa en foros, asiste a eventos y conecta con agricultores y compradores de todo el país.",
};

export default async function ComunidadPage() {
  const initialRes = await getPostsAction({}, "", 10, undefined, "newest");
  const initialPosts: unknown[] = initialRes.success ? (initialRes.posts as unknown[]) : [];

  return (
    <ComunidadPageClient
      initialPosts={initialPosts}
      initialNextCursor={initialRes.success ? (initialRes.nextCursor as unknown) : undefined}
      getPosts={getPostsAction}
      createPost={createPostAction}
      rateItem={rateItemAction}
      getCommunityStats={getCommunityStatsAction}
      getTopContributors={getTopContributorsAction}
      getTrendingLabels={getTrendingLabelsAction}
    />
  );
}
