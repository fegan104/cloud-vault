import { redirect } from "next/navigation";
import VaultScreen from "./VaultScreen";
import { getSessionToken } from "@/lib/session/getSessionToken";
import { getUserWithFiles } from "@/lib/user/getUserWithFiles";
import Unauthorized from "@/components/Unauthorized";
import Scaffold from "@/components/Scaffold";

export default async function VaultPage() {
  const sessionToken = await getSessionToken()
  if (!sessionToken) {
    redirect("/signin")
  }

  // Query for a non-expired session and user's encrypted files
  const user = await getUserWithFiles(sessionToken)

  if (!user) {
    return (
      <Scaffold>
        <Unauthorized />
      </Scaffold>
    )
  }

  return (
    <VaultScreen
      files={user.encryptedFiles}
    />
  );
}