"use server"
import { prisma } from "@/lib/db"
import * as opaqueServer from "@/lib/opaque/opaqueServer";

/**
 * Step 1: Client starts share registration - get registration response.
 * @param shareId - A unique identifier for this share (can be UUID generated client-side)
 * @param registrationRequest - The OPAQUE registration request from the client
 * @returns The registration response to send back to the client
 */
export async function startShareRegistration(
  shareId: string,
  registrationRequest: string
): Promise<string> {
  // Use shareId as the user identifier for OPAQUE
  return await opaqueServer.createSignUpResponse(shareId, registrationRequest);
}

/**
 * Step 2: Complete share creation with OPAQUE registration record.
 * @param shareName - Name for the share
 * @param fileId - ID of the file being shared
 * @param wrappedFileKey - File key wrapped with the share export key
 * @param keyWrapIv - IV used for key wrapping
 * @param opaqueRegistrationRecord - OPAQUE registration record
 */
export async function createShare(
  newShareId: string,
  shareName: string,
  fileId: string,
  wrappedFileKey: string,
  keyWrapIv: string,
  opaqueRegistrationRecord: string
) {
  const share = await prisma.share.create({
    data: {
      id: newShareId,
      name: shareName,
      fileId,
      wrappedFileKey,
      keyWrapIv,
      opaqueRegistrationRecord,
    },
  })

  return share
}