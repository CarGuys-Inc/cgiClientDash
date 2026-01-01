import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="w-64 p-6 flex flex-col gap-6 bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)] border-r border-[var(--color-sidebar-border)]">
      <div className="mb-2">
        <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
          RE FollowUp
        </div>
        <div className="text-lg font-semibold mt-1">Client Dashboard</div>
      </div>

      <nav className="space-y-1 text-sm">
        <Link href="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-[var(--color-popover)]/60">
          Dashboard
        </Link>
        <Link href="/dashboard/leads" className="block px-3 py-2 rounded-lg bg-[var(--color-sidebar-primary)] text-[var(--color-sidebar-primary-foreground)] font-medium">
          Jobs Pipeline
        </Link>
        <Link href="/dashboard/sequences" className="block px-3 py-2 rounded-lg hover:bg-[var(--color-popover)]/60">
          Sequences
        </Link>
        
        <Link href="/dashboard/allleads" className="block px-3 py-2 rounded-lg hover:bg-[var(--color-popover)]/60">
          All Leads
        </Link>
        

        <Link href="/dashboard/searchcandidates" className="block px-3 py-2 rounded-lg hover:bg-[var(--color-popover)]/60">
          Search Candidates
        </Link>

        {/*<Link href="/dashboard/messagecenter" className="block px-3 py-2 rounded-lg hover:bg-[var(--color-popover)]/60">
          Inbox
        </Link>
        */}

        <Link href="/dashboard/marketdatahub" className="block px-3 py-2 rounded-lg hover:bg-[var(--color-popover)]/60">
          Market Data Hub
        </Link>
        {/*<Link href="/dashboard/campaigns" className="block px-3 py-2 rounded-lg hover:bg-[var(--color-popover)]/60">
          Campaigns
        </Link>
        */}
        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--color-popover)]/60">Settings</button>
      </nav>

      <div className="mt-auto pt-6 border-t border-[var(--color-sidebar-border)] text-xs text-[var(--color-sidebar-foreground)]">
        <div className="text-[var(--color-sidebar-foreground)]/80">Logged in as</div>
        <div className="font-medium text-[var(--color-sidebar-foreground)] mt-1">demo@agent.com</div>
      </div>
    </aside>
  );
}