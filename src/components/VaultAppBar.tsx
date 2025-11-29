import { FileText, LogOut } from "lucide-react";
import { TonalButton } from "./Buttons";
import { signOut } from "../app/vault/actions";

export function VaultAppBar() {
  return (
    <div className="sticky top-0 z-50">
      <div className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
            <FileText className="w-5 h-5 text-on-primary-container" />
          </div>
          <h1 className="text-[--font-title-lg] font-semibold text-on-surface">Encrypted Vault</h1>
        </div>
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
  );
}
