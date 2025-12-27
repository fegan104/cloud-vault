"use client";

import ShareKeyGuard from "@/components/ShareKeyGuard";
import FileListItem from "@/components/FileListItem";
import { downloadFileWithProgress } from "@/lib/util/downloadFileWithProgress";
import { decryptFile, importKeyFromExportKey } from "@/lib/util/clientCrypto";
import { useState } from "react";
import { startShareLogin, getShareDownloadUrl, finishShareLogin } from "./actions";
import { getShareById, ShareWithFile } from "@/lib/share/getShareById";
import { saveFileToDevice } from "@/lib/util/saveFileToDevice";
import * as opaque from "@serenity-kit/opaque";



export default function ViewShareScreen({ shareId, name }: { shareId: string, name: string }) {

  const [shareKey, setShareKey] = useState<CryptoKey | null>(null);
  const [share, setShare] = useState<ShareWithFile | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the unlock process for a share using OPAQUE authentication.
   * @param password The password used to unlock the share.
   */
  const handleUnlock = async (password: string) => {
    // Step 1: Start OPAQUE login
    const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
      password,
    });

    // Step 2: Server starts login
    const loginStart = await startShareLogin(shareId, startLoginRequest);
    if (!loginStart) {
      throw new Error("Share not found");
    }

    const { loginResponse } = loginStart;

    // Step 3: Client finishes login - get export key
    const loginResult = opaque.client.finishLogin({
      clientLoginState,
      loginResponse,
      password,
      keyStretching: {
        "argon2id-custom": {
          memory: 131072,
          iterations: 4,
          parallelism: 1,
        },
      },
    });

    if (!loginResult) {
      throw new Error("Incorrect password");
    }

    const { finishLoginRequest, exportKey } = loginResult;

    // Step 4: Server verifies
    const verified = await finishShareLogin(shareId, finishLoginRequest);

    if (!verified) {
      throw new Error("Incorrect password");
    }

    // Use export key as share key
    const key = await importKeyFromExportKey(exportKey, 'share');
    setShareKey(key);
    setShare(await getShareById(shareId));
  };

  /**
   * Handles a download request for a share.
   */
  const handleDownload = async () => {
    if (!shareKey || !share) return;
    setDownloadingId(share.file.id);
    setError(null);

    try {
      // 1. Get a signed URL for the file
      const downloadUrl = await getShareDownloadUrl(shareId);

      // 2. Fetch the encrypted file
      const encryptedBlob = await downloadFileWithProgress(downloadUrl, setDownloadProgress);

      // 3. Decrypt the file using the share key
      const decryptedBlob = await decryptFile(encryptedBlob, shareKey, {
        fileIv: share.file.fileIv,
        wrappedFileKey: share.wrappedFileKey,
        keyWrapIv: share.keyWrapIv,
      })

      // 4. Trigger download
      saveFileToDevice(decryptedBlob, share.file.fileName);
    } catch (error) {
      console.error("Download failed:", error);
      setError("Failed to download and decrypt file.");
    } finally {
      setDownloadingId(null);
      setDownloadProgress(0);
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
        downloadProgress={downloadProgress}
        onDownload={handleDownload}
        error={error}
      />
    </ShareKeyGuard>
  )
}

function ShareScreen({
  share,
  isDownloading,
  downloadProgress,
  onDownload,
  error
}: {
  share: ShareWithFile | null;
  isDownloading: boolean;
  downloadProgress: number;
  onDownload: () => void;
  error: string | null;
}) {
  if (!share) return null;

  return (
    <div className="size-full p-4 flex flex-col items-center bg-background">
      <div className="w-full mb-8 text-center">
        <h2 className="font-bold text-on-surface mb-3">
          {share.name}
        </h2>
        <p className="text-on-surface-variant">
          Has been shared with you
        </p>
      </div>

      <ul className="w-full max-w-3xl space-y-3">
        {error && (
          <div className="p-3 bg-error-container mb-4">
            <p className="text-on-error-container">{error}</p>
          </div>
        )}
        <FileListItem
          file={share.file}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          onDownload={onDownload}
        />
      </ul>
    </div>
  );
}