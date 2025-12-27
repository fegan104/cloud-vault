import { getUser } from "@/lib/user/getUser";
import AccountScreen from "./AccountScreen";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) {
    redirect("/");
  }
  return <AccountScreen currentEmail={user.email} />;
}