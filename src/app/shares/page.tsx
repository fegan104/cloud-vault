"use client";
import { useState } from "react";
import VaultLayout from "../vault/VaultLayout";

export default function SharesScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <VaultLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search shares by name..."
    >
      <div className="p-6">
        <h1 className="text-[--font-headline-lg] font-bold text-on-surface">Shares</h1>
        <p className="text-[--font-body-md] text-on-surface-variant mt-2">
          Shared files will appear here.
        </p>
      </div>
    </VaultLayout>
  );
}