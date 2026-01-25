"use client";

import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
import { Verified } from "lucide-react";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 z-10 bg-background/80 backdrop-blur-sm">
          <Breadcrumbs />
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3">
              <div className="text-[10px] font-mono text-muted-foreground">
                PROGRESS 64%
              </div>
              <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: "64%" }} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-4 py-2 rounded shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                <Verified className="w-4 h-4" />
                Review Package
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-muted/30">
          {children}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </main>
    </div>
  );
}
