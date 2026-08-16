import CampaignFormPage from "@/components/pages/CampaignFormPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function NewCampaign() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  return <CampaignFormPage user={authResult} />;
}
