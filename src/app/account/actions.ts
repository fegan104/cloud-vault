"use server";

import { deleteSessionToken } from "@/lib/session/deleteSessionsToken";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/user/getUser";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Signs out the user. This deletes the session cookie and removes 
 * the session from the database. Then redirects to the home page.
 */
export async function signOut() {
  await deleteSessionToken();
  redirect("/");
}

/**
 * Updates the user's email.
 * @param email The new email address.
 * @returns true if the update was successful, false otherwise.
 */
export async function updateEmail(email: string): Promise<boolean> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      email: email
    }
  });

  revalidatePath("/account");

  return true;
}

// Returns the necessary data to decrypt and re-encrypt the file keys
export async function getAllEncryptedFilesKeyDerivationParams(): Promise<{ id: string; wrappedFileKey: string; keyWrapIv: string; }[]> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const files = await prisma.encryptedFile.findMany({
    where: {
      userId: user.id
    },
    select: {
      id: true,
      wrappedFileKey: true,
      keyWrapIv: true,
    }
  });

  return files;
}

// Updates the encrypted file key derivation params in the database
// This should be done in a transaction
export async function updateEncryptedFilesKeyDerivationParams(
  updates: { id: string; wrappedFileKey: string; keyWrapIv: string }[],
  publicKey: string,
  masterKeySalt: string
) {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await prisma.$transaction(
    [...updates.map((update) =>
      // Update each encrypted file
      prisma.encryptedFile.update({
        where: {
          id: update.id,
          userId: user.id, // Ensure user owns the file
        },
        data: {
          wrappedFileKey: update.wrappedFileKey,
          keyWrapIv: update.keyWrapIv,
        },
      })
    ),
    // Update user account details
    prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        publicKey: publicKey,
        masterKeySalt: masterKeySalt
      }
    })]
  );

  revalidatePath("/account");

  return true;
}
