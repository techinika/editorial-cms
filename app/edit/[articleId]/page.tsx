import { redirect } from "next/navigation";
import ArticleEditor from "@/components/pages/CreateArticle";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";
import { getArticleById, getArticleFeedback, getUnresolvedFeedbackCount, getArticleContributors } from "@/supabase/CRUD/querries";

interface EditPageProps {
  params: Promise<{ articleId: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult, "/edit");
  
  const { articleId } = await params;
  const article = await getArticleById(articleId);
  
  if (!article) {
    redirect("/");
  }

  const isOwner = article.author?.id === authResult.user?.id;
  const isAdmin = authResult.isAdmin;
  const canEdit = isOwner || isAdmin;
  
  const feedback = await getArticleFeedback(articleId);
  const unresolvedCount = await getUnresolvedFeedbackCount(articleId);
  const contributors = await getArticleContributors(articleId);
  
  return <ArticleEditor authUser={authResult} article={article} isOwner={canEdit} isAdmin={isAdmin} feedback={feedback} unresolvedCount={unresolvedCount} contributors={contributors} />;
}