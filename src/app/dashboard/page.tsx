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
  Loader2 
} from 'lucide-react';

export default function DashboardHome() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    qualified: 0,
    disqualified: 0,
    interviews: 0,
    needsContact: 0
  });

  /**
   * Core logic to fetch and calculate stats.
   * Defined as a const to satisfy ES5 strict mode requirements.
   */
  const getDashboardStats = useCallback(async () => {
    try {
      // 1. Get user company context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('client_profiles')
        .select('company_id')
        .eq('auth_user_id', user.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) return;

      // 2. Fetch all junction records for this company
      const { data, error } = await supabase
        .from('applicant_status_bucket_applicant')
        .select(`
          applicant_id,
          bucket:applicant_pipeline_status_buckets (
            name,
            pipeline:applicant_pipelines (
              job:job_postings (company_id)
            )
          )
        `);

      if (error) throw error;

      // 3. Fetch activity to determine 'Needs Contact'
      const [msgRes, callRes] = await Promise.all([
        supabase.from('messages').select('applicant_id'),
        supabase.from('calls').select('applicant_id')
      ]);

      const contactedIds = new Set([
        ...(msgRes.data || []).map(m => m.applicant_id),
        ...(callRes.data || []).map(c => c.applicant_id)
      ]);

      // 4. Filter and Calculate
      const companyApplicants = (data || []).filter(
        (item: any) => item.bucket?.pipeline?.job?.company_id === companyId
      );

      let qCount = 0;
      let dCount = 0;
      let iCount = 0;
      let ncCount = 0;

      companyApplicants.forEach((item: any) => {
        const bucketName = (item.bucket?.name || "").toLowerCase();
        
        // Qualification Logic (Priority check for Rejection keywords)
        const isRejected = ['rejected', 'not qualified', 'archived', 'not interested', 'disqualified', 'declined'].some(s => bucketName.includes(s));
        const isQualified = !isRejected && ['interview', 'qualified', 'technical', 'offer', 'hired', 'shortlist', 'vetted'].some(s => bucketName.includes(s));

        if (isQualified) qCount++;
        else if (isRejected) dCount++;
        
        if (bucketName.includes('interview')) iCount++;

        // Needs Contact Logic
        if (!contactedIds.has(item.applicant_id)) ncCount++;
      });

      setStats({
        total: companyApplicants.length,
        qualified: qCount,
        disqualified: dCount,
        interviews: iCount,
        needsContact: ncCount
      });

    } catch (err) {
      console.error("Dashboard Stats Error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /**
   * Effect to handle initial load and real-time subscription
   */
  useEffect(() => {
    getDashboardStats();

    // Set up Realtime Subscription for the junction table
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, and DELETE
          schema: 'public',
          table: 'applicant_status_bucket_applicant',
        },
        () => {
          getDashboardStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, getDashboardStats]);

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar title="Executive Overview" subtitle="Real-time recruiting performance." />
        
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* --- CORE METRICS --- */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <MetricCard title="Total Applicants" value={stats.total} icon={<Users />} color="blue" loading={loading} />
            <MetricCard title="Qualified" value={stats.qualified} icon={<UserCheck />} color="emerald" loading={loading} />
            <MetricCard title="Disqualified" value={stats.disqualified} icon={<UserX />} color="slate" loading={loading} />
            <MetricCard title="Interviews" value={stats.interviews} icon={<Calendar />} color="indigo" loading={loading} />
            <MetricCard title="Needs Contact" value={stats.needsContact} icon={<MessageSquareWarning />} color="amber" isAlert loading={loading} />
          </div>

          {/* Additional Dashboard Content would go here */}
        </main>
      </div>
    </div>
  );
}

/**
 * Reusable Metric Card Component
 */
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