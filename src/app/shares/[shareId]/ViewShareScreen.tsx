"use client";

import ShareKeyGuard from "@/components/ShareKeyGuard";
import FileListItem from "@/components/FileListItem";
import { base64ToUint8Array, decryptFile, deriveShareKey, signShareChallenge } from "@/lib/clientCrypto";
import { useState } from "react";
import { generateChallengeForShare, getShareDownloadUrl, verifyChallengeForShare } from "./actions";
import { getShareById, ShareWithFile } from "@/lib/share";

export default function ViewShareScreen({ shareId, name }: { shareId: string, name: string }) {

  const [shareKey, setShareKey] = useState<CryptoKey | null>(null);
  const [share, setShare] = useState<ShareWithFile | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  /**
   * Handles the unlock process for a share.
   * @param password The password used to unlock the share.
   */
  const handleUnlock = async (password: string) => {
    const { challenge, shareKeyDerivationParams } = await generateChallengeForShare(shareId);
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

  /**
   * Handles a download request for a share.
   */
  const handleDownload = async () => {
    if (!shareKey || !share) return;
    setDownloadingId(share.file.id);

    try {
      // 1. Get a signed URL for the file
      const downloadUrl = await getShareDownloadUrl(shareId);

      // 2. Fetch the encrypted file
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Failed to fetch file");
      const encryptedBlob = await response.blob();

      // 3. Decrypt the file using the share key
      const decryptedBlob = await decryptFile(encryptedBlob, shareKey, {
        fileIv: share.file.fileIv,
        wrappedFileKey: share.wrappedFileKey,
        keyWrapIv: share.keyWrapIv,
      })

      // 4. Trigger download
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = share.file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download and decrypt file.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <ShareKeyGuard
      share={share}
      name={name}
      onUnlock={handleUnlock}>
      <ShareScreen
        share={share}
        isDownloading={downloadingId === share?.file.id}
        onDownload={handleDownload}
      />
    </ShareKeyGuard>
  )
}

function ShareScreen({
  share,
  isDownloading,
  onDownload
}: {
  share: ShareWithFile | null;
  isDownloading: boolean;
  onDownload: () => void;
}) {
  if (!share) return null;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center">
      <div className="w-full mb-8 text-center">
        <h2 className="text-[--font-headline-lg] font-bold text-on-surface mb-3">
          {share.name}
        </h2>
        <p className="text-[--font-body-md] text-on-surface-variant">
          Shared with you
        </p>
      </div>

      <ul className="w-full max-w-3xl space-y-3">
        <FileListItem
          file={share.file}
          isDownloading={isDownloading}
          onDownload={onDownload}
        />
      </ul>
    </div>
  );
}