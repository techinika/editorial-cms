import { redirect } from "next/navigation";
import ArticleEditor from "@/components/pages/CreateArticle";
import { checkAuthStatusServer, getAuthUrl } from "@/lib/auth-server";

export default async function CreatePage() {
  const authResult = await checkAuthStatusServer();
  
  if (!authResult.authenticated || authResult.role !== "author") {
    const authUrl = getAuthUrl();
    const loginUrl = `${authUrl}/status`;
    redirect(loginUrl);
  }
  
  return <ArticleEditor authUser={authResult} />;
}