import { redirect } from "next/navigation";
import PendingReviewPage from "@/components/pages/PendingReviewPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function PendingPage() {
  const authResult = await checkAuthStatusServer();
  
  if (!authResult.authenticated || authResult.role !== "author") {
    requireAuthor(authResult, "/pending");
  }
  
  return <PendingReviewPage user={authResult} />;
}
