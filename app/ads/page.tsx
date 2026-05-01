import AdsPage from "@/components/pages/AdsPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function Ads() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  return <AdsPage user={authResult} />;
}
