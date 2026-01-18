"use client";

import { useState, useMemo, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import LeadTable from "@/components/LeadTable";
import { createClient } from "@/utils/supabase/client";
import { Search, Loader2, AlertTriangle } from "lucide-react";

type LeadStatus = 'New' | 'Working' | 'Hot';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  lastContact: string;
  jobTitle: string; 
}

export default function AllLeadsPage() {
  const supabase = createClient();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      setErrorMessage(null);
      
      try {
        // Removed status/stage entirely from the select query
        const { data, error } = await supabase
          .from('applicants')
          .select('id, first_name, last_name, email, mobile, job_title_id');

        if (error) {
          setErrorMessage(error.message);
        } else if (data) {
          const formattedLeads: Lead[] = data.map((item: any) => ({
            id: item.id,
            name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || "Unnamed Lead",
            email: item.email || "No Email",
            phone: item.mobile || "No Phone",
            source: item.source || "Direct",
            // Since there is no status column, we default everyone to 'New'
            status: 'New' as LeadStatus,
            lastContact: item.last_activity ? new Date(item.last_activity).toLocaleDateString() : 'New',
            jobTitle: item.job_title_id || 'General'
          }));
          
          setLeads(formattedLeads);
        }
      } catch (err: any) {
        setErrorMessage("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [supabase]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const name = lead.name.toLowerCase();
      const email = lead.email.toLowerCase();
      const search = searchTerm.toLowerCase();
      return name.includes(search) || email.includes(search);
    });
  }, [searchTerm, leads]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex bg-[var(--color-background)]">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
          <p className="mt-2 text-slate-500 text-sm font-medium">Fetching database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-[var(--color-background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="All Leads" subtitle={`${filteredLeads.length} leads in database`} />
        
        <main className="flex-1 p-6 overflow-auto">
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-sm">
              <AlertTriangle size={16} /> {errorMessage}
            </div>
          )}

          <div className="mb-6 max-w-md relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm text-[var(--color-foreground)] focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rounded-xl bg-[var(--color-card)] shadow-sm overflow-hidden border border-[var(--color-border)]">
            <LeadTable leads={filteredLeads} />
          </div>
        </main>
      </div>
    </div>
  );
}