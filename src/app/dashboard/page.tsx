"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { createClient } from '@/utils/supabase/client';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  MessageSquareWarning, 
  Loader2,
  ArrowRight,
  Phone,
  Mail,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardHome() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [priorityApplicants, setPriorityApplicants] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    qualified: 0,
    disqualified: 0,
    interviews: 0,
    needsContact: 0
  });

  const getDashboardStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('client_profiles')
        .select('company_id')
        .eq('auth_user_id', user.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) return;

      // Fetch Junction records with Applicant details included for the Inbox
      const { data, error } = await supabase
        .from('applicant_status_bucket_applicant')
        .select(`
          applicant_id,
          applicant:applicants (
            id,
            first_name,
            last_name,
            email,
            mobile,
            created_at
          ),
          bucket:applicant_pipeline_status_buckets (
            name,
            pipeline:applicant_pipelines (
              job:job_postings (title, company_id)
            )
          )
        `);

      if (error) throw error;

      const [msgRes, callRes] = await Promise.all([
        supabase.from('messages').select('applicant_id'),
        supabase.from('calls').select('applicant_id')
      ]);

      const contactedIds = new Set([
        ...(msgRes.data || []).map(m => m.applicant_id),
        ...(callRes.data || []).map(c => c.applicant_id)
      ]);

      const companyApplicants = (data || []).filter(
        (item: any) => item.bucket?.pipeline?.job?.company_id === companyId
      );

      let qCount = 0, dCount = 0, iCount = 0, ncCount = 0;
      const needsContactList: any[] = [];

      companyApplicants.forEach((item: any) => {
        const bucketName = (item.bucket?.name || "").toLowerCase();
        const isRejected = ['rejected', 'not qualified', 'archived', 'not interested', 'disqualified', 'declined'].some(s => bucketName.includes(s));
        const isQualified = !isRejected && ['interview', 'qualified', 'technical', 'offer', 'hired', 'shortlist', 'vetted'].some(s => bucketName.includes(s));

        if (isQualified) qCount++;
        else if (isRejected) dCount++;
        if (bucketName.includes('interview')) iCount++;

        if (!contactedIds.has(item.applicant_id)) {
          ncCount++;
          // Add to the priority list if they haven't been contacted
          needsContactList.push({
            id: item.applicant.id,
            name: `${item.applicant.first_name} ${item.applicant.last_name}`,
            job: item.bucket?.pipeline?.job?.title,
            date: new Date(item.applicant.created_at).toLocaleDateString()
          });
        }
      });

      setStats({
        total: companyApplicants.length,
        qualified: qCount,
        disqualified: dCount,
        interviews: iCount,
        needsContact: ncCount
      });
      
      // Show top 5 most recent applicants needing contact
      setPriorityApplicants(needsContactList.slice(0, 5));

    } catch (err) {
      console.error("Dashboard Stats Error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    getDashboardStats();
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applicant_status_bucket_applicant' }, () => getDashboardStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, getDashboardStats]);

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar title="Executive Overview" subtitle="Real-time recruiting performance." />
        
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* --- CORE METRICS --- */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <MetricCard title="Total Applicants" value={stats.total} icon={<Users />} color="blue" loading={loading} />
            <MetricCard title="Qualified" value={stats.qualified} icon={<UserCheck />} color="emerald" loading={loading} />
            <MetricCard title="Disqualified" value={stats.disqualified} icon={<UserX />} color="slate" loading={loading} />
            <MetricCard title="Interviews" value={stats.interviews} icon={<Calendar />} color="indigo" loading={loading} />
            <MetricCard title="Needs Contact" value={stats.needsContact} icon={<MessageSquareWarning />} color="amber" isAlert loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: PRIORITY INBOX */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquareWarning size={18} className="text-amber-500" /> Priority Outreach Inbox
                  </h3>
                  <Link href="/dashboard/all-applicants" className="text-xs font-bold text-indigo-600 hover:underline">View All</Link>
                </div>
                
                <div className="divide-y divide-slate-50">
                  {priorityApplicants.length > 0 ? (
                    priorityApplicants.map((app) => (
                      <div key={app.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                            {app.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{app.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{app.job} • Applied {app.date}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Link href={`/dashboard/leads/${app.id}`} className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                             <ArrowRight size={14} />
                           </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-slate-400 text-xs font-medium italic">
                      Inbox clear! All candidates have been contacted.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: INTERVIEW SCHEDULE & QUICK STATS */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-500" /> Today's Schedule
                 </h3>
                 <div className="space-y-4">
                    <div className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 border border-slate-100">
                       <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><Clock size={16}/></div>
                       <div>
                          <p className="text-xs font-bold text-slate-800">No interviews today</p>
                          <p className="text-[10px] text-slate-500">Check the calendar for tomorrow.</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-indigo-600 rounded-2xl p-6 shadow-lg shadow-indigo-100 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xs font-bold opacity-80 uppercase tracking-widest mb-4">Hiring Velocity</h3>
                  <p className="text-4xl font-black mb-1">3.8 Days</p>
                  <p className="text-[10px] opacity-70 font-medium">Average time from applied to first contact this week.</p>
                </div>
                <Activity size={80} className="absolute -right-4 -bottom-4 opacity-10 rotate-12" />
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, isAlert, loading }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-50 text-slate-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className={`bg-white p-5 rounded-xl border ${isAlert && value > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'} shadow-sm relative transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-2">
        <p className={`text-[10px] font-black uppercase tracking-widest ${isAlert && value > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{title}</p>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          {React.cloneElement(icon, { size: 18 })}
        </div>
      </div>
      {loading ? (
        <Loader2 className="animate-spin text-slate-200" size={20} />
      ) : (
        <h3 className="text-2xl font-black text-slate-800">{value}</h3>
      )}
    </div>
  );
}

function Activity({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
}