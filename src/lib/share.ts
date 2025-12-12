"use server"

import { prisma } from "./db"
import { getSessionToken } from "./session"
import { EncryptedFile, Share } from "@prisma/client";

export type ShareWithFile = {
  file: EncryptedFile;
} & Share;

export async function getSharesForUser() {
  const sessionToken = await getSessionToken()
  if (!sessionToken) return []

  const session = await prisma.session.findUnique({
    where: {
      sessionToken
    },
    include: {
      user: {
        include: {
          encryptedFiles: {
            include: {
              shares: {
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
              }
            }
          }
        }
      }
    }
  })

  if (!session) return []

  return session.user.encryptedFiles.map((encryptedFile) => encryptedFile.shares).flat()
}

/**
 * Get a share by its ID.
 * @param shareId The uniqueID of the share to get.
 * @returns The share with its associated file or null if not found.
 */
export async function getShareById(shareId: string): Promise<ShareWithFile | null> {
  return await prisma.share.findUnique({
    where: {
      id: shareId,
    },
    include: {
      file: true,
    },
  }) as ShareWithFile;
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