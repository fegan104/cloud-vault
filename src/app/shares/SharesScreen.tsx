"use client";

import { useState } from "react";
import Scaffold from "../../components/Scaffold";
import { Share } from "@prisma/client";
import { Users, FileText, Link as LinkIcon, Check, Trash2, MoreVertical, Loader2 } from "lucide-react";
import CircularProgress from "@/components/CircularProgress";
import { TonalButton } from "@/components/Buttons";
import { DeleteConfirmationModal } from "@/components/Modals";
import { deleteShare } from "./actions";
import { formatFileSize } from "@/components/FileListItem";

type ShareWithFile = Share & {
  file: {
    fileName: string;
    fileSize: number;
  };
};

type SharesScreenProps = {
  shares: ShareWithFile[];
  isLoading?: boolean;
};

export default function SharesScreen({ shares, isLoading = false }: SharesScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [shareToDelete, setShareToDelete] = useState<ShareWithFile | null>(null);

  const confirmDelete = async () => {
    if (!shareToDelete) return;

    try {
      await deleteShare(shareToDelete.id);
    } catch (error) {
      console.error("Failed to delete share:", error);
      alert("Failed to delete share");
    } finally {
      setShareToDelete(null);
    }
  };

  const filteredShares = shares.filter(
    (share) =>
      share.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      share.file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Scaffold
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search shares by name..."
    >
      <DeleteConfirmationModal
        isOpen={shareToDelete !== null}
        fileName={shareToDelete?.name || ""}
        title="Delete Share?"
        onConfirm={confirmDelete}
        onCancel={() => setShareToDelete(null)}
      />
      <div className="overflow-hidden flex flex-col h-full">
        <div className="flex-1 overflow-y-auto md:ring-1 ring-on-surface rounded-2xl md:m-4" style={{ scrollbarWidth: "none" }}>
          <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center">
            <div className="w-full mb-8 text-center">
              <h2 className="font-bold text-on-surface mb-3">
                Your Shared Files
              </h2>
              <p className="text-on-surface-variant">
                Manage your file shares
              </p>
            </div>

            {isLoading ? (
              <div className="w-full max-w-3xl mt-12 text-center">
                <div className="flex flex-col items-center gap-4 py-12">
                  <CircularProgress size={48} />
                  <p className="text-on-surface-variant text-lg animate-pulse">Loading Shares...</p>
                </div>
              </div>
            ) : filteredShares.length === 0 ? (
              <div className="w-full max-w-3xl mt-12 text-center">
                <div className="bg-surface p-12 shadow-[--shadow-2]">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-variant mb-4">
                    <Users className="w-8 h-8 text-on-surface-variant" />
                  </div>
                  <p className="text-on-surface-variant">
                    {searchQuery.trim()
                      ? `No shares found matching "${searchQuery}".`
                      : "No shares created yet. Share a file to get started."}
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
                {filteredShares.map((share) => (
                  <ShareListItem
                    key={share.id}
                    share={share}
                    onDelete={() => setShareToDelete(share)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Scaffold>
  );
}

function ShareListItem({ share, onDelete }: { share: ShareWithFile; onDelete: () => void }) {
  const [isCopied, setIsCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/shares/${share.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      setIsMenuOpen(false);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete();
  };

  return (
    <li
      className="bg-surface-variant p-5 rounded-sm shadow-[--shadow-2] 
               flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4
               hover:shadow-[--shadow-3] transition-all duration-200"
    >
      <div className="flex items-center gap-4 w-full">
        <div className="p-3 flex-shrink-0">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[--font-body-lg] text-on-surface mb-1 break-words">
            {share.name}
          </p>
          <div className="flex items-center gap-2 text-[--font-body-sm] text-on-surface-variant">
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{share.file.fileName}</span>
          </div>
          <p className="text-[--font-body-sm] text-on-surface-variant mt-1">
            {formatFileSize(share.file.fileSize)} •{" "}
            {new Date(share.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="p-3 shrink-0">
          <div className="flex gap-2 justify-end">
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-lg transition-all duration-200
                text-on-secondary-container hover:bg-secondary-container/70"
                aria-label="More actions"
              >
                <MoreVertical className="w-5 h-5 text-on-surface" />
              </button>
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-[--shadow-4] z-20 overflow-hidden">
                    <button
                      onClick={handleCopyLink}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface-variant transition-colors"
                    >
                      {isCopied ? (
                        <Check className="w-5 h-5 text-primary" />
                      ) : (
                        <LinkIcon className="w-5 h-5 text-on-surface" />
                      )}
                      <span className="text-[--font-body-md] text-on-surface">
                        {isCopied ? "Copied!" : "Copy Link"}
                      </span>
                    </button>
                    <button
                      onClick={handleDelete}
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
        </div>
      </div>
    </li>
  );
}
