"use client";

import React from "react";
import Link from "next/link";
import {
  Home,
  Users,
  FileText,
  Settings,
  PieChart,
  LogOut,
  DollarSign
} from "lucide-react";

type AppSidebarProps = {
  collapsed?: boolean;
};

export default function AppSidebar({ collapsed = false }: AppSidebarProps) {
  // CSS widths and transitions
  const widthClass = collapsed ? "w-16" : "w-64";
  const labelClass = collapsed ? "hidden" : "inline";

  const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: Home },
    { title: "Client Marketing", href: "/dashboard/jobs", icon: FileText },
    { title: "Paid Client Companies", href: "/dashboard/resumes", icon: PieChart },
    { title: "Companies", href: "/dashboard/finance", icon: DollarSign },
    { title: "Staff", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <aside
      className={`${widthClass} transition-[width] duration-200 ease-in-out border-r bg-surface h-screen flex flex-col flex-none`}
    >

      {/* Links */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={item.title}
                  className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
                >
                  <span className="w-6 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`text-sm ${labelClass}`}>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: small user row */}
      <div className="px-2 py-3 border-t">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gray-300" />
          <div className={`${labelClass} flex-1`}>
            <div className="text-sm font-medium">CarGuys Admin</div>
            <div className="text-xs text-muted-foreground">admin@carguysinc.com</div>
          </div>
          <button className="ml-auto p-2 rounded hover:bg-muted/50" title="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
