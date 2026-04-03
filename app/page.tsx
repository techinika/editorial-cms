import { redirect } from "next/navigation";
import CMSDashboard from "@/components/pages/MainPage";
import { getArticles } from "@/supabase/CRUD/querries";
import { checkAuthStatusServer, getAuthUrl } from "@/lib/auth-server";

export default async function Home() {
  const authResult = await checkAuthStatusServer();

  if (!authResult.authenticated || authResult.role !== "author") {
    const authUrl = getAuthUrl();
    const loginUrl = `${authUrl}/status`;
    redirect(loginUrl);
  }

  const initialArticles = await getArticles(0, 12);
  return <CMSDashboard initialArticles={initialArticles} user={authResult} />;
}
