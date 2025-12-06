import { generateChallengeForShare } from "@/lib/challenge";
import { prisma } from "@/lib/db";
import ViewShareScreen from "./ViewShareScreen";

export default async function Page({
  params,
}: {
  params: Promise<{ shareId: string }>
}) {
  const { shareId } = await params;
  const { challenge, shareKeyDerivationParams } = await generateChallengeForShare(shareId);

  if (!shareKeyDerivationParams) {
    return <div>Share not found</div>;
  }

  return (
    <>
      <ViewShareScreen
        shareId={shareId}
        shareKeyDerivationParams={shareKeyDerivationParams}
        challenge={challenge}
      />
    </>
  )
}