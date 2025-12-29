import { getUser } from "@/lib/user/getUser";
import AccountScreen from "./AccountScreen";
import Unauthorized from "@/components/Unauthorized";
import Scaffold from "@/components/Scaffold";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) {
    return (
      <Scaffold>
        <Unauthorized />
      </Scaffold>
    )
  }
  return <AccountScreen currentEmail={user.email} />;
}