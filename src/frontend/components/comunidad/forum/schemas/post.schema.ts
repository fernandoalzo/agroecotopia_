import { z } from "zod";
import type { Translations } from "@/frontend/architecture/languages/types";

export function createPostSchema(t: Translations["forum"]) {
  return z.object({
    title: z.string().min(5, t.createPost.titleMinError).max(200, t.createPost.titleMaxError),
    body: z.string().min(10, t.createPost.bodyMinError),
    labels: z.array(z.string()).min(1, t.createPost.labelsMinError).max(5, t.createPost.labelsMaxError),
  });
}

export type PostFormData = z.infer<ReturnType<typeof createPostSchema>>;
