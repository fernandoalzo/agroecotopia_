import { z } from "zod";
import type { Translations } from "@/frontend/architecture/languages/types";
import { config } from "@/config/config";

export function createPostSchema(t: Translations["forum"]) {
  return z.object({
    title: z.string()
      .min(config.forum.validation.post.titleMin, t.createPost.titleMinError)
      .max(config.forum.validation.post.titleMax, t.createPost.titleMaxError),
    body: z.string().min(config.forum.validation.post.bodyMin, t.createPost.bodyMinError),
    labels: z.array(z.string())
      .min(config.forum.validation.post.labelsMin, t.createPost.labelsMinError)
      .max(config.forum.validation.post.labelsMax, t.createPost.labelsMaxError),
  });
}

export type PostFormData = z.infer<ReturnType<typeof createPostSchema>>;
