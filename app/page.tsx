import CMSDashboard from "@/components/pages/MainPage";
import { getArticlesByStatus } from "@/supabase/CRUD/querries";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";
import { ReactNode } from "react";

export default async function Home(): Promise<ReactNode> {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  const initialDrafts = await getArticlesByStatus("draft", 0, 15);
  const initialPublished = await getArticlesByStatus("published", 0, 15);

  return <CMSDashboard user={authResult} initialDrafts={initialDrafts} initialPublished={initialPublished} />;
}
