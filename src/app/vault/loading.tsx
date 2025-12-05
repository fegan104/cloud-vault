"use client";
import VaultLayout from "./VaultLayout";
import CircularProgress from "@/components/CircularProgress";

export default function Loading() {
  return (
    <VaultLayout searchQuery="" onSearchChange={() => { }} searchPlaceholder="Search files by name...">
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CircularProgress size={48} />
          <p className="text-on-surface-variant text-lg animate-pulse">Loading Vault...</p>
        </div>
      </div>
    </VaultLayout>
  );
}
