"use client";

import { useState } from "react";
import VaultLayout from "../vault/VaultLayout";
import { Share } from "@prisma/client";
import { Users, FileText } from "lucide-react";
import { TonalButton } from "@/components/Buttons";

type ShareWithFile = Share & {
  file: {
    fileName: string;
    fileSize: number;
  };
};

type SharesScreenProps = {
  shares: ShareWithFile[];
};

export default function SharesScreen({ shares }: SharesScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredShares = shares.filter(
    (share) =>
      share.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      share.file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <VaultLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search shares by name..."
    >
      <div className="overflow-y-auto md:ring-1 ring-on-surface rounded-2xl md:m-4 h-full" style={{ scrollbarWidth: "none" }}>
        <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center">
          <div className="w-full mb-8 text-center">
            <h2 className="text-[--font-headline-lg] font-bold text-on-surface mb-3">
              Your Shared Files
            </h2>
            <p className="text-[--font-body-md] text-on-surface-variant">
              Manage your file shares
            </p>
          </div>

          {filteredShares.length === 0 ? (
            <div className="w-full max-w-3xl mt-12 text-center">
              <div className="bg-surface rounded-[var(--radius-xl)] p-12 shadow-[--shadow-2]">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-variant mb-4">
                  <Users className="w-8 h-8 text-on-surface-variant" />
                </div>
                <p className="text-[--font-body-lg] text-on-surface-variant">
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
                <ShareListItem key={share.id} share={share} />
              ))}
            </ul>
          )}
        </div>
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

function ShareListItem({ share }: { share: ShareWithFile }) {
  return (
    <li
      className="bg-surface-variant p-5 rounded-[8px] shadow-[--shadow-2] 
               flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4
               hover:shadow-[--shadow-3] transition-all duration-200"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="p-3 flex-shrink-0">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[--font-body-lg] text-on-surface mb-1 break-words">
            {share.name}
          </p>
          <div className="flex items-center gap-2 text-[--font-body-sm] text-on-surface-variant">
            <FileText className="w-4 h-4" />
            <span className="truncate">{share.file.fileName}</span>
          </div>
          <p className="text-[--font-body-sm] text-on-surface-variant mt-1">
            {formatFileSize(share.file.fileSize)} •{" "}
            {new Date(share.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </li>
  );
}
