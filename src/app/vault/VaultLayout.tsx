import Navigation from "@/components/Navigation";
import { AppBar } from "@/components/AppBar";

type VaultLayoutProps = {
  children: React.ReactNode;
};

export default function VaultLayout({ children }: VaultLayoutProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Full-width app bar at top */}
      <AppBar />
      {/* Below app bar: navigation rail + content */}
      <div className="flex-1 flex flex-row overflow-hidden">
        <Navigation />
        {/* Content area */}
        <main className="flex-1 pb-20 sm:pb-0 h-full overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

