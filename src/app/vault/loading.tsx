"use client";
import Scaffold from "../../components/Scaffold";
import CircularProgress from "@/components/CircularProgress";

export default function Loading() {
  return (
    <Scaffold searchQuery="" onSearchChange={() => { }} searchPlaceholder="Search files by name...">
      <div className="overflow-hidden flex flex-col h-full">
        <div className="flex-1 overflow-y-auto md:ring-1 ring-on-surface rounded-2xl md:m-4" style={{ "scrollbarWidth": "none" }}>
          <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center h-full justify-center">
            <div className="flex flex-col items-center gap-4">
              <CircularProgress size={48} />
              <p className="text-on-surface-variant text-lg animate-pulse">Loading Vault...</p>
            </div>
          </div>
        </div>
      </div>
    </Scaffold>
  );
}
