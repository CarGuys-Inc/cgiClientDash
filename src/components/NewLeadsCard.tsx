"use client";

import React, { useMemo, useState } from "react";
import LeadTable from "./LeadTable";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: "New" | "Working" | "Hot";
  lastContact: string;
};

export default function NewLeadsCard({ leads }: { leads: Lead[] }) {
  const [open, setOpen] = useState(false);

  const newLeads = useMemo(() => leads.filter((l) => l.status === "New"), [leads]);

  return (
    <div>
      <div
        className="rounded-2xl border p-4 cursor-pointer card-smooth border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)]"
        onClick={() => setOpen((s) => !s)}
      >
        <div className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">New Leads (24h)</div>
        <div className="mt-2 text-3xl font-bold">{newLeads.length}</div>
        <div className="mt-1 text-xs text-emerald-400">+3 vs. yesterday</div>
      </div>

      {open && (
        <div className="mt-4">
          <LeadTable leads={newLeads} />
        </div>
      )}
    </div>
  );
}
