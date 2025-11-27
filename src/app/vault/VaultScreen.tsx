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
    <div className="border-b border-gray-200">
      <div className="w-full max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Encrypted Vault</h1>
        <form action={signOut}>
          <button
            type="submit"
            className="bg-secondary-container flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <LogOut className="w-4 h-4 text-on-secondary-container" />
            <span className="text-on-secondary-container">Sign Out</span>
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
        <div className="w-full max-w-4xl mx-auto p-6 flex flex-col justify-center items-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Encrypted Files</h2>
          <UploadButton masterKeySalt={masterKeySalt} onEncrypted={uploadAction} />
          {files.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No files uploaded yet.</p>
          ) : (
            <ul className="space-y-3">
              {files.map((file) => (
                <FileListItem key={file.id} file={file} downloadingId={downloadingId} onDownload={handleDownload} />
              ))}
            </ul>
          )}
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
  return (
    <li
      key={file.id}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow"
    >
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-100 p-2 rounded-full">
          <FileText className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{file.fileName}</p>
          <p className="text-xs text-gray-500">{(file.fileSize / 1024).toFixed(2)} KB • {new Date(file.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <button
        onClick={() => onDownload(file)}
        disabled={downloadingId === file.id}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2
                    ${downloadingId === file.id
            ? 'bg-gray-100 text-gray-400 cursor-wait'
            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
      >
        {downloadingId === file.id ? (
          <>
            <CircularProgress size={20} />
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