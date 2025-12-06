import { getSharesForUser } from "@/lib/share";
import SharesScreen from "./SharesScreen";

export default async function SharesPage() {
  const shares = await getSharesForUser();

  return <SharesScreen shares={shares} />;
}