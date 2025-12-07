import { prisma } from "@/lib/db";
import ViewShareScreen from "./ViewShareScreen";

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
      <ViewShareScreen
        shareId={shareId}
        name={shareName.name}
      />
    </>
  )
}