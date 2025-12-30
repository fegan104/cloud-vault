"use server"

import { getShareById } from "@/lib/share/getShareById";
import { getShareAuthInfo } from "@/lib/share/getShareAuthInfo";
import { getSignedDownloadUrl } from "@/lib/firebaseAdmin";
import { upsertEphemeral, getEphemeral, deleteEphemeral } from "@/lib/opaque/ephemeral";
import * as opaqueServer from "@/lib/opaque/server";

/**
 * Get a signed URL for a share that can be used to download the file.
 * @param shareId The uniqueID of the share to get.
 * @returns The download URL for the share. */
export async function getShareDownloadUrl(shareId: string): Promise<string> {
  const share = await getShareById(shareId);

  if (!share || !share.file) {
    throw new Error("Share or file not found");
  }

  return await getSignedDownloadUrl(share.file.storagePath);
}

/**
 * Step 1: Start OPAQUE login for accessing a share.
 * @param shareId - the share's unique ID
 * @param startLoginRequest - OPAQUE start login request from client
 * @returns loginResponse and share name if successful
 */
export async function createSignInResponseForShare(
  shareId: string,
  startLoginRequest: string
): Promise<{ loginResponse: string; shareName: string } | null> {
  const share = await getShareAuthInfo(shareId);

  if (!share || !share.opaqueRegistrationRecord) {
    return null;
  }

  // Start OPAQUE login using shareId as user identifier
  const { loginResponse, serverLoginState } = await opaqueServer.createSignInResponse(
    shareId,
    share.opaqueRegistrationRecord,
    startLoginRequest
  );

  // Store the server login state as ephemeral (expires in 5 minutes)
  await upsertEphemeral(shareId, serverLoginState);

  return { loginResponse, shareName: share.name };
}

/**
 * Step 2: Finish OPAQUE login for accessing a share.
 * @param shareId - the share's unique ID
 * @param finishLoginRequest - OPAQUE finish login request from client
 * @returns true if verified, false otherwise
 */
export async function finishShareLogin(
  shareId: string,
  finishLoginRequest: string
): Promise<boolean> {
  const ephemeral = await getEphemeral(shareId);

  if (!ephemeral || ephemeral.expiresAt < new Date()) {
    if (ephemeral) {
      await deleteEphemeral(ephemeral.id);
    }
    return false;
  }

  const sessionKey = await opaqueServer.finishSignIn(
    ephemeral.serverLoginState,
    finishLoginRequest
  );

  await deleteEphemeral(ephemeral.id);

  return sessionKey !== null;
}