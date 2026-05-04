"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/bookmarks": "Bookmarks",
  "/notes": "Notes",
  "/search": "Knowledge Search",
  "/insights": "Insights",
};

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();

  const title = Object.entries(pageTitles).find(([path]) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path)
  )?.[1] ?? "Second Brain AI";

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 border-b backdrop-blur-sm"
      style={{
        backgroundColor: "color-mix(in srgb, var(--bg-primary) 80%, transparent)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-lg transition-colors lg:hidden"
          style={{ color: "var(--text-secondary)" }}
          onClick={onMenuToggle}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <h2 className="text-lg lg:text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
          title="Toggle theme"
          onClick={() => document.documentElement.classList.toggle("dark")}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
