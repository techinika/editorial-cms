import CMSDashboard from "@/components/pages/MainPage";
import { getArticles } from "@/supabase/CRUD/querries";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function Home() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  const initialArticles = await getArticles(0, 12);
  return <CMSDashboard initialArticles={initialArticles} user={authResult} />;
}
