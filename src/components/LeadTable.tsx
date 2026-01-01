'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: 'New' | 'Working' | 'Hot';
  lastContact: string;
};

type LeadTableProps = {
  leads: Lead[];
};

const STATUS_TABS = ['All', 'New', 'Working', 'Hot'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export default function LeadTable({ leads }: LeadTableProps) {
  const [activeStatus, setActiveStatus] = useState<StatusTab>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Filter leads by status first
  const filteredByStatus = activeStatus === 'All'
    ? leads
    : leads.filter((lead) => lead.status === activeStatus);

  // 2. Calculate Pagination
  const totalPages = Math.ceil(filteredByStatus.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredByStatus.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 if status changes
  const handleStatusChange = (status: StatusTab) => {
    setActiveStatus(status);
    setCurrentPage(1);
  };

  return (
    <section className="rounded-2xl border p-4 bg-[var(--color-card)] text-[var(--color-foreground)] border-[var(--color-border)] shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-bold">Applicant Database</h2>
          <p className="text-xs text-slate-500">Managing {filteredByStatus.length} total leads</p>
        </div>
        
        {/* Status tabs */}
        <div className="flex gap-1 bg-[var(--color-background)] p-1 rounded-lg border border-[var(--color-border)]">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                status === activeStatus
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-[var(--color-border)]">
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Contact</th>
              <th className="pb-3 pr-4">Source</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Last Contact</th>
              <th className="pb-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {paginatedLeads.map((lead) => (
              <tr key={lead.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="py-4 pr-4 font-bold text-slate-700">{lead.name}</td>
                <td className="py-4 pr-4">
                  <div className="text-slate-600">{lead.email}</div>
                  <div className="text-[10px] text-slate-400">{lead.phone}</div>
                </td>
                <td className="py-4 pr-4">
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{lead.source}</span>
                </td>
                <td className="py-4 pr-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                    lead.status === 'New' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                    lead.status === 'Hot' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td className="py-4 pr-4 text-slate-500">{lead.lastContact}</td>
                <td className="py-4 text-right">
                  <Link 
                    href={`/dashboard/leads/${lead.id}`}
                    className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION CONTROLS --- */}
      <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredByStatus.length)}</span> of {filteredByStatus.length}
        </p>
        
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-2 rounded-lg border border-[var(--color-border)] disabled:opacity-30 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  currentPage === i + 1 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 rounded-lg border border-[var(--color-border)] disabled:opacity-30 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}