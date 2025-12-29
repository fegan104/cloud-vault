import { redirect } from "next/navigation";
import VaultScreen from "./VaultScreen";
import { getSessionToken } from "@/lib/session/getSessionToken";
import { deleteSessionToken } from "@/lib/session/deleteSessionsToken";
import { getUserWithFiles } from "@/lib/user/getUserWithFiles";

export default async function VaultPage() {
  const sessionToken = await getSessionToken()
  if (!sessionToken) {
    redirect("/signin")
  }

  // Query for a non-expired session and user's encrypted files
  const user = await getUserWithFiles(sessionToken)

  if (!user) {
    // Delete the session token cookie in case one is leftover
    deleteSessionToken()
    redirect("/signin")
  }

  return (
    <VaultScreen
      files={user.encryptedFiles}
    />
  );
}