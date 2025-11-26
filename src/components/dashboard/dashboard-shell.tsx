"use client";

import { useState } from "react";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import AppSidebar from "@/components/app-sidebar";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function DashboardShell({ children, user, company, role, navigation }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex bg-background">

      <AppSidebar collapsed={collapsed} />

      <div className="flex-1 flex flex-col">
        <header className="h-16 flex items-center gap-4 px-4 border-b">


          <button
            aria-label={collapsed ? "Open sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed(p => !p)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted/50"
          >
            {/* your menu icon */}
            <span>☰</span>
          </button>

        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>

        <footer className="border-t py-6 text-center text-sm text-muted-foreground">
          Powered by{" "}
          <a href="https://carguysinc.com" target="_blank" rel="noreferrer" className="font-medium">
            CarGuys Inc.
          </a>
        </footer>
      </div>
    </div>
  );
}
