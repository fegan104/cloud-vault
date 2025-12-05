"use client";
import { FileText, LogOut, Search, X } from "lucide-react";
import { TonalButton } from "./Buttons";
import { signOut } from "../app/vault/actions";
import { TextInput } from "./TextInput";
import { useState } from "react";

type VaultAppBarProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export function VaultAppBar({ searchQuery, onSearchChange }: VaultAppBarProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      // Clear search when closing
      onSearchChange("");
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-background shadow-[--shadow-1]">
      <div className="w-full max-w-6xl mx-auto px-4 py-4">
        {/* Desktop layout - always visible */}
        <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Left section: Logo and title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-[--font-title-lg] font-semibold text-on-surface">Cloud Vault</h1>
          </div>

          {/* Center section: Search bar */}
          <div className="w-full min-w-96 max-w-2xl">
            <TextInput
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search files by name..."
              className="w-full"
            />
          </div>

          {/* Right section: Sign out button */}
          <div className="flex justify-end">
            <form action={signOut}>
              <TonalButton
                type="submit"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </TonalButton>
            </form>
          </div>
        </div>

        {/* Mobile layout - conditional rendering */}
        <div className="md:hidden flex items-center gap-3">
          {!isSearchExpanded ? (
            <>
              {/* Default mobile view */}
              <div className="flex items-center gap-3 flex-1">
                <h1 className="text-[--font-title-lg] font-semibold text-on-surface">Cloud Vault</h1>
              </div>

              <button
                onClick={handleSearchToggle}
                className="p-2 rounded-lg hover:bg-surface-variant transition-colors"
                aria-label="Open search"
              >
                <Search className="w-5 h-5 text-on-surface" />
              </button>

              <form action={signOut}>
                <TonalButton
                  type="submit"
                  className="flex items-center gap-2"
                >
                  <span>Sign Out</span>
                </TonalButton>
              </form>
            </>
          ) : (
            <>
              {/* Expanded search view */}
              <div className="flex-1">
                <TextInput
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder="Search files..."
                  className="w-full"
                />
              </div>

              {/* Close search button */}
              <button
                onClick={handleSearchToggle}
                className="p-2 rounded-lg hover:bg-surface-variant transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5 text-on-surface" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
