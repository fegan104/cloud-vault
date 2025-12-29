import { getSharesForUser } from "@/lib/share/getSharesForUser";
import SharesScreen from "./SharesScreen";
import Unauthorized from "@/components/Unauthorized";
import Scaffold from "@/components/Scaffold";

export default async function SharesPage() {
  const shares = await getSharesForUser();

  if (!shares) {
    return (
      <Scaffold>
        <Unauthorized />
      </Scaffold>
    )
  }

  return <SharesScreen shares={shares} />;
}