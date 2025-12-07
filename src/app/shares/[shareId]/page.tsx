import { prisma } from "@/lib/db";
import ViewShareScreen from "./ViewShareScreen";
import { VaultAppBar } from "@/components/VaultAppBar";

export default async function Page({
  params,
}: {
  params: Promise<{ shareId: string }>
}) {
  const { shareId } = await params;
  const shareName = await prisma.share.findUnique({
    where: {
      id: shareId,
    },
    select: {
      name: true,
    },
  });

  if (!shareName) {
    return <div>Share not found</div>;
  }

  return (
    <>
      {/* //TODO hide sign out button if not signed in */}
      <VaultAppBar showSignOut={false} />
      <ViewShareScreen
        shareId={shareId}
        name={shareName.name}
      />
    </>
  )
}