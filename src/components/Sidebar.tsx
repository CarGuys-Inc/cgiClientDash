'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Menu, 
  LayoutDashboard, 
  ClipboardList, 
  Repeat, 
  Users, 
  UserPlus, 
  Calendar, 
  Search, 
  BarChart3, 
  Settings 
} from 'lucide-react';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const logoUrl = "https://storage.googleapis.com/general_images_airesumescoring_public/carguysinc_images_public/misc_images/cgi-logo-white-transparent.png";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/dashboard/leads", label: "Jobs Pipeline", icon: <ClipboardList size={20} /> },
    /*{ href: "/dashboard/sequences", label: "Sequences", icon: <Repeat size={20} /> },*/
    /*{ href: "/dashboard/all-applicants", label: "All Applicants", icon: <Users size={20} /> },*/
    { href: "/dashboard/add-user", label: "Add User", icon: <UserPlus size={20} /> },
    { href: "/dashboard/calendar", label: "Calendar", icon: <Calendar size={20} /> },
    { href: "/dashboard/searchcandidates", label: "Search Candidates", icon: <Search size={20} /> },
    /*{ href: "/dashboard/marketdatahub", label: "Market Data", icon: <BarChart3 size={20} /> },*/
    { href: "/dashboard/settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside 
      className={`relative flex flex-col transition-all duration-300 ease-in-out bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)] border-r border-[var(--color-sidebar-border)] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-12 bg-emerald-500 text-white rounded-full p-1 border-2 border-[var(--color-sidebar)] hover:bg-emerald-600 transition-colors z-50"
      >
        {isCollapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo Section */}
      <div className={`p-6 mb-2 flex flex-col ${isCollapsed ? 'items-center' : 'items-start'}`}>
        <div className="relative h-10 w-full mb-2">
          {/* Logo Logic: Invert for light mode, normal for dark mode */}
          <img 
            src={logoUrl} 
            alt="Carguys Inc Logo" 
            className={`h-full object-contain transition-all duration-300 dark:invert-0 invert ${
              isCollapsed ? 'mx-auto' : 'object-left'
            }`}
          />
        </div>
        {!isCollapsed && (
          <div className="text-sm font-bold mt-1 tracking-tight opacity-80">Client Dashboard</div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 transition-all group"
            title={isCollapsed ? item.label : ""}
          >
            <span className="shrink-0">{item.icon}</span>
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className={`mt-auto p-6 border-t border-[var(--color-sidebar-border)] ${isCollapsed ? 'flex justify-center' : ''}`}>
        {!isCollapsed ? (
          <div className="text-xs">
            <div className="opacity-60">Logged in as</div>
            <div className="font-bold truncate mt-0.5 text-emerald-500">demo@agent.com</div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">
            DA
          </div>
        )}
      </div>
    </aside>
  );
}