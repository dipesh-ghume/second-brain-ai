"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function Shell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6" style={{ backgroundColor: "var(--bg-secondary)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
