import AuthorsPage from "@/components/pages/AuthorsPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";
import { ReactNode } from "react";

export default async function AuthorsRoute(): Promise<ReactNode> {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  return <AuthorsPage user={authResult} />;
}