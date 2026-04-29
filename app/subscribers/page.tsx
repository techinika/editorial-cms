import SubscribersPage from "@/components/pages/SubscribersPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function Subscribers() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  return <SubscribersPage user={authResult} />;
}
