import ArticleEditor from "@/components/pages/CreateArticle";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function CreatePage() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);
  
  return <ArticleEditor authUser={authResult} />;
}