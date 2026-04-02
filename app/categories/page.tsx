import { redirect } from "next/navigation";
import CategoriesPage from "@/components/pages/CategoriesPage";
import { checkAuthStatusServer, getAuthUrl } from "@/lib/auth-server";

export default async function Categories() {
  const authResult = await checkAuthStatusServer();
  
  if (!authResult.authenticated || authResult.role !== "author") {
    const authUrl = getAuthUrl();
    const currentUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const loginUrl = `${authUrl}/status?redirect=${encodeURIComponent(currentUrl)}/categories`;
    redirect(loginUrl);
  }
  
  return <CategoriesPage user={authResult} />;
}