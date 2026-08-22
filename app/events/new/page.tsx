import EventFormPage from "@/components/pages/EventFormPage";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

export default async function NewEvent() {
  const authResult = await checkAuthStatusServer();
  requireAuthor(authResult);

  return <EventFormPage user={authResult} />;
}
