"use client";

import { useState } from "react";
import { FileText, Trash2, FilePenLine, MoreVertical, Share2 } from "lucide-react";
import CircularProgress from "@/components/CircularProgress";
import { TextButton } from "@/components/Buttons";
import { useIsSupportedBrowser } from "../hooks/useIsSupportedBrowser";

export function formatFileSize(bytes: number): string {
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

export type FileListItemData = {
  id: string;
  fileName: string;
  fileSize: number;
  createdAt: Date;
};

export type FileListItemProps<T extends FileListItemData> = {
  file: T;
  isDownloading?: boolean;
  downloadProgress?: number;
  isDeleting?: boolean;
  isRenaming?: boolean;
  onDownload: (file: T) => void;
  onDelete?: (file: T) => void;
  onRename?: (file: T) => void;
  onShare?: (file: T) => void;
};

export default function FileListItem<T extends FileListItemData>({
  file,
  isDownloading = false,
  downloadProgress = 0,
  isDeleting = false,
  isRenaming = false,
  onDownload,
  onDelete,
  onRename,
  onShare,
}: FileListItemProps<T>) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isBusy = isDownloading || isDeleting || isRenaming;
  const hasMenuItems = onDelete || onRename || onShare;
  const isSupportedBrowser = useIsSupportedBrowser();

  return (
    <li
      className="relative bg-surface-variant p-5 rounded-[8px] shadow-[--shadow-2] 
               flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4
               hover:shadow-[--shadow-3] transition-all duration-200"
    >
      <div className="flex items-center gap-4 min-w-0 pr-10 sm:pr-0">
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
      {isSupportedBrowser ? null : <UnsupportedBrowserMessage />}
      <div className="flex gap-2 w-full sm:w-auto justify-end items-center">
        <TextButton
          onClick={() => onDownload(file)}
          disabled={isBusy || !isSupportedBrowser}
          className={`w-fit sm:flex-initial ring-1 ring-primary 
              ${isBusy ? 'opacity-50 cursor-wait' : ''}`}
        >
          {isDownloading ? (
            <div className="flex items-center gap-2">
              <span>Downloading</span>
              <CircularProgress size={18} progress={downloadProgress} />
            </div>
          ) : (
            <>
              <span>Download</span>
            </>
          )}
        </TextButton>
        {hasMenuItems && (
          <div className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              disabled={isBusy}
              className={`p-2 rounded-lg transition-all duration-200
                text-on-secondary-container hover:bg-secondary-container/70 
                ${isBusy ? 'opacity-50 cursor-wait' : ''}`}
              aria-label="More actions"
            >
              <MoreVertical className="w-5 h-5 text-on-surface" />
            </button>
            {isMenuOpen && !isBusy && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-[--shadow-4] z-20 overflow-hidden">
                  {/* Share button */}
                  {onShare && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onShare(file);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface-variant transition-colors"
                    >
                      <Share2 className="w-5 h-5 text-on-surface" />
                      <span className="text-[--font-body-md] text-on-surface">Share</span>
                    </button>
                  )}
                  {/* Rename button */}
                  {onRename && (
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
                  )}
                  {/* Delete button */}
                  {onDelete && (
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
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function UnsupportedBrowserMessage() {
  return (
    <div className="bg-error-container p-4 rounded-sm">
      <p className="text-on-error-container">For security reasons, downloads are only available in supported browsers. Please open this page in your browser to download the file.</p>
    </div>
  );
}