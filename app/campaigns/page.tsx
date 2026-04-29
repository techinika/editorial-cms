import CampaignsPage from "@/components/pages/CampaignsPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function Campaigns() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  return <CampaignsPage user={authResult} />;
}
