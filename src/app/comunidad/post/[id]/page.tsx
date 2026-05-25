import { Metadata } from "next";
import PostPageClient from "./PostPageClient";

export const metadata: Metadata = {
  title: "Detalles de Publicación",
};

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <PostPageClient id={resolvedParams.id} />;
}
