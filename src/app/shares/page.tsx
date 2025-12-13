import { getSharesForUser } from "@/lib/share/getSharesForUser";
import SharesScreen from "./SharesScreen";

export default async function SharesPage() {
  const shares = await getSharesForUser();

  return <SharesScreen shares={shares} />;
}