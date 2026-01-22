'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2, Inbox, UserCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { fetchAllCompanyApplicants } from '@/services/jobService';

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source?: string;
  status: 'New' | 'Working' | 'Hot';
  lastContact: string;
};

type LeadTableProps = {
  leads?: Lead[];
};

const STATUS_TABS = ['All', 'New', 'Working', 'Hot'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export default function LeadTable({ leads: initialLeads }: LeadTableProps) {
  const supabase = createClient();
  
  // Initialize state with props if they exist, otherwise empty
  const [leads, setLeads] = useState<Lead[]>(initialLeads || []);
  const [loading, setLoading] = useState(!initialLeads);
  const [activeStatus, setActiveStatus] = useState<StatusTab>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // We use a function expression (const) here to avoid ES5 strict mode issues
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchAllCompanyApplicants(supabase);
        setLeads(data);
      } catch (err) {
        console.error("Failed to load applicants:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!initialLeads) {
      loadData();
    } else {
      setLeads(initialLeads);
      setLoading(false);
    }
  }, [initialLeads, supabase]);

  // 1. Filter leads by status tab
  const filteredByStatus = activeStatus === 'All'
    ? leads
    : leads.filter((lead) => lead.status === activeStatus);

  // 2. Pagination Logic
  const totalPages = Math.ceil(filteredByStatus.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredByStatus.slice(startIndex, startIndex + itemsPerPage);

  const handleStatusChange = (status: StatusTab) => {
    setActiveStatus(status);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
        <p className="text-sm font-bold text-slate-800 tracking-tight">Syncing Applicant Database...</p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border p-6 bg-white text-slate-900 border-slate-200 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <UserCircle className="text-emerald-500 w-5 h-5" /> Applicant Records
          </h2>
          <p className="text-xs text-slate-500 font-medium">Viewing {filteredByStatus.length} total candidates for your company.</p>
        </div>
        
        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                status === activeStatus
                  ? 'bg-white text-emerald-600 shadow-sm border border-slate-200'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100">
              <th className="pb-4 pr-4">Candidate Name</th>
              <th className="pb-4 pr-4">Contact Info</th>
              <th className="pb-4 pr-4">Lead Source</th>
              <th className="pb-4 pr-4">Pipeline Status</th>
              <th className="pb-4 pr-4">Applied On</th>
              <th className="pb-4 text-right">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedLeads.length > 0 ? (
              paginatedLeads.map((lead, index) => (
                <tr key={`${lead.id}-${index}`} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 pr-4 font-extrabold text-slate-800">{lead.name}</td>
                  <td className="py-5 pr-4">
                    <div className="font-bold text-slate-600">{lead.email}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{lead.phone}</div>
                  </td>
                  <td className="py-5 pr-4">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-tighter border border-slate-200">{lead.source}</span>
                  </td>
                  <td className="py-5 pr-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                      lead.status === 'New' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                      lead.status === 'Hot' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-5 pr-4 text-xs font-bold text-slate-500">{lead.lastContact}</td>
                  <td className="py-5 text-right">
                    <Link 
                      href={`/dashboard/leads/${lead.id}`}
                      className="inline-flex items-center px-4 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-32 text-center">
                   <div className="flex flex-col items-center">
                      <div className="p-4 bg-slate-50 rounded-full mb-4">
                        <Inbox className="text-slate-300 w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-slate-400 italic">No applicants found matching this status.</p>
                      <button onClick={() => setActiveStatus('All')} className="mt-4 text-xs text-emerald-600 font-bold underline">Clear Status Filters</button>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION CONTROLS --- */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
          Showing <span className="text-slate-800">{filteredByStatus.length > 0 ? startIndex + 1 : 0}</span> to <span className="text-slate-800">{Math.min(startIndex + itemsPerPage, filteredByStatus.length)}</span> of {filteredByStatus.length} Leads
        </p>
        
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                  currentPage === i + 1 
                  ? 'bg-slate-900 text-white shadow-lg scale-110' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}