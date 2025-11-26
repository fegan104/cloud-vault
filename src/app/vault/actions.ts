"use server";

import { storage } from "../../lib/firebaseAdmin";
import { prisma } from "../../lib/db";
import { getSessionToken } from "../../lib/getSessionToken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getDownloadUrl(fileId: string) {
  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    throw new Error("Unauthorized");
  }

  const session = await prisma.session.findUnique({
    where: {
      sessionToken,
      expiresAt: {
        gt: new Date(), // only include sessions that haven't expired
      }
    },
    include: {
      user: {
        include: {
          encryptedFiles: {
            where: {
              id: fileId,
            },
          }
        },
      },
    },
  });

  const fileRecord = session?.user.encryptedFiles?.[0];

  if (!fileRecord) {
    throw new Error("File not found");
  }

  // Generate a signed URL valid for 15 minutes
  const [url] = await storage.file(fileRecord.storagePath).getSignedUrl({
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000,
  });

  return url;
}

export async function signOut() {
  const requestCookies = await cookies();
  const sessionToken = requestCookies.get("session")?.value;
  await prisma.session.delete({ where: { sessionToken } })
  requestCookies.delete("session");
  redirect("/");
}