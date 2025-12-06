"use client";

import ShareKeyGuard, { ShareKeyDerivationParams } from "@/components/ShareKeyGuard";
import { verifyChallengeForShare } from "@/lib/challenge";
import { base64ToUint8Array, deriveShareKey, signChallenge, signShareChallenge } from "@/lib/clientCrypto";
import { prisma } from "@/lib/db";
import { Share } from "@prisma/client";
import { useState } from "react";
import { getShareById, ShareWithFile } from "./actions";

export default function ViewShareScreen({
  shareId,
  challenge,
  shareKeyDerivationParams,
}: {
  shareId: string;
  challenge: string;
  shareKeyDerivationParams: ShareKeyDerivationParams;
}) {

  const [shareKey, setShareKey] = useState<CryptoKey | null>(null);
  const [share, setShare] = useState<ShareWithFile | null>(null);

  const handleUnlock = async (password: string) => {
    const encodedSalt = base64ToUint8Array(shareKeyDerivationParams.keyDerivationSalt);
    const { shareKey, privateKey } = await deriveShareKey(password, encodedSalt);
    setShareKey(shareKey);
    const encodedPrivateKey = base64ToUint8Array(privateKey);
    const signedChallenge = await signShareChallenge(encodedPrivateKey, challenge);
    const verified = await verifyChallengeForShare(shareId, challenge, signedChallenge);
    if (!verified) {
      throw new Error("Challenge verification failed");
    }
    setShare(await getShareById(shareId));
  };

  return (
    <ShareKeyGuard
      share={share}
      shareKeyDerivationParams={shareKeyDerivationParams}
      onUnlock={handleUnlock}>
      <ShareScreen share={share} />
    </ShareKeyGuard>
  )
}

function ShareScreen({ share }: { share: ShareWithFile | null }) {
  return <div>Share Screen {share?.name} {share?.file.fileName}</div>;
}