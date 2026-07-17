import QueriesClient from "@/components/QueriesClient";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function QueriesPage() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  return <QueriesClient user={authResult} />;
}
