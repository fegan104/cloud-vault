'use client'
import { VaultAppBar } from "@/components/VaultAppBar";
import CircularProgress from "@/components/CircularProgress";

export default function Loading() {
  return (
    <>
      <VaultAppBar searchQuery="" onSearchChange={() => { }} />
      <div className="min-h-[calc(100vh-72px)] max-h-[calc(100vh-72px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CircularProgress size={48} />
          <p className="text-on-surface-variant text-lg animate-pulse">Loading Vault...</p>
        </div>
      </div>
    </>
  );
}
