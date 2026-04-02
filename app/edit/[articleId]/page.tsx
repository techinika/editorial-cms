import { redirect } from "next/navigation";
import ArticleEditor from "@/components/pages/CreateArticle";
import { checkAuthStatusServer, getAuthUrl } from "@/lib/auth-server";
import { getArticleById } from "@/supabase/CRUD/querries";

interface EditPageProps {
  params: Promise<{ articleId: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const authResult = await checkAuthStatusServer();
  
  if (!authResult.authenticated || authResult.role !== "author") {
    const authUrl = getAuthUrl();
    const currentUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const loginUrl = `${authUrl}/login?redirect=${encodeURIComponent(currentUrl)}/edit`;
    redirect(loginUrl);
  }
  
  const { articleId } = await params;
  const article = await getArticleById(articleId);
  
  if (!article) {
    redirect("/");
  }
  
  return <ArticleEditor authUser={authResult} article={article} />;
}