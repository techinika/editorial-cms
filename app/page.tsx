import CMSDashboard from "@/components/pages/MainPage";
import { getArticlesByStatus } from "@/supabase/CRUD/querries";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function Home() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  return <CMSDashboard user={authResult} />;
}
