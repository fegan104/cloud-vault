"use client";

import { useMasterKey } from "../../components/MasterKeyContext";
import MasterKeyGuard from "../../components/MasterKeyGuard";
import { decryptFile, deriveShareKey, wrapShareKey, uint8ToBase64 } from "../../lib/clientCrypto";
import { useState } from "react";
import { EncryptedFile } from "@prisma/client";
import { getDownloadUrl, uploadAction, deleteFile, renameFile } from "./actions";
import { FileText } from "lucide-react";
import { UploadButton } from "./UploadButton";
import { TonalButton } from "@/components/Buttons";
import { DeleteConfirmationModal, TextInputModal, CreateShareModal } from "@/components/Modals";
import Scaffold from "../../components/Scaffold";
import { createShare } from "../../lib/share";
import FileListItem from "@/components/FileListItem";

type VaultScreenProps = {
  masterKeySalt: string;
  files: EncryptedFile[];
};

export default function VaultScreen({ masterKeySalt, files }: VaultScreenProps) {
  const { masterKey } = useMasterKey();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<EncryptedFile | null>(null);
  const [fileToRename, setFileToRename] = useState<EncryptedFile | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fileToShare, setFileToShare] = useState<EncryptedFile | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);

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

  const handleDelete = async (file: EncryptedFile) => {
    setFileToDelete(file);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    setDeletingId(fileToDelete.id);
    setFileToDelete(null);

    try {
      await deleteFile(fileToDelete.id);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete file.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRename = (file: EncryptedFile) => {
    setFileToRename(file);
  };

  const confirmRename = async (newBaseName: string) => {
    if (!fileToRename || !newBaseName.trim()) return;

    // Extract the original extension and preserve it
    const lastDotIndex = fileToRename.fileName.lastIndexOf('.');
    const extension = lastDotIndex > 0 ? fileToRename.fileName.substring(lastDotIndex) : '';
    const newFileName = newBaseName.trim() + extension;

    setRenamingId(fileToRename.id);
    setFileToRename(null);

    try {
      await renameFile(fileToRename.id, newFileName);
    } catch (error) {
      console.error("Rename failed:", error);
      alert("Failed to rename file.");
    } finally {
      setRenamingId(null);
    }
  };

  const handleShare = (file: EncryptedFile) => {
    setFileToShare(file);
  };

  const confirmShare = async (shareName: string, password: string) => {
    if (!fileToShare || !masterKey) return;

    setIsCreatingShare(true);

    try {
      // 1. Generate a random salt for the share key derivation
      const shareSaltBytes = crypto.getRandomValues(new Uint8Array(16));
      const shareSaltB64 = uint8ToBase64(shareSaltBytes);

      // 2. Derive the share key from the password
      const { shareKey, publicKey, metadata } = await deriveShareKey(password, shareSaltBytes);

      // 3. Wrap the file key with the share key
      const wrappedShareKey = await wrapShareKey(
        fileToShare.wrappedFileKey,
        fileToShare.keyWrapIv,
        masterKey,
        shareKey
      );

      // 4. Create the share record in the database
      const share = await createShare(
        shareName,
        fileToShare.id,
        wrappedShareKey.wrappedFileKey,
        wrappedShareKey.keyWrapIv,
        shareSaltB64,
        publicKey,
        metadata
      );

      return share.id;
    } catch (error) {
      console.error("Share creation failed:", error);
    } finally {
      setIsCreatingShare(false);
    }
  };

  return (
    <Scaffold searchQuery={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Search files by name...">
      <div className="overflow-hidden flex flex-col h-full">
        <DeleteConfirmationModal
          isOpen={fileToDelete !== null}
          fileName={fileToDelete?.fileName || ""}
          onConfirm={confirmDelete}
          onCancel={() => setFileToDelete(null)}
        />
        <TextInputModal
          isOpen={fileToRename !== null}
          title="Rename File"
          description="Enter a new name for this file:"
          placeholder={
            fileToRename
              ? (() => {
                const lastDotIndex = fileToRename.fileName.lastIndexOf('.');
                return lastDotIndex > 0
                  ? fileToRename.fileName.substring(0, lastDotIndex)
                  : fileToRename.fileName;
              })()
              : ""
          }
          confirmLabel="Rename"
          onConfirm={confirmRename}
          onCancel={() => setFileToRename(null)}
        />
        <CreateShareModal
          isOpen={fileToShare !== null}
          fileName={fileToShare?.fileName || ""}
          onConfirm={confirmShare}
          onCancel={() => setFileToShare(null)}
          isLoading={isCreatingShare}
        />
        <MasterKeyGuard masterKeySalt={masterKeySalt}>
          <div className="flex-1 overflow-y-auto md:ring-1 ring-on-surface rounded-2xl md:m-4" style={{ "scrollbarWidth": "none" }}>
            <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center">
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

              {(() => {
                const filteredFiles = files.filter(file =>
                  file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return filteredFiles.length === 0 ? (
                  <div className="w-full max-w-3xl mt-12 text-center">
                    <div className="bg-surface rounded-[var(--radius-xl)] p-12 shadow-[--shadow-2]">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-variant mb-4">
                        <FileText className="w-8 h-8 text-on-surface-variant" />
                      </div>
                      <p className="text-[--font-body-lg] text-on-surface-variant">
                        {searchQuery.trim()
                          ? `No files found matching "${searchQuery}".`
                          : "No files uploaded yet. Upload your first file to get started."
                        }
                      </p>
                      {searchQuery.trim() && (
                        <div className="mt-6">
                          <TonalButton onClick={() => setSearchQuery("")}>
                            Clear Search
                          </TonalButton>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <ul className="w-full max-w-3xl space-y-3">
                    {filteredFiles.map((file) => (
                      <FileListItem
                        key={file.id}
                        file={file}
                        isDownloading={downloadingId === file.id}
                        isDeleting={deletingId === file.id}
                        isRenaming={renamingId === file.id}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                        onRename={handleRename}
                        onShare={handleShare}
                      />
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        </MasterKeyGuard>
      </div>
    </Scaffold>
  );
}