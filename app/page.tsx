import CMSDashboard from "@/components/pages/MainPage";
import { getArticlesByStatus } from "@/supabase/CRUD/querries";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";
import { ReactNode } from "react";

export default async function Home(): Promise<ReactNode> {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  return <CMSDashboard user={authResult} />;
}
