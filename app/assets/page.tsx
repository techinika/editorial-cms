import AssetsPage from "@/components/pages/AssetsPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function Assets() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  return <AssetsPage user={authResult} />;
}
