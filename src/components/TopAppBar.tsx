"use client";
import { FileText, Search, X } from "lucide-react";
import { TextInput } from "./TextInput";
import { useState } from "react";
import Link from "next/link";

type TopAppBarProps = {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  /** Custom placeholder for search input */
  searchPlaceholder?: string;
  /** Content to be displayed at the end of the app bar */
  endContent?: React.ReactNode;
};

export function TopAppBar({ searchQuery = "", onSearchChange, searchPlaceholder, endContent }: TopAppBarProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const showSearch = onSearchChange !== undefined;

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded && onSearchChange) {
      // Clear search when closing
      onSearchChange("");
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-background shadow-[--shadow-1]">
      <div className="w-full mx-auto px-5 py-4">
        {/* Desktop layout - always visible */}
        <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Left section: Logo and title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <Link href="/">
              <h1 className="font-semibold text-on-surface">Cloud Vault</h1>
            </Link>
          </div>

          {/* Center section: Search bar (only if search is enabled) */}
          <div className="w-full min-w-96 max-w-2xl">
            {showSearch && (

              <TextInput
                value={searchQuery}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
                className="w-full"
              />
            )}
          </div>

          {/* Right section: end action button */}
          <div className="flex justify-end">
            {endContent}
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden flex items-center gap-3 min-h-10">
          {!isSearchExpanded ? (
            <>
              {/* Default mobile view */}
              <div className="flex items-center gap-3 flex-1">
                <Link href="/">
                  <h1 className="text-[--font-title-lg] font-semibold">Cloud Vault</h1>
                </Link>
              </div>

              {showSearch && (
                <button
                  onClick={handleSearchToggle}
                  className="p-2 rounded-lg hover:bg-surface-variant transition-colors"
                  aria-label="Open search"
                >
                  <Search className="w-5 h-5 text-on-surface" />
                </button>
              )}

              {endContent}
            </>
          ) : (
            <>
              {/* Expanded search view */}
              <div className="flex-1">
                <TextInput
                  value={searchQuery}
                  onChange={onSearchChange!}
                  placeholder={searchPlaceholder}
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
    </div >
  );
}
