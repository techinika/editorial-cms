import ArticleEditor from "@/components/pages/CreateArticle";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";
import { getAllAuthors } from "@/supabase/CRUD/queries";

export default async function CreatePage() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);
  
  const allAuthors = authResult.isAdmin ? await getAllAuthors() : [];
  
  return <ArticleEditor authUser={authResult} allAuthors={allAuthors} isNewArticle={true} />;
}
