import { redirect } from "next/navigation";
import PendingReviewPage from "@/components/pages/PendingReviewPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";
import { getArticlesWithPendingFeedback } from "@/supabase/CRUD/querries";

export default async function PendingPage() {
  const authResult = await checkAuthStatusServer();
  
  // Allow anyone authenticated as author to view this page
  if (!authResult.authenticated || authResult.role !== "author") {
    requireAuthor(authResult, "/pending");
  }
  
  const pendingArticles = await getArticlesWithPendingFeedback();
  
  return <PendingReviewPage user={authResult} initialArticles={pendingArticles} />;
}
