"use client";

import { useMasterKey } from "../../components/MasterKeyContext";
import MasterKeyGuard from "../../components/MasterKeyGuard";
import { decryptFile } from "../../lib/clientCrypto";
import { useState } from "react";
import { EncryptedFile } from "@prisma/client";
import { getDownloadUrl, signOut, uploadAction } from "./actions";
import { FileText, Download, LogOut } from "lucide-react";
import CircularProgress from "@/components/CircularProgress";
import { UploadButton } from "./UploadButton";

type VaultScreenProps = {
  masterKeySalt: string;
  files: EncryptedFile[];
};

function AppBar() {
  return (
    <div className="bg-surface-variant shadow-[--shadow-2] sticky top-0 z-50">
      <div className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
            <FileText className="w-5 h-5 text-on-primary-container" />
          </div>
          <h1 className="text-[--font-title-lg] font-semibold text-on-surface">Encrypted Vault</h1>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-[--font-label-lg] font-medium 
                     bg-secondary-container text-on-secondary-container rounded-full
                     hover:shadow-[--shadow-2] hover:brightness-95
                     transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VaultScreen({ masterKeySalt, files }: VaultScreenProps) {
  const { masterKey } = useMasterKey();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (file: EncryptedFile) => {
    if (!masterKey) return;
    setDownloadingId(file.id);

    try {
      // 1. Get a signed URL for the file
      const downloadUrl = await getDownloadUrl(file.id);

      // 2. Fetch the encrypted file
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Failed to fetch file");
      const encryptedBlob = await response.blob();

      // 3. Decrypt the file
      const decryptedBlob = await decryptFile(encryptedBlob, masterKey, {
        fileIv: file.fileIv,
        wrappedFileKey: file.wrappedFileKey,
        keyWrapIv: file.keyWrapIv,
      });

      // 4. Trigger download
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
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
    <>
      <AppBar />
      <MasterKeyGuard masterKeySalt={masterKeySalt}>
        <div className="min-h-[calc(100vh-72px)]" style={{ background: 'var(--color-background)' }}>
          <div className="w-full max-w-5xl mx-auto p-8 flex flex-col items-center">
            <div className="w-full mb-8 text-center">
              <h2 className="text-[--font-headline-lg] font-bold text-on-surface mb-3">
                Your Encrypted Files
              </h2>
              <p className="text-[--font-body-md] text-on-surface-variant">
                All files are encrypted with your master key
              </p>
            </div>

            <div className="w-full max-w-3xl mb-6">
              <UploadButton masterKeySalt={masterKeySalt} onEncrypted={uploadAction} />
            </div>

            {files.length === 0 ? (
              <div className="w-full max-w-3xl mt-12 text-center">
                <div className="bg-surface rounded-[--radius-xl] p-12 shadow-[--shadow-2]">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-variant mb-4">
                    <FileText className="w-8 h-8 text-on-surface-variant" />
                  </div>
                  <p className="text-[--font-body-lg] text-on-surface-variant">
                    No files uploaded yet. Upload your first file to get started.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="w-full max-w-3xl space-y-3">
                {files.map((file) => (
                  <FileListItem key={file.id} file={file} downloadingId={downloadingId} onDownload={handleDownload} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </MasterKeyGuard>
    </>
  );
}


function FileListItem({ file, downloadingId, onDownload }: {
  file: EncryptedFile;
  downloadingId: string | null;
  onDownload: (file: EncryptedFile) => void
}) {
  const isDownloading = downloadingId === file.id;

  return (
    <li
      className="bg-surface p-5 rounded-[--radius-lg] shadow-[--shadow-2] 
               flex items-center justify-between 
               hover:shadow-[--shadow-3] transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div className="bg-tertiary-container p-3 rounded-[--radius-md]">
          <FileText className="w-6 h-6 text-on-tertiary-container" />
        </div>
        <div>
          <p className="font-semibold text-[--font-body-lg] text-on-surface mb-1">
            {file.fileName}
          </p>
          <p className="text-[--font-body-sm] text-on-surface-variant">
            {(file.fileSize / 1024).toFixed(2)} KB • {new Date(file.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <button
        onClick={() => onDownload(file)}
        disabled={isDownloading}
        className={`px-5 py-2.5 rounded-full text-[--font-label-md] font-medium 
                   flex items-center gap-2 transition-all duration-200
                   ${isDownloading
            ? 'bg-surface-variant text-on-surface-variant cursor-wait'
            : 'bg-tertiary text-on-tertiary shadow-[--shadow-2] hover:shadow-[--shadow-3] hover:brightness-110'
          }`}
      >
        {isDownloading ? (
          <>
            <CircularProgress size={18} />
            <span>Decrypting...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Download</span>
          </>
        )}
      </button>
    </li>
  )
}