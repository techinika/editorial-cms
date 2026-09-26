import IdeasPage from "@/components/pages/IdeasPage";
import { checkAuthStatusServer, requireEditor } from "@/lib/auth-server";

/**
 * The editorial pipeline.
 *
 * Open to authors as well as admins: an author needs to see the pitch assigned
 * to them in order to write it. The API pins an author to their own ideas, so
 * the page being reachable doesn't widen what they can read.
 */
export default async function Ideas() {
  const authResult = await checkAuthStatusServer();
  requireEditor(authResult, "/ideas");

  return <IdeasPage user={authResult} />;
}
