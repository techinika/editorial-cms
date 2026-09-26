import { redirect } from "next/navigation";
import VideosPage from "@/components/pages/VideosPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function Videos() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult, "/videos");

  return <VideosPage user={authResult} />;
}
