import ArticleMatchesPage from "@/components/pages/ArticleMatchesPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function ArticleCompanies() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  return <ArticleMatchesPage user={authResult} />;
}
