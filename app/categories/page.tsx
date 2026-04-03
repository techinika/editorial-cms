import { redirect } from "next/navigation";
import CategoriesPage from "@/components/pages/CategoriesPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function Categories() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult, "/categories");
  
  return <CategoriesPage user={authResult} />;
}