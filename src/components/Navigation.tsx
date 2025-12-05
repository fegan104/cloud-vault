"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderLock, Users } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: "/vault", label: "Vault", icon: <FolderLock className="w-6 h-6" /> },
  { href: "/shares", label: "Shares", icon: <Users className="w-6 h-6" /> },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 
          h-20 bg-surface shadow-[0_-2px_10px_rgba(0,0,0,0.1)]
          flex items-center justify-around"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-14 gap-1 py-3"
            >
              <div
                className={`flex items-center justify-center w-16 h-8 rounded-full transition-colors duration-200
                  ${isActive ? "bg-secondary-container" : ""}`}
              >
                <span className={isActive ? "text-on-secondary-container" : "text-on-surface-variant"}>
                  {item.icon}
                </span>
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-200
                  ${isActive ? "text-on-surface" : "text-on-surface-variant"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Navigation Rail */}
      <nav
        className="hidden sm:flex flex-shrink-0
          w-20 h-full bg-background
          flex-col items-center pt-6 gap-3"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-14 h-14 gap-1"
            >
              <div
                className={`flex items-center justify-center w-14 h-8 rounded-full transition-colors duration-200
                  ${isActive ? "bg-secondary-container" : ""}`}
              >
                <span className={isActive ? "text-on-secondary-container" : "text-on-surface-variant"}>
                  {item.icon}
                </span>
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-200
                  ${isActive ? "text-on-surface" : "text-on-surface-variant"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
