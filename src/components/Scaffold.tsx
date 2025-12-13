import Navigation from "@/components/Navigation";
import { TopAppBar } from "@/components/TopAppBar";
import AccountIcon from "./AccountIcon";

type ScaffoldProps = {
  children: React.ReactNode;
  /** Optional search query for the app bar */
  searchQuery?: string;
  /** Optional search change handler for the app bar */
  onSearchChange?: (query: string) => void;
  /** Optional custom placeholder for search input */
  searchPlaceholder?: string;
};

export default function Scaffold({ children, searchQuery, onSearchChange, searchPlaceholder }: ScaffoldProps) {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Full-width app bar at top */}
      <TopAppBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        endContent={<AccountIcon />}
      />
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
