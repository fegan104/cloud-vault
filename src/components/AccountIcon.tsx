import { CircleUserRound } from "lucide-react";
import Link from "next/link";

export default function AccountIcon() {
  return (
    <Link href="/account">
      <CircleUserRound className="w-6 h-6 md:w-10 md:h-10" />
    </Link>
  );
}