import { redirect } from "next/navigation";
import StatsPage from "@/components/pages/StatsPage";
import { checkAuthStatusServer, getAuthUrl } from "@/lib/auth-server";

export default async function Stats() {
  const authResult = await checkAuthStatusServer();
  
  if (!authResult.authenticated || authResult.role !== "author") {
    const authUrl = getAuthUrl();
    const currentUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const loginUrl = `${authUrl}/status?redirect=${encodeURIComponent(currentUrl)}/stats`;
    redirect(loginUrl);
  }
  
  return <StatsPage user={authResult} />;
}