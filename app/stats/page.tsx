import { redirect } from "next/navigation";
import StatsPage from "@/components/pages/StatsPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function Stats() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult, "/stats");
  
  return <StatsPage user={authResult} />;
}