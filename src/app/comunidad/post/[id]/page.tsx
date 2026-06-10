import { Metadata } from "next";
import PostPageClient from "./PostPageClient";
import { config } from "@/config/config";
import {
  getPostByIdAction,
  createAnswerAction,
  rateItemAction,
  editAnswerAction,
  deleteAnswerAction,
  deletePostAction,
  acceptAnswerAction,
  editPostAction,
} from "@/backend/modules/forum/forum.actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await getPostByIdAction(id);
    if (res.success) {
      const post = res.post as { title: string };
      return { title: `${post.title} | ${config.app.name}` };
    }
  } catch {}
  return { title: `Publicación | ${config.app.name}` };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <PostPageClient
      id={resolvedParams.id}
      getPostById={getPostByIdAction}
      createAnswer={createAnswerAction}
      rateItem={rateItemAction}
      editAnswer={editAnswerAction}
      deleteAnswer={deleteAnswerAction}
      deletePost={deletePostAction}
      acceptAnswer={acceptAnswerAction}
      editPost={editPostAction}
    />
  );
}
