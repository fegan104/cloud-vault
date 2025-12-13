import { prisma } from "@/lib/db";

export async function getShareName(shareId: string) {
  const share = await prisma.share.findUnique({
    where: {
      id: shareId,
    },
    select: {
      name: true,
    },
  });

  return share?.name;
}