"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Search, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type TopbarProps = {
  title: string;
  subtitle?: string;
};

export default function Topbar({ title, subtitle }: TopbarProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored) {
        setIsDark(stored === "dark");
      } else {
        const prefersDark =
          typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDark(
          document.documentElement.classList.contains("dark") || prefersDark
        );
      }
    } catch (e) {
      // ignore
    } finally {
      setMounted(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      if (next) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch (e) {
      // ignore
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Hard redirect to login to clear all local states and trigger middleware
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 border-b flex items-center justify-between px-6 bg-[var(--color-card)] text-[var(--color-foreground)] border-[var(--color-border)] backdrop-blur/10">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-[var(--color-foreground)]/60" size={16} />
          <input
            placeholder="Search leads..."
            className="pl-9 pr-3 py-2 rounded-lg bg-[var(--color-popover)] text-[var(--color-foreground)] border-[var(--color-border)] text-sm w-48 xl:w-64 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          title="Toggle light/dark"
          className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-popover)] transition-colors"
        >
          {!mounted ? (
            <div className="w-5 h-5" />
          ) : isDark ? (
            <Sun className="text-[var(--color-foreground)]" size={18} />
          ) : (
            <Moon className="text-[var(--color-foreground)]" size={18} />
          )}
        </button>

        <div className="h-6 w-[1px] bg-[var(--color-border)] mx-1" />

        {/* Action Buttons */}
        <button className="px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-popover)] transition-colors">
          Add Applicant
        </button>

        {/* Sign Out Button */}
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/30 transition-all"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}