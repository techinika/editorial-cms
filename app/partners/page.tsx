import PartnersPage from "@/components/pages/PartnersPage";
import { checkAuthStatusServer, requireAdmin } from "@/lib/auth-server";

/** Partner management. Admin only — authors have no business editing these. */
export default async function Partners() {
  const authResult = await checkAuthStatusServer();
  requireAdmin(authResult, "/partners");

  return <PartnersPage user={authResult} />;
}
