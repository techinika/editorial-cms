import BytesClient from "@/components/BytesClient";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function BytesPage() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  return <BytesClient user={authResult} />;
}
