"use client";
import { FileText, LogOut } from "lucide-react";
import { TonalButton } from "./Buttons";
import { signOut } from "../app/vault/actions";

/**
 * Shared app bar for vault and shares screens.
 * Displays logo, title, and sign out button.
 */
export function AppBar() {
  return (
    <div className="sticky top-0 z-50 bg-background shadow-[--shadow-1]">
      <div className="w-full px-5 py-4">
        <div className="flex items-center justify-between">
          {/* Left section: Logo and title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-[--font-title-lg] font-semibold text-on-surface">Cloud Vault</h1>
          </div>

          {/* Right section: Sign out button */}
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
    </div>
  );
}
