import { Metadata } from "next";
import PostPageClient from "./PostPageClient";
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

export const metadata: Metadata = {
  title: "Detalles de Publicación",
};

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
