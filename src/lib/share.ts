"use server"

import { prisma } from "./db"
import { getUser } from "./getUser"

export async function getSharesForUser() {
  const user = await getUser()
  if (!user) return []

  const shares = await prisma.share.findMany({
    where: {
      file: {
        userId: user.id
      }
    },
    include: {
      file: {
        select: {
          fileName: true,
          fileSize: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  return shares
}

export async function createShare(
  shareName: string,
  fileId: string,
  wrappedFileKey: string,
  keyWrapIv: string,
  keyDerivationSalt: string,
  publicKey: string,
  metadata: {
    argon2MemorySize: number;
    argon2Iterations: number;
    argon2Parallelism: number;
    argon2HashLength: number;
  }
) {
  const share = await prisma.share.create({
    data: {
      name: shareName,
      fileId,
      wrappedFileKey,
      keyWrapIv,
      keyDerivationSalt,
      publicKey,
      argon2MemorySize: metadata.argon2MemorySize,
      argon2Iterations: metadata.argon2Iterations,
      argon2Parallelism: metadata.argon2Parallelism,
      argon2HashLength: metadata.argon2HashLength,
    },
  })

  return share
}