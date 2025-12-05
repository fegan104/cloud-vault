"use client";

import { useMasterKey } from "../../components/MasterKeyContext";
import MasterKeyGuard from "../../components/MasterKeyGuard";
import { decryptFile } from "../../lib/clientCrypto";
import { useState } from "react";
import { EncryptedFile } from "@prisma/client";
import { getDownloadUrl, uploadAction, deleteFile, renameFile } from "./actions";
import { FileText, Trash2, FilePenLine, MoreVertical } from "lucide-react";
import CircularProgress from "@/components/CircularProgress";
import { UploadButton } from "./UploadButton";
import { TextButton, TonalButton } from "@/components/Buttons";
import { DeleteConfirmationModal, TextInputModal } from "@/components/Modals";
import VaultLayout from "./VaultLayout";

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

  return (
    <VaultLayout searchQuery={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Search files by name...">
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
        <MasterKeyGuard masterKeySalt={masterKeySalt}>
          <div className="overflow-y-auto ring-1 ring-on-surface ring-1 rounded-2xl m-4" style={{ "scrollbarWidth": "none" }}>
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
                        downloadingId={downloadingId}
                        deletingId={deletingId}
                        renamingId={renamingId}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                        onRename={handleRename}
                      />
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        </MasterKeyGuard>
      </div>
    </VaultLayout>
  );
}


function formatFileSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(2)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

function FileListItem({ file, downloadingId, deletingId, renamingId, onDownload, onDelete, onRename }: {
  file: EncryptedFile;
  downloadingId: string | null;
  deletingId: string | null;
  renamingId: string | null;
  onDownload: (file: EncryptedFile) => void;
  onDelete: (file: EncryptedFile) => void;
  onRename: (file: EncryptedFile) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDownloading = downloadingId === file.id;
  const isDeleting = deletingId === file.id;
  const isRenaming = renamingId === file.id;
  const isBusy = isDownloading || isDeleting || isRenaming;

  return (
    <li
      className="bg-surface-variant p-5 rounded-[8px] shadow-[--shadow-2] 
               flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4
               hover:shadow-[--shadow-3] transition-all duration-200"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="p-3 flex-shrink-0">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[--font-body-lg] text-on-surface mb-1 break-words">
            {file.fileName}
          </p>
          <p className="text-[--font-body-sm] text-on-surface-variant">
            {formatFileSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
        <TextButton
          onClick={() => onDownload(file)}
          disabled={isBusy}
          className={`flex-1 sm:flex-initial ring-1 ring-primary 
            ${isBusy ? 'opacity-50 cursor-wait' : ''}`}
        >
          {isDownloading ? (
            <>
              <CircularProgress size={18} />
              <span>Decrypting...</span>
            </>
          ) : (
            <>
              <span>Download</span>
            </>
          )}
        </TextButton>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            disabled={isBusy}
            className={`p-2 rounded-lg transition-all duration-200
              text-on-secondary-container hover:bg-secondary-container/70 
              ${isBusy ? 'opacity-50 cursor-wait' : ''}`}
            aria-label="More actions"
          >
            {(isBusy) ? (
              <CircularProgress size={20} />
            ) : (
              <MoreVertical className="w-5 h-5 text-on-surface" />
            )}
          </button>
          {isMenuOpen && !isBusy && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-[--shadow-4] z-20 overflow-hidden">
                {/* Rename button */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRename(file);
                  }}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface-variant transition-colors"
                >
                  <FilePenLine className="w-5 h-5 text-on-surface" />
                  <span className="text-[--font-body-md] text-on-surface">Rename</span>
                </button>
                {/* Delete button */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete(file);
                  }}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-error/10 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-error" />
                  <span className="text-[--font-body-md] text-error">Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </li>
  );
}