"use server";

import { createFeedback, resolveFeedback, getArticleFeedback, getUnresolvedFeedbackCount } from "@/supabase/CRUD/queries";
import { revalidatePath } from "next/cache";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export async function addFeedback(articleId: string, authorId: string, content: string, aiGenerated: boolean = false) {
  const auth = await checkAuthStatusServer();
  requireAuthor(auth);
  const result = await createFeedback(articleId, authorId, content, aiGenerated);
  revalidatePath(`/edit/${articleId}`);
  return result;
}

export async function addAIFeedback(articleId: string, authorId: string, content: string) {
  const auth = await checkAuthStatusServer();
  requireAuthor(auth);
  const result = await createFeedback(articleId, authorId, content, true);
  revalidatePath(`/edit/${articleId}`);
  return result;
}

export async function markFeedbackResolved(feedbackId: string, articleId: string) {
  const auth = await checkAuthStatusServer();
  requireAuthor(auth);
  const result = await resolveFeedback(feedbackId);
  revalidatePath(`/edit/${articleId}`);
  return result;
}

export { getArticleFeedback, getUnresolvedFeedbackCount };
