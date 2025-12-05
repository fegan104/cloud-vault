import Navigation from "@/components/Navigation";

type VaultLayoutProps = {
  children: React.ReactNode;
};

export default function VaultLayout({ children }: VaultLayoutProps) {
  return (
    <div className="h-full flex flex-col sm:flex-row">
      <Navigation />
      {/* Content area - offset for navigation */}
      <main className="flex-1 sm:ml-20 pb-20 sm:pb-0 h-full overflow-hidden">
        {children}
      </main>
    </div>
  );
}
