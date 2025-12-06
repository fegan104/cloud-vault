import { generateChallengeForSession } from "@/lib/challenge";
import { prisma } from "@/lib/db";
import ViewShareScreen from "./ViewShareScreen";

export default async function Page({
  params,
}: {
  params: Promise<{ shareId: string }>
}) {
  const { shareId } = await params;
  const shareKeyDerivationParams = await prisma.share.findUnique({
    where: { id: shareId },
    select: {
      publicKey: true,
      keyDerivationSalt: true,
      argon2MemorySize: true,
      argon2Iterations: true,
      argon2Parallelism: true,
      argon2HashLength: true,
    }
  });

  const { challenge } = await generateChallengeForSession();

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