import { redirect } from "next/navigation";
import CommentsPage from "@/components/pages/CommentsPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function CommentsRoute() {
  const authResult = await checkAuthStatusServer();
  
  if (!authResult.authenticated || authResult.role !== "author") {
    requireAuthor(authResult, "/comments");
  }
  
  return <CommentsPage user={authResult} />;
}