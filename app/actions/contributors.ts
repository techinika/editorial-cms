"use server";

import { getArticleContributors, addContributor, removeContributor, updateArticleOwner, getAllAuthors, getArticleById, getUnresolvedFeedbackCount, getArticleFeedback } from "@/supabase/CRUD/queries";
import { revalidatePath } from "next/cache";

export async function fetchContributors(articleId: string) {
  return await getArticleContributors(articleId);
}

export async function addArticleContributor(articleId: string, authorId: string) {
  const result = await addContributor(articleId, authorId);
  revalidatePath(`/edit/${articleId}`);
  return result;
}

export async function removeArticleContributor(contributorId: string, articleId: string) {
  const result = await removeContributor(contributorId);
  revalidatePath(`/edit/${articleId}`);
  return result;
}

export async function changeArticleOwner(articleId: string, newAuthorId: string) {
  const result = await updateArticleOwner(articleId, newAuthorId);
  revalidatePath(`/edit/${articleId}`);
  return result;
}

export async function fetchAllAuthors() {
  return await getAllAuthors();
}

export async function refreshArticleData(articleId: string) {
  const article = await getArticleById(articleId);
  const feedback = await getArticleFeedback(articleId);
  const unresolvedCount = await getUnresolvedFeedbackCount(articleId);
  const contributors = await getArticleContributors(articleId);
  return { article, feedback, unresolvedCount, contributors };
}
